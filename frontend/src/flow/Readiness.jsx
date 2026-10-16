import React, { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { inputKey, validateProject } from './data';
import { request } from './api';
import { Pill, SectionTitle } from './UI';

export default function Readiness({ p, settings, setStage }) {
  const key = inputKey(p);
  const invalid = validateProject(p);
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (invalid) return undefined;
    const timer = setTimeout(async () => {
      try {
        const data = await request(settings.base, '/diagnostics', JSON.parse(key));
        if (!cancelled) setResult({ key, data });
      } catch (e) { if (!cancelled) setResult({ key, error: e.message }); }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [key, settings.base, invalid, retry]);
  const current = result?.key === key ? result : null;
  const data = current?.data;
  return <section className="flow-card readiness-card" aria-label="Уточнения перед сценарием">
    <SectionTitle title="Что уточнить следующим" description="Сначала противоречия, затем вопросы о задаче и авторские решения. Ответы вносятся в исходные поля проекта."
      aside={<button className="icon-button" aria-label="Обновить уточнения" onClick={() => setRetry(n => n + 1)}><RefreshCw size={16} /></button>} />
    {invalid ? <p className="muted">{invalid}</p> : current?.error ? <p className="muted">Уточнения недоступны. {current.error}</p> : !data ? <p className="muted" role="status">Проверяем исходные параметры…</p> : <>
      <div className="readiness-summary"><Pill color={data.blockers ? 'amber' : 'green'}>{data.blockers} противоречий</Pill><Pill>{data.questions} вопросов о задаче</Pill><span>Обязательная речь: минимум {data.required_words_lower_bound} слов · доступно до {data.speech_capacity_with_tolerance} с учётом допуска</span></div>
      {!data.findings.length && <p className="muted">Формальных пробелов не найдено. Это не оценка художественного качества и не прогноз реакции зрителя.</p>}
      {data.findings.map((f, i) => <div className="readiness-item" key={`${f.code}-${f.item_id}-${i}`}><div><Pill color={f.priority === 'blocker' ? 'amber' : ''}>{({ blocker: 'Исправить до сценария', question: 'Уточнить', review: 'Авторское решение' })[f.priority]}</Pill><strong>{f.question}</strong><p>{f.reason}</p></div><button className="text-button" onClick={() => setStage(f.stage)}>Открыть этап <ArrowUpRight size={14} /></button></div>)}
      <p className="field-hint">Вопросы не заполняются догадками. Неизвестное можно сохранить до обсуждения с клиентом. Нулевое число противоречий означает только прохождение перечисленных проверок.</p>
    </>}
  </section>;
}
