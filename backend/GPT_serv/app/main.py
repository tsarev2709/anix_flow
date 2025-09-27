"""Точка входа GPT-прокси Anix Flow."""

import hashlib
import json

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from . import schemas
from .cache import get_cached_response, redis_client, set_cached_response
from .config import get_settings
from .services.gpt import call_gpt

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def verify_auth(x_anix_token: str = Header(..., alias="X-Anix-Token")) -> None:
        if x_anix_token != settings.auth_shared_secret:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @app.post("/scripts", response_model=schemas.ScriptResponse, dependencies=[Depends(verify_auth)])
    async def generate_script(payload: schemas.ScriptRequest) -> schemas.ScriptResponse:
        cache_key = hashlib.sha256(
            f"{payload.prompt}|{payload.narrator}|{payload.scenes_count}".encode("utf-8")
        ).hexdigest()

        cached = await get_cached_response(cache_key)
        if cached:
            return schemas.ScriptResponse.model_validate(cached)

        system_prompt = (
            "You are a helpful assistant generating structured video scripts for Anix Flow."
        )
        user_prompt = json.dumps(
            {
                "prompt": payload.prompt,
                "narrator": payload.narrator,
                "scenes_count": payload.scenes_count,
            }
        )
        response = await call_gpt(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.get("content")
        if not content:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Empty GPT response")

        try:
            payload_dict = json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid JSON from GPT") from exc

        script = schemas.ScriptResponse.model_validate(payload_dict)

        await set_cached_response(cache_key, script.model_dump(mode="json"))
        return script

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        await redis_client.close()

    return app


app = create_app()
