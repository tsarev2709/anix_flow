import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Files, Compass, Orbit, SlidersHorizontal, FileCheck2, GitBranch, ShieldCheck, ArrowUpRight,
  ArrowRight, ArrowLeft, BookOpen, Settings2, Layers3, ChevronDown, Check,
  MoreHorizontal, ChevronRight, Menu, History, Download, Loader2, Clock3, MessageSquare,
  Sparkles, CircleHelp, AlertCircle, X } from 'lucide-react';
import { STAGES, uid, newProject, inputOf, inputKey, validateProject, restoreProject } from './data';
import { request } from './api';
import { Pill } from './UI';
import { Inputs, Meaning, Dramaturgy, Constraints } from './Editors';
import { Specification, Variants } from './Results';
import WorkbenchModals from './WorkbenchModals';
import './flow.css';

const ICONS = { Files, Compass, Orbit, SlidersHorizontal, FileCheck2, GitBranch, ShieldCheck };
const STORE = 'anix_flow_workbench_v2';
const DEFAULT_SETTINGS = { base: process.env.REACT_APP_FLOW_API_BASE || 'http://127.0.0.1:8000', mode: 'llm', model: '' };

function initialState() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return { projects: [newProject(true)], settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const projects = parsed.projects.map(restoreProject);
    return { projects: projects.length ? projects : [newProject()], settings: { ...DEFAULT_SETTINGS, ...parsed.settings }, active: parsed.active };
  } catch (_) {
    try { localStorage.setItem(`${STORE}_recovery_${Date.now()}`, localStorage.getItem(STORE) || ''); } catch (_) { /* full storage */ }
    return { projects: [newProject(true)], settings: DEFAULT_SETTINGS, warning: 'Сохранённые данные не удалось открыть. Исходная запись оставлена в резервном ключе браузера.' };
  }
}

