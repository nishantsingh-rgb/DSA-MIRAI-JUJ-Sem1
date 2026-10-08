import { memo, useMemo } from 'react';
import type { ConsoleSeg, Step, Trace } from '../engine';

interface Cell {
  ch: string;
  kind: 'out' | 'in';
  step: number;
  line: number;
}

interface Props {
  trace: Trace;
  index: number;
  mode: 'grid' | 'terminal';
}

const PALETTE = ['var(--accent)', 'var(--loop)', 'var(--yes)', 'var(--info)', 'var(--no)'];

function buildRows(segs: ConsoleSeg[]): Cell[][] {
  const rows: Cell[][] = [[]];
  for (const s of segs) {
    for (const ch of s.text) {
      if (ch === '\n') rows.push([]);
      else rows[rows.length - 1].push({ ch, kind: s.kind, step: s.step, line: s.line });
    }
  }
  return rows;
}

/** The value of the outermost loop's counter when a row started (e.g. "i = 3"). */
function rowLabel(step: Step | undefined): string | null {
  const loop = step?.loops[0];
  if (!step || !loop?.varName) return null;
  const frame = step.frames[step.frames.length - 1];
  const v = frame?.vars.find((x) => x.name === loop.varName);
  return v && v.val.k === 'v' ? `${loop.varName} = ${v.val.text}` : null;
}

/** What the program has printed so far: a big character grid (patterns) or a terminal. */
export const ScreenPanel = memo(function ScreenPanel({ trace, index, mode }: Props) {
  const step = trace.steps[index];
  const segs = useMemo(() => trace.console.slice(0, step?.out ?? 0), [trace, step]);
  const rows = useMemo(() => buildRows(segs), [segs]);
  const colorOf = useMemo(() => {
    const lines: number[] = [];
    for (const s of trace.console) if (s.kind === 'out' && !lines.includes(s.line)) lines.push(s.line);
    return (line: number) => PALETTE[lines.indexOf(line) % PALETTE.length];
  }, [trace]);

  const empty = segs.length === 0;

  if (mode === 'terminal') {
    return (
      <div className="screen screen--terminal" aria-label="Program output">
        {empty ? (
          <span className="screen__empty">Nothing printed yet…</span>
        ) : (
          <pre className="screen__pre">
            {segs.map((s, i) => (
              <span key={i} className={`seg seg--${s.kind}${s.step === index ? ' is-new' : ''}`}>
                {s.text}
              </span>
            ))}
            <span className="screen__cursor" />
          </pre>
        )}
      </div>
    );
  }

  const cols = Math.max(4, ...rows.map((r) => r.length));
  // trim a trailing empty row (after the final endl) so the grid doesn't look padded
  const shown = rows.length > 1 && rows[rows.length - 1].length === 0 ? rows.slice(0, -1) : rows;
  const cursorRow = rows.length - 1;

  return (
    <div className="screen screen--grid" style={{ ['--cols' as string]: cols }} aria-label="Program output as a character grid">
      {empty ? (
        <span className="screen__empty">Nothing printed yet — the screen fills in as the program runs.</span>
      ) : (
        <div className="grid">
          {shown.map((row, r) => {
            const label = row.length ? rowLabel(trace.steps[row[0].step]) : null;
            return (
              <div className="grid__row" key={r}>
                <span className="grid__rownum">{r + 1}</span>
                <div className="grid__cells">
                  {row.map((c, k) => {
                    const isNew = c.step === index;
                    const space = c.ch === ' ';
                    return (
                      <span
                        key={k}
                        className={`gcell${space ? ' gcell--space' : ''}${c.kind === 'in' ? ' gcell--in' : ''}${isNew ? ' is-new' : ''}`}
                        style={{ ['--c' as string]: c.kind === 'in' ? 'var(--info)' : colorOf(c.line) }}
                        title={`Printed by line ${c.line}`}
                      >
                        {space ? '' : c.ch}
                      </span>
                    );
                  })}
                  {r === cursorRow && <span className="gcell gcell--cursor" />}
                </div>
                {label && <span className="grid__label">{label}</span>}
              </div>
            );
          })}
          {cursorRow >= shown.length && (
            <div className="grid__row">
              <span className="grid__rownum">{cursorRow + 1}</span>
              <div className="grid__cells">
                <span className="gcell gcell--cursor" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
