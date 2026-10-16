import { projectSchema } from './schema';

export const STAGES = [
  { id: 'overview', n: '00', name: 'Обзор проекта', caption: 'Маршрут и следующий шаг', icon: 'LayoutDashboard' },
  { id: 'inputs', n: '01', name: 'Задача и материалы', caption: 'Бриф, документы, контекст', icon: 'Files' },
  { id: 'meaning', n: '02', name: 'Смысловая задача', caption: 'Аудитория и изменение', icon: 'Compass' },
  { id: 'dramaturgy', n: '03', name: 'Драматургическая система', caption: 'Онтотон, голос, акценты', icon: 'Orbit' },
  { id: 'constraints', n: '04', name: 'Формат и ограничения', caption: 'Хронометраж, речь, правила', icon: 'SlidersHorizontal' },
  { id: 'spec', n: '05', name: 'ТЗ на драматургию', caption: 'Собрать и согласовать', icon: 'FileCheck2' },
  { id: 'variants', n: '06', name: 'Варианты сценария', caption: 'Разные способы рассказать', icon: 'GitBranch' },
  { id: 'review', n: '07', name: 'Проверка результата', caption: 'Требования и редактура', icon: 'ShieldCheck' },
];

export const INTENTS = [
  ['emphasize', 'Подчеркнуть'], ['normalize', 'Сделать нормой'], ['implicit', 'Оставить неявным'],
  ['delay', 'Раскрыть позже'], ['open', 'Оставить открытым'],
];

export const EFFECTS = [['knowledge', 'Знания'], ['beliefs', 'Убеждения'], ['values', 'Ценности'], ['emotion', 'Переживание'], ['intention', 'Намерение'], ['action', 'Действие']];

export const RESEARCH = [
  { name: 'Онтотон', kind: 'Авторская гипотеза', status: 'Рабочая модель',
    use: 'Четыре слоя: устройство мира, ценности, режим переживания, организация рассказа. Tone of voice описывается отдельно.',
    scope: 'Не является доказанным полным или ортогональным базисом. Реакция зрителя не равна авторскому намерению.' },
  { name: 'GOLEM', kind: 'Вычислительная онтология', status: 'Теоретический ориентир', url: 'https://ontology.golemlab.eu/',
    use: 'Явные сущности и отношения между персонажами, событиями и контекстом.', scope: 'Здесь используется принцип связи сущностей. RDF/OWL-совместимость пока не реализована.' },
  { name: 'Dramatica', kind: 'Теория драматургии', status: 'Теоретический ориентир', url: 'https://dramatica.com/theory/',
    use: 'Различение внешней задачи, личного опыта героя, влияния и отношений.', scope: 'Не навязывает короткому ролику все четыре линии. Полная модель Storyform не реализована.' },
  { name: 'COM-B', kind: 'Исследование изменения поведения', status: 'Диагностическая рамка', url: 'https://doi.org/10.1186/1748-5908-6-42',
    use: 'Проверять, связана ли задача со способностью, возможностью или мотивацией действовать.', scope: 'Видео не обеспечивает физическую возможность действия. Причинный эффект требует исследования.' },
  { name: 'Formal Model of Narratives', kind: 'Исследовательская модель', status: 'Теоретический ориентир', url: 'https://arxiv.org/abs/2103.12872',
    use: 'Разделять сообщение автора и обновление зрительской модели во времени.', scope: 'Численная модель передачи информации в этой версии не реализована.' },
  { name: 'MovieLabs OMC', kind: 'Производственная онтология', status: 'Ориентир расширения', url: 'https://mc.movielabs.com/',
    use: 'Сохранять идентичность сцен, требований, источников и версий.', scope: 'Экспорт в OMC и видеопроизводство относятся к следующим этапам.' },
];

export const SPEC_LABELS = {
  communication_goal: 'Коммуникативная задача', audience_start: 'Исходное состояние аудитории',
  target_change: 'Целевое изменение', viewer_action: 'Действие зрителя', main_message: 'Главный смысл',
  conflict: 'Драматургическое противоречие', promise: 'Зрительское обещание', structure: 'Принцип построения',
  rationale: 'Почему это соответствует задаче',
};

