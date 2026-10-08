import { useEffect, useMemo, useRef, useState } from 'react';
import { allPrograms, programHref, topicOf } from '../lib/catalog';
import { navigate } from '../lib/router';
import { IconSearch } from './Icons';

/** ⌘K / "/" quick search across every program. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return allPrograms
      .map((p) => {
        const t = topicOf(p);
        const hay = `${p.title} ${t.title} ${p.kind} lesson ${p.lesson} ${p.summary ?? ''}`.toLowerCase();
        return { p, t, ok: words.every((w) => hay.includes(w)), score: words.reduce((s, w) => s + (p.title.toLowerCase().includes(w) ? 2 : 0), 0) };
      })
      .filter((r) => r.ok)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [q]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('.is-sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    navigate(programHref(r.p));
    onClose();
  };

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Search programs" onMouseDown={onClose}>
      <div className="palette__box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette__search">
          <IconSearch />
          <input
            ref={inputRef}
            value={q}
            placeholder="Search: pyramid, leap year, switch…"
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === 'Enter') go(sel);
            }}
            aria-label="Search"
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette__list" ref={listRef} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.p.id}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'is-sel' : ''}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(i)}
            >
              <span className="palette__title">{r.p.title}</span>
              <span className="palette__meta">
                {r.t.title} · Lesson {r.p.lesson} · {r.p.kind}
              </span>
            </li>
          ))}
          {results.length === 0 && <li className="palette__none">No programs match “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}
