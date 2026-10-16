import React from 'react';
import { ArrowRight, Compass, FileCheck2, GitBranch } from 'lucide-react';
import { inputKey, inputOf } from './data';
import { Pill, SectionTitle, Notice } from './UI';

export const PRODUCTION = [
  ['E01', 'Бриф', 'Задача, материалы и уточнения', 'inputs'],
  ['E02', 'Общее ТЗ', 'Драматургия и общие принципы режиссуры', 'spec'],
  ['E03', 'Сценарий', 'Подходы, сцены и проверки', 'variants'],
  ['E04', 'Согласование и правки', 'Решения и адресные замечания', 'review'],
  ['E05', 'Новая версия', 'Цикл правок и сравнение изменений', null],
  ['E06', 'Подробная режиссура', 'Постановочное ТЗ по выбранному сценарию', null],
  ['E07', 'Экспликация', 'Замысел и решения по сценам', null],
  ['E08', 'Визуальные референсы', 'Аннотированная доска решений', null],
  ['E09', 'Персонажи', 'Паспорта, ракурсы и постоянство', null],
  ['E10', 'Визуалы', 'Изображения и выбор дублей', null],
  ['E11', 'Видео', 'Движение, клипы и версии', null],
  ['E12', 'Цвет сцены', 'Коррекция и производные', null],
  ['E13', 'Монтаж и мастер', 'Таймлайн, звук, рендер и выдача', null],
];

export function projectProgress(p) {
  const key = inputKey(p);
  const briefFresh = !!p.brief && p.brief.inputKey === key;
  const approved = briefFresh && p.brief.approved;
  const variants = p.result?.variants || [];
  const resultFresh = !!p.result && p.result.inputKey === key && p.result.specKey === JSON.stringify(p.brief?.spec);
  const reportsFresh = !!p.result && p.result.reviewKey === JSON.stringify({ input: inputOf(p), variants });
  const selected = variants.find(v => v.id === p.selected);
  const selectedReport = p.result?.reports?.find(r => r.variant_id === selected?.id);
  const selectionValid = !!selected && !!selectedReport && !selectedReport.failures && resultFresh && reportsFresh && approved;
  let next = ['inputs', 'Заполнить задачу и материалы'];
  if (p.task.trim()) next = ['meaning', 'Уточнить аудиторию и изменение'];
  if (p.task.trim() && p.audience.trim() && p.desired.trim()) next = ['spec', p.brief && !briefFresh ? 'Обновить ТЗ после изменений' : 'Собрать и согласовать ТЗ'];
  if (approved) next = ['variants', 'Разработать или выбрать сценарий'];
  if (approved && variants.length && resultFresh) next = [reportsFresh ? 'variants' : 'review', reportsFresh ? 'Сравнить варианты и выбрать' : 'Пересчитать проверки после правок'];
  if (selectionValid) next = ['review', 'Проверить выбранный сценарий редактором'];
  return { briefFresh, approved, resultFresh, reportsFresh, selected, selectionValid, next };
}

export default function Overview({ p, setStage }) {
  const state = projectProgress(p);
  const warnings = [
    p.brief && !state.briefFresh && 'ТЗ относится к прежним входным данным.',
    p.result && !state.resultFresh && 'Сценарии относятся к прежней задаче или ТЗ.',
    p.result && !state.reportsFresh && 'Проверки сценариев требуют пересчёта.',
    p.selected && !state.selectionValid && 'Выбор сценария требует повторной проверки.',
  ].filter(Boolean);
  const statuses = {
    E01: p.task.trim() ? 'Черновик' : 'Начать',
    E02: state.approved ? 'ТЗ согласовано' : p.brief ? state.briefFresh ? 'На редактуре' : 'Устарело' : 'Не собрано',
    E03: state.selectionValid ? 'Вариант выбран' : p.result ? state.resultFresh ? 'Есть варианты' : 'Устарело' : 'Не создан',
    E04: p.result ? state.reportsFresh && state.resultFresh ? 'Формальная проверка' : 'Нужен пересчёт' : 'Нет сценария',
  };
  return <><SectionTitle eyebrow="РАБОЧАЯ ОБЛАСТЬ ПРОЕКТА" title="Из задачи — в производство" description="Весь маршрут, текущие решения и следующий шаг в одном месте." />
    <section className="flow-card next-step"><div><Pill color="purple">Ближайшее действие</Pill><h2>{state.next[1]}</h2><p>{p.client || 'Клиент пока не указан'} · {p.title}</p></div><button className="primary-button" onClick={() => setStage(state.next[0])}>Продолжить <ArrowRight size={16} /></button></section>
    <div className="overview-metrics">{[[Compass, 'Материалы', `${p.sources.length} источников · ${p.claims.length} смыслов`], [FileCheck2, 'ТЗ', statuses.E02], [GitBranch, 'Сценарий', state.selectionValid ? state.selected.title : statuses.E03]].map(([Icon, title, value]) => <section className="flow-card" key={title}><Icon size={18} /><span>{title}</span><strong>{value}</strong></section>)}</div>
    {warnings.length > 0 && <Notice warning>{warnings.map(text => <p key={text}>{text}</p>)}</Notice>}
    <section className="flow-card"><SectionTitle title="Маршрут производства" description="Сейчас работает драматургическая мастерская. Следующие этапы описаны в Linear и будут подключаться по мере реализации." />
      <div className="production-route">{PRODUCTION.map(([id, title, description, stage]) => <div className="production-row" key={id}><span className="production-code">{id}</span><div><strong>{title}</strong><p>{description}</p>{(id === 'E02' || id === 'E04') && <small>{id === 'E02' ? 'Пока: ТЗ на драматургию; общие режиссёрские поля запланированы.' : 'Пока: формальная и редакторская проверка; клиентский review запланирован.'}</small>}</div><Pill color={!stage ? '' : (id === 'E02' && state.approved) || (id === 'E03' && state.selectionValid) ? 'green' : 'purple'}>{stage ? statuses[id] : 'Запланировано'}</Pill>{stage && <button className="icon-button" aria-label={`Открыть: ${title}`} onClick={() => setStage(stage)}><ArrowRight size={16} /></button>}</div>)}</div>
    </section><Notice>Черновик сохраняется в этом браузере. Для отдельной копии используй «Экспорт → Сохранить копию в локальный API». Командная БД, вход и производство медиа находятся в плане разработки.</Notice>
  </>;
}
