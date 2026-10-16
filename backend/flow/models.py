from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, validate_default=True)


class Source(Model):
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=300)
    text: str = Field(max_length=120_000)
    warning: str = ""


class Claim(Model):
    id: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=3000)
    origin: Literal["explicit", "inferred", "unknown"] = "explicit"
    source_id: str = ""
    quote: str = Field(default="", max_length=4000)
    confirmed: bool = False


class Constraints(Model):
    duration: float = Field(default=45, ge=5, le=3600)
    tolerance: float = Field(default=3, ge=0, le=60)
    wpm: int = Field(default=130, ge=60, le=220)
    min_words: int = Field(default=3, ge=1, le=80)
    max_words: int = Field(default=14, ge=1, le=100)
    silent_seconds: float = Field(default=5, ge=0, le=3600)
    variants: int = Field(default=3, ge=1, le=4)
    must_include: str = Field(default="", max_length=6000)
    forbidden: str = Field(default="", max_length=6000)
    medium: str = Field(default="Анимационный ролик", max_length=150)
    channel: str = Field(default="Внутренняя коммуникация", max_length=200)
    aspect: str = Field(default="16:9", max_length=30)

    @model_validator(mode="after")
    def coherent(self):
        if self.min_words > self.max_words:
            raise ValueError("Минимум слов больше максимума.")
        if self.silent_seconds >= self.duration:
            raise ValueError("Резерв без речи должен быть меньше длительности ролика.")
        return self


class Tone(Model):
    voice: str = Field(default="Спокойный, человеческий, уверенный", max_length=1000)
    formality: int = Field(default=35, ge=0, le=100)
    warmth: int = Field(default=70, ge=0, le=100)
    humor: int = Field(default=15, ge=0, le=100)
    intensity: int = Field(default=40, ge=0, le=100)
    reference: str = Field(default="", max_length=4000)


class Ontoton(Model):
    world: str = Field(default="Реалистический", max_length=500)
    values: str = Field(default="", max_length=3000)
    emotion: str = Field(default="Доверие → интерес → уверенность", max_length=1000)
    narrative: str = Field(default="Линейный, через опыт героя", max_length=1000)
    dynamics: str = Field(default="Раскрывающийся", max_length=200)
    empathy: str = Field(default="", max_length=1000)
    reality: str = Field(default="", max_length=1000)


class Accent(Model):
    id: str = Field(min_length=1, max_length=100)
    claim_id: str = ""
    object: str = Field(min_length=1, max_length=1000)
    intent: Literal["emphasize", "normalize", "implicit", "delay", "open"] = "emphasize"
    means: str = Field(default="Изображение и действие", max_length=1000)
    interpretation: str = Field(default="", max_length=2000)
    undesired: str = Field(default="", max_length=2000)


class NarrativeDesign(Model):
    # Scoped decisions with "auto", not a universal classification of all narratives.
    order: Literal["auto", "chronological", "reordered"] = "auto"
    information: Literal["auto", "less", "same", "more", "variable"] = "auto"
    ending: Literal["auto", "closed", "open"] = "auto"
    perspective: str = Field(default="", max_length=1500)
    com_b: list[Literal["capability", "opportunity", "motivation"]] = Field(default_factory=list, max_length=3)


class ProjectInput(Model):
    id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=250)
    client: str = Field(default="", max_length=250)
    task: str = Field(default="", max_length=20_000)
    audience: str = Field(default="", max_length=4000)
    before: str = Field(default="", max_length=4000)
    desired: str = Field(default="", max_length=4000)
    action: str = Field(default="", max_length=4000)
    success: str = Field(default="", max_length=4000)
    claims: list[Claim] = Field(default_factory=list, max_length=60)
    sources: list[Source] = Field(default_factory=list, max_length=20)
    constraints: Constraints = Field(default_factory=Constraints)
    tone: Tone = Field(default_factory=Tone)
    ontoton: Ontoton = Field(default_factory=Ontoton)
    accents: list[Accent] = Field(default_factory=list, max_length=60)
    effects: list[Literal["knowledge", "beliefs", "values", "emotion", "intention", "action"]] = Field(default_factory=list, max_length=6)
    design: NarrativeDesign = Field(default_factory=NarrativeDesign)

    @model_validator(mode="after")
    def unique_ids(self):
        for field in ("claims", "sources", "accents"):
            ids = [item.id for item in getattr(self, field)]
            if len(ids) != len(set(ids)):
                raise ValueError(f"Повторяющиеся ID в {field}.")
        return self


class Evidence(Model):
    field: str
    value: str
    origin: Literal["explicit", "inferred", "unknown"]
    source_id: str = ""
    quote: str = ""
    reason: str = ""


class Spec(Model):
    communication_goal: str
    audience_start: str
    target_change: str
    viewer_action: str
    main_message: str
    conflict: str
    promise: str
    structure: str
    rationale: str
    evidence: list[Evidence]
    assumptions: list[str]
    questions: list[str]


class Scene(Model):
    id: str
    title: str
    duration: float = Field(gt=0, le=3600)
    visual: str
    speech: str
    purpose: str
    claim_ids: list[str]
    accent_ids: list[str]
    # The chosen intensity/interpretation belongs to the author, not to measured viewers.
    emotion: str


class Variant(Model):
    id: str
    title: str
    approach: str
    logline: str
    rationale: str
    tradeoff: str
    scenes: list[Scene] = Field(min_length=1, max_length=40)


class VariantSet(Model):
    variants: list[Variant] = Field(min_length=1, max_length=4)


class GenerationRequest(Model):
    project: ProjectInput
    mode: Literal["llm", "template"] = "llm"
    model: str = Field(default="", max_length=150)


class VariantsRequest(GenerationRequest):
    spec: Spec
    fingerprint: str
    approved: bool = False


class ReviewRequest(Model):
    project: ProjectInput
    variants: list[Variant]


class Check(Model):
    code: str
    label: str
    status: Literal["pass", "warn", "fail", "manual"]
    detail: str
    scene_id: str = ""


class ProjectSave(Model):
    expected_revision: int | None = Field(default=None, ge=0)
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,100}$")
    data: dict
