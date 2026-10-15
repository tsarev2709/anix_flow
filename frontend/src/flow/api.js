import { inputKey, SPEC_LABELS } from './data';

export async function request(base, path, data, method = 'POST') {
  let response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/api/flow${path}`, {
      method, headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      ...(data !== undefined ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {}),
      signal: AbortSignal.timeout(650000),
    });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError' ? 'Сервер не ответил вовремя. Проверь нагрузку модели.' : 'Локальный API недоступен. Запусти start-flow.cmd на компьютере и проверь адрес в настройках.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(body.detail) ? body.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join('; ') : body.detail;
    throw new Error(detail || `Ошибка API: ${response.status}`);
  }
  return body;
}

export function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function markdown(project) {
  const c = project.constraints;
  const freshBrief = project.brief?.inputKey === inputKey(project);
  const freshResult = project.result?.inputKey === inputKey(project) && project.result?.specKey === JSON.stringify(project.brief?.spec);
  const freshReports = project.result?.reviewKey === JSON.stringify({ input: JSON.parse(inputKey(project)), variants: project.result?.variants || [] });
  const lines = [`# ${project.title}`, '', `Клиент: ${project.client || 'не указан'}`, `Экспорт: ${new Date().toISOString()}`, '',
    '## Задача', project.task, '', '## Аудитория и результат', project.audience, `До: ${project.before}`, `После: ${project.desired}`, `Действие: ${project.action}`, `Проверка: ${project.success}`, '',
    '## Ограничения', `Длительность: ${c.duration} ± ${c.tolerance} с. Речь: ${c.wpm} слов/мин. Предложение: ${c.min_words}–${c.max_words} слов. Без речи: ${c.silent_seconds} с.`,
    `Обязательно (точные фразы в речи): ${c.must_include || 'не задано'}`, `Исключить: ${c.forbidden || 'не задано'}`, '',
    '## Онтотон (рабочая авторская модель)', ...Object.entries(project.ontoton).map(([key, value]) => `${key}: ${value}`), '',
    '## Tone of voice', ...Object.entries(project.tone).map(([key, value]) => `${key}: ${value}`), '',
    '## Утверждения и источники', ...project.claims.map(claim => `- ${claim.id}: ${claim.text} [${claim.origin}; подтверждено: ${claim.confirmed ? 'да' : 'нет'}]${claim.source_id ? ` — ${claim.source_id}: «${claim.quote}»` : ''}`), '',
    '## Акценты', ...project.accents.map(a => `- ${a.id} / ${a.claim_id}: ${a.object} → ${a.intent}. ${a.means}. Ожидаемое прочтение: ${a.interpretation}. Нежелательное: ${a.undesired}`)];
  if (project.brief) {
    lines.push('', '## ТЗ на драматургию', `Режим: ${project.brief.mode}. Согласовано: ${freshBrief && project.brief.approved ? 'да' : 'нет'}. Актуально: ${freshBrief ? 'да' : 'нет'}.`,
      ...Object.entries(project.brief.spec).filter(([, v]) => typeof v === 'string').map(([k, v]) => `### ${SPEC_LABELS[k] || k}\n${v}`),
      '### Предположения', ...project.brief.spec.assumptions.map(x => `- ${x}`),
      '### Открытые вопросы', ...project.brief.spec.questions.map(x => `- ${x}`));
  }
  if (project.result) {
    lines.push('', '## Сценарии', `Режим: ${project.result.mode}. Актуальны: ${freshResult ? 'да' : 'нет'}. Проверки актуальны: ${freshReports ? 'да' : 'нет'}. Выбран: ${freshResult && freshReports && project.brief?.approved ? project.selected || 'не выбран' : 'требуется новое согласование и проверка'}.`);
    for (const v of project.result.variants) {
      lines.push('', `### ${v.title}`, v.logline, `Принцип: ${v.approach}`, `Обоснование: ${v.rationale}`, `Компромисс: ${v.tradeoff}`);
      let cursor = 0;
      for (const s of v.scenes) {
        lines.push('', `#### ${s.title} · ${cursor.toFixed(1)}–${(cursor + s.duration).toFixed(1)} с`, `Изображение: ${s.visual}`, `Речь: ${s.speech || '[без речи]'}`, `Задача: ${s.purpose}`, `Смыслы: ${s.claim_ids.join(', ')}. Акценты: ${s.accent_ids.join(', ')}.`);
        cursor += s.duration;
      }
      const report = project.result.reports?.find(r => r.variant_id === v.id);
      if (report) lines.push('', '#### Проверка', ...report.checks.map(ch => `- [${ch.status}] ${ch.label}: ${ch.detail}`));
    }
  }
  lines.push('', '## Документы', ...project.sources.map(s => `### ${s.name} (${s.id})\n${s.warning || ''}\n${s.text}`));
  return lines.join('\n');
}
