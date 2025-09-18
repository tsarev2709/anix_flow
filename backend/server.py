from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime
import json

from openai import AsyncOpenAI


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

openai_api_key = os.environ.get("OPENAI_API_KEY")
openai_api_base = os.environ.get("OPENAI_API_BASE")
openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
openai_client: Optional[AsyncOpenAI] = None

if openai_api_key:
    client_kwargs = {"api_key": openai_api_key}
    if openai_api_base:
        client_kwargs["base_url"] = openai_api_base.rstrip("/")
    openai_client = AsyncOpenAI(**client_kwargs)
else:
    logging.getLogger(__name__).warning(
        "OpenAI API key not provided; script generation endpoint will return 503."
    )

SYSTEM_PROMPT = (
    "You are an experienced screenwriter helping to craft concise scene-based scripts. "
    "Always respond with valid JSON matching this structure: "
    "{\n"
    '  "title": string,\n'
    '  "narrator": string,\n'
    '  "scenes": [\n'
    '    { "content": string, "duration": number_of_seconds }\n'
    "  ]\n"
    "}.\n"
    "Generate vivid but succinct scene descriptions written in the third person. "
    "Durations must be integers between 3 and 20 representing seconds. "
    "Do not include any additional commentary outside of the JSON object."
)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


class GenerateScriptRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_prompt: str = Field(..., alias="userPrompt", min_length=1)
    narrator: str = Field(..., min_length=1)
    scenes_count: int = Field(default=5, alias="scenesCount", ge=1, le=20)
    model: Optional[str] = None


class GeneratedScene(BaseModel):
    id: str
    content: str
    duration: float


class GenerateScriptResponse(BaseModel):
    title: str
    narrator: str
    scenes: List[GeneratedScene]


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/generate-script", response_model=GenerateScriptResponse)
async def generate_script(request: GenerateScriptRequest):
    if openai_client is None:
        raise HTTPException(
            status_code=503, detail="Language model client is not configured."
        )

    user_details = (
        f"Create a {request.scenes_count}-scene narrative.\n"
        f"Narrator voice: {request.narrator}.\n"
        f"Project brief: {request.user_prompt}".strip()
    )

    try:
        response = await openai_client.chat.completions.create(
            model=request.model or openai_model,
            temperature=0.2,
            max_tokens=700,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_details},
            ],
        )
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Failed to contact OpenAI API")
        raise HTTPException(
            status_code=502, detail="Failed to generate script."
        ) from exc

    if not response.choices:
        raise HTTPException(
            status_code=502, detail="Language model returned no choices."
        )

    content = (
        response.choices[0].message.content if response.choices[0].message else None
    )
    if not content:
        raise HTTPException(
            status_code=502, detail="Language model returned empty response."
        )

    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON from language model: %s", content)
        raise HTTPException(
            status_code=502, detail="Invalid response format from language model."
        ) from exc

    scenes_raw = payload.get("scenes", [])
    if not isinstance(scenes_raw, list) or not scenes_raw:
        raise HTTPException(
            status_code=502, detail="Language model response is missing scenes."
        )

    scenes: List[GeneratedScene] = []
    for scene in scenes_raw[: request.scenes_count]:
        if not isinstance(scene, dict):
            continue
        content_text = scene.get("content")
        duration_value = scene.get("duration")
        if content_text is None or duration_value is None:
            continue
        try:
            duration_number = float(duration_value)
        except (TypeError, ValueError):
            continue
        scenes.append(
            GeneratedScene(
                id=scene.get("id") or str(uuid.uuid4()),
                content=str(content_text).strip(),
                duration=max(1.0, duration_number),
            )
        )

    if not scenes:
        raise HTTPException(
            status_code=502,
            detail="Language model response did not include valid scenes.",
        )

    title = payload.get("title") or "Untitled Script"
    narrator = payload.get("narrator") or request.narrator

    return GenerateScriptResponse(title=title, narrator=narrator, scenes=scenes)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
