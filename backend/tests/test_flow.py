from io import BytesIO

import httpx
import pytest
from docx import Document
from fastapi.testclient import TestClient
from pydantic import ValidationError
from pypdf import PdfWriter

from flow import llm
from flow.documents import extract
from flow.engine import evidence_issues, fingerprint, review_variant, template_spec, template_variants, words
from flow.main import app
from flow.models import ProjectInput, Source, Spec


@pytest.fixture
def project():
    return ProjectInput(id="test-project", title="Первый день", task="Помочь обратиться к наставнику",
                        audience="Новые сотрудники", before="Стесняются спросить", desired="Уверены в поддержке",
                        action="Напиши наставнику свой вопрос.", success="Может назвать действие",
                        claims=[{"id": "C1", "text": "Задавать вопросы совершенно нормально."}],
                        accents=[{"id": "A1", "object": "Обращение", "claim_id": "C1", "intent": "normalize"}])


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FLOW_DATA_DIR", str(tmp_path))
    with TestClient(app) as session:
        yield session


def variant(project):
    return template_variants(project, template_spec(project)).variants[0]


def test_approval_and_staleness(client, project):
    body = {"project": project.model_dump(), "mode": "template"}
    brief = client.post("/api/flow/brief", json=body)
    assert brief.status_code == 200
    info = brief.json()
    request = {**body, "spec": info["spec"], "fingerprint": info["fingerprint"]}
    assert client.post("/api/flow/variants", json=request).status_code == 409
    request["approved"] = True
    result = client.post("/api/flow/variants", json=request)
    assert result.status_code == 200
    assert len(result.json()["variants"]) == 3
    assert result.json()["mode"] == "template"
    request["project"]["tone"]["warmth"] = 90
    assert client.post("/api/flow/variants", json=request).status_code == 409


def test_fingerprint_tracks_sources_and_order(project):
    copy = ProjectInput.model_validate(project.model_dump())
    assert fingerprint(project) == fingerprint(copy)
    copy.desired = "Другое изменение"
    assert fingerprint(project) != fingerprint(copy)


def test_nonoverlapping_timing_and_words(project):
    v = variant(project)
    report = review_variant(project, v)
    assert report["duration"] == 45
    assert report["failures"] == 0
    v.scenes[1].speech = " ".join(["слово"] * 50) + "."
    report = review_variant(project, v)
    assert report["bad_sentences"][0]["words"] == 50
    assert any(ch["code"] == "scene_speech" and ch["status"] == "fail" for ch in report["checks"])


def test_minimum_sentence_words_and_russian_count(project):
    assert words("Кто-то произнёс: «Это всё-таки 2026!»") == ["Кто-то", "произнёс", "Это", "всё-таки", "2026"]
    v = variant(project)
    v.scenes[0].speech = "Да!"
    report = review_variant(project, v)
    assert report["bad_sentences"][0]["words"] == 1


def test_pauses_and_duration_are_distinct_checks(project):
    v = variant(project)
    v.scenes[0].duration = 1
    report = review_variant(project, v)
    assert any(ch["code"] == "duration" and ch["status"] == "fail" for ch in report["checks"])
    v.scenes[0].duration = 9
    project.constraints.silent_seconds = 44
    report = review_variant(project, v)
    assert any(ch["code"] == "speech_budget" and ch["status"] == "fail" for ch in report["checks"])


def test_required_phrases_must_be_spoken_and_forbidden_in_visual(project):
    v = variant(project)
    project.constraints.must_include = "Особая обязательная фраза"
    project.constraints.forbidden = "запрещённая фраза"
    v.scenes[0].visual = "Особая обязательная фраза и запрещённая фраза"
    checks = review_variant(project, v)["checks"]
    assert any(ch["code"] == "must_include" and ch["status"] == "fail" for ch in checks)
    assert any(ch["code"] == "forbidden" and ch["status"] == "fail" for ch in checks)


def test_unknown_scene_links_and_duplicate_ids(project):
    v = variant(project)
    v.scenes[0].claim_ids = ["made-up"]
    v.scenes[0].accent_ids = ["fake-accent"]
    v.scenes[0].id = v.scenes[1].id
    coverage = next(ch for ch in review_variant(project, v)["checks"] if ch["code"] == "coverage")
    assert coverage["status"] == "fail"
    assert "made-up" in coverage["detail"] and "fake-accent" in coverage["detail"]


def test_claim_evidence_must_be_literal(project):
    project.sources = [Source(id="s1", name="Бриф", text="Задавать вопросы нормально.")]
    project.claims[0].source_id = "s1"
    project.claims[0].quote = "Совсем другая цитата"
    assert evidence_issues(project)
    project.claims[0].quote = "Задавать вопросы нормально."
    assert not evidence_issues(project)
    project.claims[0].origin = "inferred"
    assert evidence_issues(project)
    project.claims[0].confirmed = True
    assert not evidence_issues(project)


def test_unconfirmed_claim_blocks_generation(client, project):
    project.claims[0].origin = "inferred"
    body = {"project": project.model_dump(), "mode": "template", "spec": template_spec(project).model_dump(),
            "fingerprint": fingerprint(project), "approved": True}
    assert client.post("/api/flow/variants", json=body).status_code == 409


