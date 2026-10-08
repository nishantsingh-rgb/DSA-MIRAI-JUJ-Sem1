import { memo, useEffect, useMemo, useRef } from 'react';
import type { Step } from '../engine';
import { highlight } from '../lib/highlight';

interface Props {
  source: string;
  steps: Step[];
  index: number;
  errorLine?: number | null;
  onLineClick?: (line: number) => void;
  compact?: boolean;
}

/** Source code with the current line "highlighter-marked" and a run-count heat gutter. */
export const CodePanel = memo(function CodePanel({ source, steps, index, errorLine, onLineClick, compact }: Props) {
  const lines = useMemo(() => highlight(source), [source]);
  const scroller = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const prev = index > 0 ? steps[index - 1] : null;

  // how many times has each line been reached so far? (the "heat" in the gutter)
  const counts = useMemo(() => {
    const c = new Map<number, number>();
    for (let i = 0; i <= index && i < steps.length; i++) {
      const s = steps[i];
      if (s.kind === 'start' || s.kind === 'end') continue;
      c.set(s.line, (c.get(s.line) ?? 0) + 1);
    }
    return c;
  }, [steps, index]);
  const maxCount = Math.max(1, ...counts.values());

  const active = step ? step.line : errorLine ?? -1;
  const activeEnd = step ? step.endLine : active;

  // keep the active line in view *inside the panel* (never scroll the page)
  useEffect(() => {
    const box = scroller.current;
    if (!box || active < 1) return;
    const el = box.querySelector<HTMLElement>(`[data-line="${active}"]`);
    if (!el) return;
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [active]);

  const tone =
    step?.kind === 'error'
      ? 'err'
      : step?.branch
        ? step.branch.result
          ? 'yes'
          : 'no'
        : step?.kind === 'loop-update' || step?.kind === 'loop-init'
          ? 'loop'
          : 'now';

  return (
    <div className={`code ${compact ? 'code--compact' : ''}`} ref={scroller}>
      <pre className="code__pre" aria-label="Program source code">
        {lines.map((toks, i) => {
          const ln = i + 1;
          const isActive = ln >= active && ln <= activeEnd;
          const isPrev = !isActive && prev && ln === prev.line;
          const count = counts.get(ln) ?? 0;
          const isErr = errorLine === ln;
          return (
            <div
              key={i}
              data-line={ln}
              className={`code__line${isActive ? ` is-active is-${tone}` : ''}${isPrev ? ' is-prev' : ''}${isErr ? ' is-error' : ''}${onLineClick ? ' is-clickable' : ''}`}
              onClick={onLineClick ? () => onLineClick(ln) : undefined}
              title={onLineClick ? `Jump to the next time line ${ln} runs` : undefined}
            >
              <span className="code__gutter">
                <span className="code__ln">{ln}</span>
                {!compact && (
                  <span
                    className="code__heat"
                    style={{ opacity: count ? 0.25 + (0.75 * count) / maxCount : 0 }}
                    title={count ? `Ran ${count} time${count === 1 ? '' : 's'} so far` : undefined}
                  >
                    {count > 1 ? `${count}×` : ''}
                  </span>
                )}
              </span>
              <span className="code__text">
                {toks.length === 0 ? ' ' : toks.map((t, j) => (t.k === 'ws' || t.k === 'id' ? <span key={j}>{t.t}</span> : <span key={j} className={`tk-${t.k}`}>{t.t}</span>))}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
});