export const uid = (prefix = 'id') => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export function newProject(demo = false) {
  return {
    id: uid('project'), title: demo ? 'Первый день. Первый шаг.' : 'Новая история', client: demo ? 'Демонстрационный проект' : '',
    task: demo ? 'Создать короткий анимационный ролик для новых сотрудников. Показать, что задавать вопросы в первый рабочий день — нормально. Помочь человеку обратиться к наставнику, вместо того чтобы оставаться с трудностью один на один.' : '',
    audience: demo ? 'Новые сотрудники в первую неделю работы. Смотрят ролик в программе адаптации.' : '',
    before: demo ? 'Могут стесняться простых вопросов и бояться показаться некомпетентными. Это гипотеза для проверки с HR.' : '',
    desired: demo ? 'От растерянности — к ощущению поддержки. Знать, что за помощью можно обратиться к наставнику.' : '',
    action: demo ? 'При затруднении написать своему наставнику один конкретный вопрос.' : '',
    success: demo ? 'После просмотра сотрудник может назвать, к кому и с каким вопросом он обратится. Реальное поведение проверим отдельно.' : '',
    claims: demo ? [{ id: 'C1', text: 'Если возник вопрос, обратись к своему наставнику.', origin: 'explicit', source_id: '', quote: '', confirmed: true }] : [],
    sources: [],
    constraints: { duration: 45, tolerance: 3, wpm: 130, min_words: 3, max_words: 14, silent_seconds: 5,
      variants: 3, must_include: '', forbidden: '', medium: 'Анимационный ролик', channel: 'Внутренняя коммуникация', aspect: '16:9' },
    tone: { voice: 'Спокойный, человеческий, уверенный', formality: 35, warmth: 70, humor: 15, intensity: 40, reference: '' },
    ontoton: { world: 'Реалистический', values: demo ? 'Взаимопомощь важнее видимости безошибочности.' : '',
      emotion: 'Доверие → интерес → уверенность', narrative: 'Линейный, через опыт героя', dynamics: 'Раскрывающийся',
      empathy: demo ? 'Новый сотрудник: любопытный, немного растерянный, деятельный.' : '',
      reality: demo ? 'Рабочая команда и доступный наставник.' : '' },
    accents: demo ? [{ id: 'A1', claim_id: 'C1', object: 'Обращение к наставнику', intent: 'normalize', means: 'Будничное действие героя, без торжественной музыки',
      interpretation: 'Просить помощи — естественная часть работы.', undesired: 'Новичок беспомощен и ни на что не способен.' }] : [],
    effects: demo ? ['emotion', 'intention', 'action'] : [],
    design: { order: 'auto', information: 'auto', ending: 'auto', perspective: '', com_b: [] },
    api_revisions: {}, brief: null, result: null, selected: '', approved_checks: {}, revisions: [], updated: new Date().toISOString(),
  };
}

export function inputOf(p) {
  const { id, title, client, task, audience, before, desired, action, success, claims, sources, constraints, tone, ontoton, accents, effects, design } = p;
  return { id, title, client, task, audience, before, desired, action, success, claims, sources, constraints, tone, ontoton, accents, effects, design };
}

export function inputKey(p) { return JSON.stringify(inputOf(p)); }
export function countWords(text = '') { return (text.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) || []).length; }

export function validateProject(p) {
  const c = p.constraints;
  if (!p.task.trim()) return 'Опиши задачу клиента.';
  if (!p.title.trim()) return 'Укажи название проекта.';
  if (c.min_words > c.max_words) return 'Минимум слов в предложении больше максимума.';
  if (c.silent_seconds >= c.duration) return 'Резерв без речи должен быть меньше длительности.';
  const ranges = { duration: [5, 3600], tolerance: [0, 60], wpm: [60, 220], min_words: [1, 80], max_words: [1, 100], silent_seconds: [0, 3600], variants: [1, 4] };
  const labels = { duration: 'Длительность', tolerance: 'Допуск', wpm: 'Темп речи', min_words: 'Минимум слов', max_words: 'Максимум слов', silent_seconds: 'Резерв без речи', variants: 'Количество вариантов' };
  for (const [key, [lo, hi]] of Object.entries(ranges)) {
    if (!Number.isFinite(c[key]) || c[key] < lo || c[key] > hi) return `Значение «${labels[key]}» должно быть от ${lo} до ${hi}.`;
  }
  return '';
}

export function restoreProject(data) {
  if (!data || typeof data !== 'object' || typeof data.id !== 'string' || typeof data.title !== 'string') throw new Error('Файл не содержит проект Anix Flow.');
  const base = newProject();
  const p = { ...base, ...data, constraints: { ...base.constraints, ...data.constraints }, tone: { ...base.tone, ...data.tone }, ontoton: { ...base.ontoton, ...data.ontoton }, design: { ...base.design, ...data.design } };
  for (const key of ['client', 'task', 'audience', 'before', 'desired', 'action', 'success']) if (typeof p[key] !== 'string') throw new Error(`Неверное поле ${key}.`);
  for (const key of ['claims', 'sources', 'accents', 'revisions']) if (!Array.isArray(p[key])) throw new Error(`Неверное поле ${key}.`);
  for (const s of p.sources) if (typeof s.text !== 'string' || typeof s.name !== 'string' || typeof s.id !== 'string') throw new Error('Неверный формат источника.');
  for (const c of p.claims) if (typeof c.text !== 'string' || typeof c.id !== 'string') throw new Error('Неверный формат утверждения.');
  if (p.brief && (!p.brief.spec || !Array.isArray(p.brief.spec.evidence) || !Array.isArray(p.brief.spec.questions) || !Array.isArray(p.brief.spec.assumptions))) throw new Error('Неверный формат ТЗ.');
  if (p.result && (!Array.isArray(p.result.variants) || p.result.variants.some(v => !Array.isArray(v.scenes)))) throw new Error('Неверный формат сценариев.');
  if (!p.approved_checks || typeof p.approved_checks !== 'object') p.approved_checks = {};
  const checked = projectSchema.safeParse(p);
  if (!checked.success) throw new Error('Неверная структура проекта: ' + checked.error.issues[0].path.join('.'));
  return checked.data;
}
