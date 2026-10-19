import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';

type Field =
  | { kind: 'text'; key: string; label: string; placeholder?: string; defaultValue?: string; required?: boolean }
  | { kind: 'number'; key: string; label: string; placeholder?: string; defaultValue?: number; required?: boolean };

type Props = {
  open: boolean;
  title: string;
  fields: Field[];
  onSubmit: (values: Record<string, string | number>) => Promise<void> | void;
  onClose: () => void;
  submitLabel?: string;
  children?: ReactNode;
};

export function FormModal({ open, title, fields, onSubmit, onClose, submitLabel = 'Save', children }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, String(f.defaultValue ?? '')])),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // reset when opened with new fields
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setValues(Object.fromEntries(fields.map((f) => [f.key, String(f.defaultValue ?? '')])));
      setErr(null);
      setBusy(false);
    }
  }

  const submit = async () => {
    setErr(null);
    for (const f of fields) {
      if (f.required && !values[f.key].trim()) {
        setErr(`${f.label} is required`);
        return;
      }
    }
    const out: Record<string, string | number> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.kind === 'number') {
        out[f.key] = v === '' ? 0 : Number(v);
      } else {
        out[f.key] = v.trim();
      }
    }
    setBusy(true);
    try {
      await onSubmit(out);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              {f.label}
            </span>
            <input
              type={f.kind === 'number' ? 'number' : 'text'}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </label>
        ))}
        {children}
        {err && <p className="text-sm text-rose-400">{err}</p>}
      </div>
    </Modal>
  );
}
