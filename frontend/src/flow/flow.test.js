import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import FlowApp from './FlowApp';
import { newProject, inputKey, inputOf, restoreProject, countWords, validateProject } from './data';
import { markdown } from './api';

global.IS_REACT_ACT_ENVIRONMENT = true;

test('a project roundtrips and input changes invalidate a result key', () => {
  const p = newProject(true);
  const restored = restoreProject(JSON.parse(JSON.stringify(p)));
  expect(inputOf(restored)).toEqual(inputOf(p));
  const initial = inputKey(p);
  p.tone.warmth = 99;
  expect(inputKey(p)).not.toBe(initial);
  expect(countWords('Кто-то произнёс: «Это всё-таки 2026!»')).toBe(5);
  expect(validateProject(p)).toBe('');
  p.constraints.silent_seconds = 45;
  expect(validateProject(p)).toMatch('Резерв');
});

test('import rejects malformed nested structures and export preserves authored content', () => {
  const p = newProject(true);
  expect(() => restoreProject({ ...p, tone: { ...p.tone, voice: {} } })).toThrow('структура');
  expect(() => restoreProject({ ...p, sources: [{ id: 's', name: 'doc', text: 42 }] })).toThrow();
  expect(() => restoreProject({ ...p, accents: [null] })).toThrow();
  const result = markdown(p);
  expect(result).toContain(p.task);
  expect(result).toContain(p.claims[0].text);
  expect(result).toContain(p.accents[0].interpretation);
});

describe('workbench workflow', () => {
  let container, root;
  beforeEach(() => {
    localStorage.clear();
    HTMLElement.prototype.scrollTo = jest.fn();
    AbortSignal.timeout = jest.fn(() => undefined);
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); });
  const click = (container, text) => {
    const node = [...container.querySelectorAll('button')].find(b => b.textContent.trim() === text);
    expect(node).toBeTruthy(); act(() => Simulate.click(node)); return node;
  };
  const navigate = (container, id) => {
    const order = ['inputs', 'meaning', 'dramaturgy', 'constraints', 'spec', 'variants', 'review'];
    act(() => Simulate.click(container.querySelectorAll('.stage-nav')[order.indexOf(id)]));
  };

  test('all editing stages render and a project persists across reload', async () => {
    await act(async () => root.render(<FlowApp />));
    expect(container.textContent).toContain('Из задачи');
    for (const id of ['meaning', 'dramaturgy', 'constraints', 'spec', 'variants', 'review']) navigate(container, id);
    navigate(container, 'dramaturgy');
    click(container, 'Голос и ритм'); expect(container.textContent).toContain('Tone of voice');
    click(container, 'Смысловые акценты'); expect(container.textContent).toContain('Нежелательное прочтение');
    navigate(container, 'inputs');
    const title = [...container.querySelectorAll('label')].find(l => l.textContent.includes('Название проекта')).querySelector('input');
    act(() => Simulate.change(title, { target: { value: 'Новая адаптация' } }));
    await act(async () => new Promise(resolve => setTimeout(resolve, 500)));
    expect(JSON.parse(localStorage.getItem('anix_flow_workbench_v2')).projects[0].title).toBe('Новая адаптация');
    act(() => root.unmount()); root = createRoot(container);
    await act(async () => root.render(<FlowApp />));
    expect(container.textContent).toContain('Новая адаптация');
  });

  test('brief approval enables variants, scene edits invalidate checks, source edits invalidate approval', async () => {
    const spec = { communication_goal: 'Задача', audience_start: 'Начало', target_change: 'Изменение', viewer_action: 'Задай вопрос наставнику.',
      main_message: 'Задавать вопросы совершенно нормально.', conflict: 'Стесняется попросить помощи', promise: 'Помощь рядом', structure: 'Выбор', rationale: 'Мотивация', evidence: [], assumptions: [], questions: [] };
    const scenes = [{ id: 's1', title: 'Первый вопрос', duration: 45, speech: 'Задай вопрос своему наставнику.', visual: 'Человек пишет вопрос.',
      purpose: 'Поддержка', claim_ids: ['C1'], accent_ids: ['A1'], emotion: 'Уверенность' }];
    const variants = [{ id: 'v1', title: 'Выбор героя', approach: 'Личный выбор', logline: 'Один вопрос меняет первый день', rationale: 'Герой действует', tradeoff: 'Проверить ситуацию', scenes }];
    const reports = [{ variant_id: 'v1', duration: 45, words: 4, speech_seconds: 2, bad_sentences: [], checks: [{ code: 'duration', label: 'Хронометраж', status: 'pass', detail: '45 с', scene_id: '' }], passes: 1, failures: 0 }];
    global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => url.endsWith('/brief')
      ? { spec, fingerprint: 'test-sha', mode: 'llm', model: 'test-model' }
      : { variants, reports, fingerprint: 'test-sha', mode: 'llm', model: 'test-model' } }));
    await act(async () => root.render(<FlowApp />));
    navigate(container, 'spec');
    await act(async () => { click(container, 'Собрать ТЗ с моделью'); });
    expect(container.textContent).toContain('На редактуре');
    click(container, 'Согласовать ТЗ');
    expect(container.textContent).toContain('ТЗ согласовано');
    navigate(container, 'variants');
    await act(async () => { click(container, 'Создать варианты'); });
    expect(container.textContent).toContain('Один вопрос меняет первый день');
    const select = click(container, 'Выбрать вариант'); expect(select.disabled).toBe(false);
    const speech = [...container.querySelectorAll('label')].find(l => l.textContent.includes('ПРОИЗНОСИМЫЙ ТЕКСТ')).querySelector('textarea');
    act(() => Simulate.change(speech, { target: { value: 'Задай первый вопрос.' } }));
    expect(container.textContent).toContain('пересчитать проверки');
    expect([...container.querySelectorAll('button')].find(b => b.textContent.trim() === 'Выбрать вариант').disabled).toBe(true);
    navigate(container, 'inputs');
    const task = [...container.querySelectorAll('label')].find(l => l.textContent.includes('Задача клиента')).querySelector('textarea');
    act(() => Simulate.change(task, { target: { value: 'Изменённая задача клиента' } }));
    navigate(container, 'spec');
    expect(container.textContent).toContain('Входные данные изменились');
    expect([...container.querySelectorAll('button')].find(b => b.textContent.trim() === 'Согласовать ТЗ').disabled).toBe(true);
  });
});