export default function FlowApp() {
  const [initial] = useState(initialState);
  const [projects, setProjects] = useState(initial.projects);
  const [active, setActive] = useState(initial.projects.some(p => p.id === initial.active) ? initial.active : initial.projects[0].id);
  const [settings, setSettings] = useState(initial.settings);
  const [stage, setStage] = useState('inputs');
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState(initial.warning || '');
  const [saved, setSaved] = useState('Браузер');
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const importRef = useRef();
  const mainRef = useRef();
  const p = projects.find(item => item.id === active) || projects[0];
  const key = inputKey(p);
  const briefFresh = p.brief?.inputKey === key;
  const resultFresh = p.result?.inputKey === key && p.result?.specKey === JSON.stringify(p.brief?.spec);
  const approved = briefFresh && p.brief?.approved;
  const variants = p.result?.variants || [];
  const reportsFresh = p.result?.reviewKey === JSON.stringify({ input: inputOf(p), variants });
  const budget = Math.max(0, Math.floor((p.constraints.duration - p.constraints.silent_seconds) * p.constraints.wpm / 60));
  const stateChecks = [!!p.task.trim(), !!(p.audience && p.desired && p.action), !!(p.ontoton.values && p.ontoton.empathy), !validateProject(p), approved, !!variants.length && resultFresh, !!p.result?.reports?.length && resultFresh && reportsFresh];
  const stageIndex = STAGES.findIndex(s => s.id === stage);
  const closeModal = useCallback(() => setModal(''), []);

  function updateFor(id, fn) {
    setProjects(all => all.map(current => {
      if (current.id !== id) return current;
      const next = { ...fn(current), updated: new Date().toISOString() };
      if (inputKey(current) !== inputKey(next)) {
        next.selected = ''; next.approved_checks = {};
        if (next.brief) next.brief = { ...next.brief, approved: false };
      }
      return next;
    }));
  }
  const update = fields => updateFor(p.id, current => ({ ...current, ...fields }));
  const nested = (name, field, value) => update({ [name]: { ...p[name], [field]: value } });

  useEffect(() => {
    setSaved('Сохранение…');
    const timeout = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify({ version: 2, projects, settings, active })); setSaved('Сохранено в браузере'); }
      catch (_) { setSaved('Не сохранено'); setToast('Память браузера заполнена. Экспортируй JSON или сохрани копию в локальный API.'); }
    }, 400);
    return () => clearTimeout(timeout);
  }, [projects, settings, active]);
  useEffect(() => { const timeout = setTimeout(() => setToast(''), 12000); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setMobileNav(false); }, [stage, active]);

  async function checkHealth() {
    setHealth({ checking: true });
    try { setHealth(await request(settings.base, '/health', undefined, 'GET')); }
    catch (e) { setHealth({ connected: false, detail: e.message }); }
  }

  async function generate(which) {
    const error = validateProject(p);
    if (error) { setToast(error); return; }
    if (which === 'variants' && !approved) { setToast('Обнови и согласуй ТЗ на драматургию.'); setStage('spec'); return; }
    const snapshot = p; setBusy(which);
    try {
      const body = { project: inputOf(snapshot), mode: settings.mode, model: settings.model };
      if (which === 'variants') Object.assign(body, { spec: snapshot.brief.spec, fingerprint: snapshot.brief.fingerprint, approved: true });
      const response = await request(settings.base, `/${which}`, body);
      updateFor(snapshot.id, current => which === 'brief'
        ? { ...current, brief: { ...response, approved: false, inputKey: inputKey(snapshot), created: new Date().toISOString() },
          revisions: [...current.revisions, ...(current.brief ? [{ type: 'spec', created: current.brief.created, data: current.brief }] : [])].slice(-20) }
        : { ...current, result: { ...response, inputKey: inputKey(snapshot), specKey: JSON.stringify(snapshot.brief.spec),
            reviewKey: JSON.stringify({ input: inputOf(snapshot), variants: response.variants }), created: new Date().toISOString() }, selected: '', approved_checks: {},
          revisions: [...current.revisions, ...(current.result ? [{ type: 'variants', created: current.result.created, data: current.result }] : [])].slice(-20) });
      setStage(which === 'brief' ? 'spec' : 'variants');
      setToast(settings.mode === 'template' ? 'Создан шаблон для ручной работы. Модель не анализировала документы.' : which === 'brief' ? 'ТЗ готово к редактуре и согласованию.' : 'Варианты готовы. Проверь замечания перед выбором.');
    } catch (e) { setToast(e.message); }
    finally { setBusy(''); }
  }

  async function recheck() {
    const snapshot = p; setBusy('review');
    try {
      const response = await request(settings.base, '/review', { project: inputOf(snapshot), variants: snapshot.result.variants });
      updateFor(snapshot.id, current => ({ ...current, result: { ...current.result, reports: response.reports,
        reviewKey: JSON.stringify({ input: inputOf(snapshot), variants: snapshot.result.variants }) }, approved_checks: {} }));
      setToast('Проверки обновлены. Художественные критерии проверяет редактор.');
    } catch (e) { setToast(e.message); }
    finally { setBusy(''); }
  }

  function createProject(demo = false) {
    const fresh = newProject(demo); setProjects(all => [fresh, ...all]); setActive(fresh.id); setStage('inputs'); setModal('');
  }

  async function importProject(file) {
    if (!file) return;
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('Резервная копия больше 4 МБ.');
      const json = JSON.parse(await file.text());
      const restored = restoreProject(json.project || json);
      restored.id = uid('project'); restored.title += ' · импорт'; restored.approved_checks = {};
      if (restored.brief) restored.brief.approved = false;
      setProjects(all => [restored, ...all]); setActive(restored.id); setStage('inputs'); setToast('Импортирована отдельная копия. ТЗ требует нового согласования.');
    } catch (e) { setToast(e.message); }
    finally { if (importRef.current) importRef.current.value = ''; }
  }

  const editorProps = { p, update, nested, busy };
  return <div className="flow-app"><a className="skip-link" href="#flow-main">К содержимому</a>
    <aside className={`flow-sidebar ${mobileNav ? 'is-open' : ''}`}><a className="brand" href={window.location.pathname}><span className="brand-symbol"><i /><i /><i /><i /></span><span>anix<span className="brand-light">flow</span><small>DRAMATURGY WORKSPACE</small></span></a><div className="workspace-label">ТВОРЧЕСКАЯ ЛАБОРАТОРИЯ <span>v0.2</span></div><button className="project-selector" onClick={() => setModal('projects')}><span className="project-icon"><Layers3 size={18} /></span><span><strong>{p.title}</strong><small>{p.client || 'Личный проект'}</small></span><ChevronDown size={16} /></button><div className="nav-caption">ОТ ЗАМЫСЛА К ПРОИЗВЕДЕНИЮ</div><nav aria-label="Этапы проекта">{STAGES.map((s, i) => { const Icon = ICONS[s.icon]; return <button className={`stage-nav ${stage === s.id ? 'active' : ''}`} aria-current={stage === s.id ? 'step' : undefined} key={s.id} onClick={() => setStage(s.id)}><Icon size={18} strokeWidth={1.6} /><span><strong>{s.name}</strong><small>{s.caption}</small></span>{stateChecks[i] ? <Check size={13} className="nav-check" /> : <span className="nav-number">{s.n}</span>}</button>; })}</nav><button className="research-link" onClick={() => setModal('research')}><BookOpen size={17} /><span>База фреймворка</span><ArrowUpRight size={14} /></button><div className="sidebar-bottom"><div className="engine-label"><span className={`status-dot ${health?.connected ? 'green' : ''}`} /><div><strong>{settings.mode === 'template' ? 'Ручные шаблоны' : health?.connected ? 'Модель подключена' : 'Локальный движок'}</strong><small>{settings.mode === 'template' ? 'Без генерации моделью' : settings.model || health?.model || 'Настрой подключение LLM'}</small></div><button className="icon-button" aria-label="Настройки движка" onClick={() => setModal('settings')}><Settings2 size={17} /></button></div><div className="profile-line"><span>АЦ</span><div><strong>Андрей Царёв</strong><small>Режиссёрская мастерская</small></div><MoreHorizontal size={18} /></div></div></aside>
    <div className="flow-workspace"><header className="flow-topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Открыть этапы" onClick={() => setMobileNav(!mobileNav)}><Menu size={20} /></button><span>Проекты</span><ChevronRight size={13} /><strong>{p.title}</strong><Pill>Черновик</Pill></div><div className="topbar-actions"><span className={`save-status ${saved === 'Не сохранено' ? 'error' : ''}`}><span />{saved}</span><button className="icon-button" aria-label="История версий" onClick={() => setModal('history')}><History size={18} /></button><button className="small-button" onClick={() => setModal('export')}><Download size={15} />Экспорт</button></div></header>
      <div className="workspace-content"><main id="flow-main" ref={mainRef} className="flow-main" tabIndex={-1}><div className="content-inner">{busy && <div className="working-banner" role="status"><Loader2 size={17} className="spin" /><span>{({ upload: 'Извлекаем материалы…', brief: 'Собираем ТЗ из задачи и материалов…', review: 'Пересчитываем ограничения…', backup: 'Сохраняем локальную копию…', variants: 'Разрабатываем варианты и проверяем ограничения…' })[busy]} Модель может работать несколько минут.</span></div>}
        {stage === 'inputs' ? <Inputs {...editorProps} updateFor={updateFor} settings={settings} setBusy={setBusy} notify={setToast} openRoute={() => setModal('route')} />
          : stage === 'meaning' ? <Meaning {...editorProps} /> : stage === 'dramaturgy' ? <Dramaturgy {...editorProps} />
          : stage === 'constraints' ? <Constraints {...editorProps} budget={budget} />
          : stage === 'spec' ? <Specification {...editorProps} fresh={briefFresh} approved={approved} generate={generate} settings={settings} />
          : <Variants {...editorProps} fresh={resultFresh} reportsFresh={reportsFresh} approved={approved} generate={generate} recheck={recheck} review={stage === 'review'} setStage={setStage} />}
        <footer className="stage-footer"><span>{STAGES[stageIndex].n} <span>/ 07</span></span><div>{stageIndex > 0 && <button className="text-button" onClick={() => setStage(STAGES[stageIndex - 1].id)}><ArrowLeft size={15} />Назад</button>}{stageIndex < STAGES.length - 1 && <button className="primary-button" onClick={() => setStage(STAGES[stageIndex + 1].id)}>{stage === 'constraints' ? 'К ТЗ на драматургию' : stage === 'spec' ? 'К вариантам сценария' : 'Следующий шаг'}<ArrowRight size={16} /></button>}</div></footer>
      </div></main><aside className="flow-inspector"><div className="inspector-title"><Compass size={17} /><span>Смысловой компас</span></div><div className="compass-card"><span className="tiny-label">ГЛАВНЫЙ ОРИЕНТИР</span><h3>{p.desired || 'Какое изменение нужно зрителю?'}</h3><div className="compass-divider" /><span className="tiny-label">ДЕЙСТВИЕ ПОСЛЕ ПРОСМОТРА</span><p>{p.action || 'Определи наблюдаемое действие на шаге «Смысловая задача».'}</p><button className="text-button" onClick={() => setStage('meaning')}>Уточнить задачу <ArrowUpRight size={14} /></button></div><div className="inspector-section"><span className="tiny-label">РАМКИ ПРОИЗВЕДЕНИЯ</span><dl><div><dt><Clock3 size={14} />Хронометраж</dt><dd>{p.constraints.duration} с</dd></div><div><dt><MessageSquare size={14} />Бюджет речи</dt><dd>≈ {budget} слов</dd></div><div><dt><Layers3 size={14} />Формат</dt><dd>{p.constraints.aspect}</dd></div><div><dt><GitBranch size={14} />Вариантов</dt><dd>{p.constraints.variants}</dd></div></dl><button className="inline-button" onClick={() => setStage('constraints')}>Изменить параметры <ArrowUpRight size={13} /></button></div><div className="inspector-section"><span className="tiny-label">СОБРАНО ДЛЯ ИСТОРИИ</span><div className="collection-counts">{[[p.sources.length, 'источников'], [p.claims.length, 'смыслов'], [p.accents.length, 'акцентов']].map(([n, text]) => <div key={text}><strong>{String(n).padStart(2, '0')}</strong><span>{text}</span></div>)}</div></div><div className="inspector-note"><div><Sparkles size={16} /><strong>Решение должно иметь причину.</strong></div><p>Каждая сцена отвечает на вопрос: как она помогает выполнить задачу произведения?</p></div><button className="help-button" onClick={() => setModal('route')}><CircleHelp size={15} />О фреймворке и процессе</button></aside></div>
    </div>
    {toast && <div className="flow-toast" role="status"><AlertCircle size={18} /><span>{toast}</span><button className="icon-button" aria-label="Закрыть уведомление" onClick={() => setToast('')}><X size={17} /></button></div>}
    <input ref={importRef} type="file" accept=".json" hidden onChange={e => importProject(e.target.files[0])} />
    <WorkbenchModals {...{ modal, closeModal, p, projects, setProjects, setActive, update, setStage, settings, setSettings, health, setHealth, checkHealth, busy, setBusy, createProject, importRef }} notify={setToast} />
  </div>;
}
