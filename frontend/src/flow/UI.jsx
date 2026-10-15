import React, { useEffect, useRef } from 'react';
import { AlertCircle, Lightbulb, X, FileText } from 'lucide-react';

export function Field({ label, hint, children, className = '' }) {
  return <label className={`flow-field ${className}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
export function TextField({ label, value, onChange, placeholder, hint, rows = 3, single = false }) {
  return <Field label={label} hint={hint}>{single
    ? <input value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    : <textarea rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}</Field>;
}
export function NumberField({ label, value, onChange, min = 0, max = 3600, suffix, hint, step = 1 }) {
  return <Field label={label} hint={hint}><div className="number-field"><input type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} /><span>{suffix}</span></div></Field>;
}
export function SectionTitle({ eyebrow, title, description, aside }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{aside}</div>;
}
export function Pill({ children, color = '' }) { return <span className={`pill ${color}`}>{children}</span>; }
export function Notice({ children, warning = false }) {
  const Icon = warning ? AlertCircle : Lightbulb;
  return <div className={`flow-notice ${warning ? 'warning' : ''}`}><Icon size={17} /><div>{children}</div></div>;
}
export function Empty({ icon: Icon = FileText, title, text, children }) {
  return <div className="flow-empty"><div className="empty-icon"><Icon size={27} strokeWidth={1.4} /></div><h3>{title}</h3><p>{text}</p>{children}</div>;
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement; ref.current?.focus();
    const handler = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll('button, input, textarea, select, a[href], [tabindex="0"]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="flow-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}><header><h2>{title}</h2><button className="icon-button" aria-label="Закрыть окно" onClick={onClose}><X size={20} /></button></header>{children}</div></div>;
}
