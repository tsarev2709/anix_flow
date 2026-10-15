import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

load_dotenv(Path(__file__).parents[1] / ".env", override=False)

from . import documents, llm, storage
from .engine import evidence_issues, fingerprint, prompt_for, review_variant, template_spec, template_variants
from .models import GenerationRequest, ProjectSave, ReviewRequest, Spec, VariantsRequest, VariantSet

app = FastAPI(title="Anix Flow · Dramaturgy API", version="0.2.0")
origins = [origin.strip() for origin in os.getenv("FLOW_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://tsarev2709.github.io").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST", "PUT", "OPTIONS"], allow_headers=["Content-Type"])


@app.middleware("http")
async def local_request_boundary(request: Request, call_next):
    # Binding to loopback plus Origin checking prevents other websites from driving a local LLM.
    origin = request.headers.get("origin")
    if request.method not in ("GET", "HEAD", "OPTIONS") and origin and origin not in origins:
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Этот origin не разрешён в FLOW_CORS_ORIGINS."}, status_code=403)
    if request.method in ("POST", "PUT"):
        # Upload has its own streaming size cap; JSON requests also get a real byte limit.
        if request.url.path != "/api/flow/documents":
            body = await request.body()
            if len(body) > 4 * 1024 * 1024:
                from fastapi.responses import JSONResponse
                return JSONResponse({"detail": "Запрос больше 4 МБ. Уменьши документы."}, status_code=413)
    return await call_next(request)


@app.get("/api/flow/health")
async def health():
    return {"ok": True, "version": "0.2.0", "storage": "sqlite-local", **await llm.status()}


@app.post("/api/flow/documents")
async def upload(file: UploadFile = File(...)):
    data = await file.read(documents.MAX_UPLOAD + 1)
    await file.close()
    if len(data) > documents.MAX_UPLOAD:
        raise HTTPException(413, "Файл больше 12 МБ.")
    name = Path((file.filename or "document.txt").replace("\\", "/")).name[:300]
    try:
        text, warning = await run_in_threadpool(documents.extract, name, data)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return {"id": "src-" + uuid.uuid4().hex[:12], "name": name, "text": text, "warning": warning}


def check_context(request: GenerationRequest):
    length = len(prompt_for(request.project, "brief"))
    limit = int(os.getenv("FLOW_MAX_CONTEXT_CHARS", "60000"))
    if length > limit:
        raise HTTPException(413, f"Входные данные: {length} символов, лимит: {limit}. Выбери нужные фрагменты; данные не обрезаны.")


@app.post("/api/flow/brief")
async def brief(request: GenerationRequest):
    check_context(request)
    try:
        result = template_spec(request.project) if request.mode == "template" else await llm.generate(Spec, prompt_for(request.project, "brief"), request.model)
    except llm.ModelError as exc:
        raise HTTPException(502, str(exc)) from exc
    sources = {source.id: source for source in request.project.sources}
    invalid = [e.field for e in result.evidence if e.source_id and
               (e.source_id not in sources or not e.quote or e.quote not in sources[e.source_id].text)]
    if invalid:
        raise HTTPException(502, "Цитаты модели не найдены в документах: " + ", ".join(invalid) + ". ТЗ не принято; повтори анализ.")
    return {"spec": result.model_dump(), "fingerprint": fingerprint(request.project), "mode": request.mode,
            "model": request.model or llm.configuration()["model"] if request.mode == "llm" else None}


@app.post("/api/flow/variants")
async def variants(request: VariantsRequest):
    if not request.approved:
        raise HTTPException(409, "Сначала согласуй ТЗ на драматургию.")
    if request.fingerprint != fingerprint(request.project):
        raise HTTPException(409, "Входные данные изменились. Обнови и согласуй ТЗ.")
    check_context(request)
    issues = evidence_issues(request.project)
    if issues:
        raise HTTPException(409, "Уточни утверждения перед генерацией: " + "; ".join(issues))
    try:
        result = template_variants(request.project, request.spec) if request.mode == "template" else await llm.generate(
            VariantSet, prompt_for(request.project, "variants", request.spec), request.model)
        reports = [review_variant(request.project, v) for v in result.variants]
        needs_repair = len(result.variants) != request.project.constraints.variants or any(r["failures"] for r in reports)
        if request.mode == "llm" and needs_repair:
            import json
            repair = prompt_for(request.project, "repair_variants", request.spec) + "\nИсправь нарушения, сохранив смысл:\n" + json.dumps(
                {"previous": result.model_dump(), "checks": reports}, ensure_ascii=False)
            result = await llm.generate(VariantSet, repair, request.model)
            reports = [review_variant(request.project, v) for v in result.variants]
    except llm.ModelError as exc:
        raise HTTPException(502, str(exc)) from exc
    if len(result.variants) != request.project.constraints.variants:
        raise HTTPException(502, "Модель вернула неверное число вариантов. Результат не принят; повтори запрос.")
    if len({v.id for v in result.variants}) != len(result.variants):
        raise HTTPException(502, "Модель вернула повторяющиеся ID вариантов. Повтори запрос.")
    return {"variants": [v.model_dump() for v in result.variants], "reports": reports,
            "fingerprint": request.fingerprint, "mode": request.mode,
            "model": request.model or llm.configuration()["model"] if request.mode == "llm" else None}


@app.post("/api/flow/review")
async def review(request: ReviewRequest):
    return {"reports": [review_variant(request.project, v) for v in request.variants]}


@app.get("/api/flow/projects")
def list_projects():
    return {"projects": storage.load_all()}


@app.put("/api/flow/projects/{project_id}")
def save_project(project_id: str, request: ProjectSave):
    if project_id != request.id:
        raise HTTPException(422, "ID проекта не совпадает.")
    return {"id": request.id, "updated": storage.save(request.id, request.data)}