@pytest.mark.parametrize("changes", [{"min_words": 20, "max_words": 10}, {"silent_seconds": 45}, {"wpm": 0}, {"duration": -1}, {"variants": 5}])
def test_invalid_constraints_rejected(client, project, changes):
    body = project.model_dump()
    body["constraints"].update(changes)
    assert client.post("/api/flow/brief", json={"project": body}).status_code == 422


def test_duplicate_semantic_ids_rejected(project):
    body = project.model_dump()
    body["claims"].append(body["claims"][0])
    with pytest.raises(ValidationError):
        ProjectInput.model_validate(body)


def test_upload_utf8_docx_and_scan(client):
    response = client.post("/api/flow/documents", files={"file": ("brief.txt", "Задача клиента".encode())})
    assert response.status_code == 200
    assert response.json()["text"] == "Задача клиента"
    assert client.post("/api/flow/documents", files={"file": ("bad.txt", b"\xff\xfe")}).status_code == 422
    document = Document(); document.add_paragraph("Важный тезис")
    table = document.add_table(rows=1, cols=2); table.cell(0, 0).text = "Цель"; table.cell(0, 1).text = "Действие"
    buffer = BytesIO(); document.save(buffer)
    response = client.post("/api/flow/documents", files={"file": ("brief.docx", buffer.getvalue())})
    assert response.status_code == 200 and "Цель | Действие" in response.json()["text"]
    pdf = PdfWriter(); pdf.add_blank_page(width=100, height=100); buffer = BytesIO(); pdf.write(buffer)
    assert client.post("/api/flow/documents", files={"file": ("scan.pdf", buffer.getvalue())}).status_code == 422
    assert client.post("/api/flow/documents", files={"file": ("image.png", b"data")}).status_code == 422


def test_context_does_not_silently_truncate(client, project, monkeypatch):
    monkeypatch.setenv("FLOW_MAX_CONTEXT_CHARS", "10")
    response = client.post("/api/flow/brief", json={"project": project.model_dump(), "mode": "template"})
    assert response.status_code == 413


def test_sqlite_backups_roundtrip(client, project):
    data = {"id": project.id, "data": project.model_dump()}
    assert client.put(f"/api/flow/projects/{project.id}", json=data).status_code == 200
    records = client.get("/api/flow/projects").json()["projects"]
    assert records[0]["data"]["task"] == project.task
    assert client.put("/api/flow/projects/different", json=data).status_code == 422


def test_untrusted_origin_cannot_mutate(client, project):
    response = client.post("/api/flow/brief", headers={"Origin": "https://untrusted.example"},
                           json={"project": project.model_dump(), "mode": "template"})
    assert response.status_code == 403
    response = client.options("/api/flow/brief", headers={"Origin": "http://127.0.0.1:3000", "Access-Control-Request-Method": "POST"})
    assert response.status_code == 200


def test_model_is_not_silently_replaced_by_templates(client, project, monkeypatch):
    async def fail(*args, **kwargs):
        raise llm.ModelError("Модель недоступна")
    monkeypatch.setattr(llm, "generate", fail)
    response = client.post("/api/flow/brief", json={"project": project.model_dump()})
    assert response.status_code == 502 and "Модель недоступна" in response.json()["detail"]


def test_hallucinated_quote_rejected(client, project, monkeypatch):
    async def bad_quote(*args, **kwargs):
        spec = template_spec(project)
        spec.evidence[0].source_id = "missing"
        spec.evidence[0].quote = "invented"
        return spec
    monkeypatch.setattr(llm, "generate", bad_quote)
    assert client.post("/api/flow/brief", json={"project": project.model_dump()}).status_code == 502


@pytest.mark.asyncio
async def test_ollama_schema_and_repair(project, monkeypatch):
    requests = []
    valid = template_spec(project).model_dump_json()
    def handler(request):
        import json
        requests.append(json.loads(request.content))
        content = '{"broken": true}' if len(requests) == 1 else valid
        return httpx.Response(200, json={"message": {"content": content}})
    real_client = httpx.AsyncClient
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    monkeypatch.setenv("FLOW_LLM_PROVIDER", "ollama")
    result = await llm.generate(Spec, "brief")
    assert result.main_message == project.claims[0].text
    assert len(requests) == 2
    assert requests[0]["format"]["type"] == "object" and requests[0]["think"] is False


@pytest.mark.asyncio
async def test_compatible_provider_uses_structured_output(project, monkeypatch):
    def handler(request):
        import json
        body = json.loads(request.content)
        assert request.url.path == "/v1/chat/completions"
        assert body["response_format"]["type"] == "json_schema"
        return httpx.Response(200, json={"choices": [{"message": {"content": template_spec(project).model_dump_json()}}]})
    real_client = httpx.AsyncClient
    monkeypatch.setattr(llm.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    monkeypatch.setenv("FLOW_LLM_PROVIDER", "compatible")
    monkeypatch.setenv("FLOW_LLM_BASE_URL", "http://localhost:1234/v1")
    assert (await llm.generate(Spec, "brief")).viewer_action == project.action
