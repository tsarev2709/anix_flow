"""Pre-generation questions and necessary (not sufficient) feasibility checks."""
import math

from .engine import words
from .models import ProjectInput


def diagnose(project: ProjectInput) -> dict:
    findings = []

    def add(code, priority, stage, question, reason, item_id=""):
        findings.append(dict(code=code, priority=priority, stage=stage,
                             question=question, reason=reason, item_id=item_id))

    for field, stage, question, reason in [
        ("task", "inputs", "Какую задачу клиента решаем?", "Без задачи нельзя обосновать творческие решения."),
        ("audience", "meaning", "Кто смотрит и в какой ситуации?", "От аудитории зависят язык, знания и контекст просмотра."),
        ("desired", "meaning", "Что должно измениться после просмотра?", "Целевое изменение связывает задачу со сценарием."),
        ("before", "meaning", "Что зритель уже знает, чувствует и делает?", "Без исходного состояния нельзя описать требуемый переход."),
        ("success", "meaning", "По какому наблюдению оценим результат?", "Критерий нужен для проверки гипотезы воздействия."),
    ]:
        if not getattr(project, field).strip():
            add("missing_" + field, "question", stage, question, reason)
    if ("action" in project.effects or "intention" in project.effects) and not project.action.strip():
        add("missing_action", "question", "meaning", "Какое действие и в какой момент ожидаем?",
            "Выбран эффект действия или намерения, но поведение пока не описано.")
    if not project.effects:
        add("missing_effects", "question", "meaning", "Какие сферы изменения важны для этой истории?",
            "Знание, переживание и действие требуют разных решений и проверок.")

    sources = {s.id: s for s in project.sources}
    for claim in project.claims:
        if claim.origin != "explicit" and not claim.confirmed:
            add("unconfirmed_claim", "blocker", "meaning", f"Подтвердить или убрать утверждение {claim.id}?",
                claim.text, claim.id)
        if claim.source_id:
            source = sources.get(claim.source_id)
            if not source or not claim.quote or claim.quote not in source.text:
                add("invalid_quote", "blocker", "meaning", f"Где основание утверждения {claim.id}?",
                    "Выбранный источник или дословная цитата не найдены.", claim.id)
    known_claims = {c.id for c in project.claims}
    for accent in project.accents:
        if accent.claim_id and accent.claim_id not in known_claims:
            add("invalid_accent_claim", "blocker", "dramaturgy", f"С каким смыслом связан акцент {accent.id}?",
                f"Утверждение {accent.claim_id} отсутствует.", accent.id)

    c = project.constraints
    # Longest required fragment is a conservative lower bound: fragments can overlap.
    required = list(dict.fromkeys(line.strip().casefold() for line in c.must_include.splitlines() if line.strip()))
    forbidden = list(dict.fromkeys(line.strip().casefold() for line in c.forbidden.splitlines() if line.strip()))
    max_duration = c.duration + c.tolerance
    capacity = max(0, math.floor((max_duration - c.silent_seconds) * c.wpm / 60))
    minimum = max((len(words(line)) for line in required), default=0)
    if minimum > capacity:
        add("mandatory_budget", "blocker", "constraints", "Сократить обязательную речь или увеличить хронометраж?",
            f"Один обязательный фрагмент содержит {minimum} слов. Даже с допуском доступно не больше {capacity} слов при заданных темпе и резерве.")
    for line in required:
        conflicts = [phrase for phrase in forbidden if phrase in line]
        if conflicts:
            add("phrase_conflict", "blocker", "constraints", "Какие формулировки действительно обязательны?",
                f"Обязательный фрагмент «{line}» содержит запрещённое: «{'», «'.join(conflicts)}».")
    if "opportunity" in project.design.com_b:
        add("external_opportunity", "review", "dramaturgy", "Какие условия действия обеспечиваются вне ролика?",
            "Возможность действовать зависит также от доступа, среды и процессов.")
    for field, question in [("values", "Какие ценности определяют выборы и последствия?"),
                            ("empathy", "Кто или что проводит эмоциональный опыт?"),
                            ("reality", "Что служит опорой связности мира?")]:
        if not getattr(project.ontoton, field).strip():
            add("ontoton_" + field, "review", "dramaturgy", question,
                "Можно оставить авторское решение модели, затем проверить его в ТЗ.")
    rank = {"blocker": 0, "question": 1, "review": 2}
    findings.sort(key=lambda item: rank[item["priority"]])
    return {"findings": findings, "blockers": sum(f["priority"] == "blocker" for f in findings),
            "questions": sum(f["priority"] == "question" for f in findings),
            "speech_capacity_with_tolerance": capacity, "required_words_lower_bound": minimum}
