import { memo, useMemo } from 'react';
import type { FrameSnap, SnapVal, Step, Trace, VarSnap } from '../engine';

interface Props {
  trace: Trace;
  step: Step;
  prev: Step | null;
}

function findVar(frames: FrameSnap[] | undefined, id: number): VarSnap | null {
  if (!frames) return null;
  for (const f of frames) for (const v of f.vars) if (v.id === id) return v;
  return null;
}

const valText = (v: SnapVal | undefined): string =>
  !v ? '' : v.k === 'v' ? v.text : v.k === 'str' ? JSON.stringify(v.text) : v.k === 'uninit' ? '?' : `${v.total} items`;

function Tiles({
  items,
  ownerId,
  step,
  pointers,
  depthPath = [],
}: {
  items: { id: number; text: string; uninit?: boolean }[];
  ownerId: number;
  step: Step;
  pointers: { name: string; at: number }[];
  depthPath?: number[];
}) {
  const access = step.access.filter((a) => a.owner === ownerId && a.path.length === depthPath.length + 1 && depthPath.every((p, i) => a.path[i] === p));
  return (
    <div className="tiles">
      <div className="tiles__row">
        {items.map((it, i) => {
          const a = access.filter((x) => x.path[depthPath.length] === i);
          const w = a.some((x) => x.mode === 'w') || step.changed.includes(it.id);
          const r = !w && a.some((x) => x.mode === 'r');
          return (
            <div key={i} className={`tile${w ? ' is-write' : ''}${r ? ' is-read' : ''}${it.uninit ? ' is-uninit' : ''}`}>
              <span className="tile__val" key={it.text}>
                {it.text}
              </span>
              <span className="tile__idx">{i}</span>
              <span className="tile__ptrs">
                {pointers
                  .filter((p) => p.at === i)
                  .map((p) => (
                    <span className="ptr" key={p.name}>
                      {p.name}
                    </span>
                  ))}
              </span>
            </div>
          );
        })}
        {items.length === 0 && <span className="tiles__empty">empty</span>}
      </div>
    </div>
  );
}

function VarBox({ v, step, prev, trace, frame }: { v: VarSnap; step: Step; prev: Step | null; trace: Trace; frame: FrameSnap }) {
  const before = findVar(prev?.frames, v.id);
  const isNew = !before || before.name !== v.name;
  const changed = !isNew && step.changed.includes(v.id);
  const oldText = changed ? valText(before?.val) : null;

  // index variables pointing into this array/string (e.g. i, j)
  const pointers = useMemo(() => {
    const names = trace.pointers[v.name] ?? [];
    return names.flatMap((n) => {
      const pv = frame.vars.find((x) => x.name === n);
      if (pv?.val.k !== 'v') return [];
      const at = Number(pv.val.text);
      return Number.isInteger(at) ? [{ name: n, at }] : [];
    });
  }, [trace, v.name, frame]);

  const val = v.val;
  const asTiles = val.k === 'list' || (val.k === 'str' && (trace.pointers[v.name]?.length ?? 0) > 0 && val.text.length <= 40);

  return (
    <div className={`var${isNew ? ' is-new' : ''}${changed ? ' is-changed' : ''}${asTiles ? ' var--wide' : ''}`}>
      <div className="var__head">
        <span className="var__name">{v.name}</span>
        <span className="var__type" title={v.meaning}>
          {v.isConst ? 'const ' : ''}
          {v.type}
        </span>
      </div>
      {asTiles ? (
        val.k === 'str' ? (
          <Tiles items={[...val.text].map((ch, i) => ({ id: -i - 1, text: ch === ' ' ? '␣' : ch }))} ownerId={v.id} step={step} pointers={pointers} />
        ) : val.k === 'list' && val.items.some((x) => x.v.k === 'list') ? (
          <div className="tiles2d">
            {val.items.map((row, r) => (
              <div className="tiles2d__row" key={r}>
                <span className="tiles2d__r">{r}</span>
                <Tiles
                  items={row.v.k === 'list' ? row.v.items.map((c) => ({ id: c.id, text: valText(c.v), uninit: c.v.k === 'uninit' })) : []}
                  ownerId={v.id}
                  step={step}
                  pointers={[]}
                  depthPath={[r]}
                />
              </div>
            ))}
          </div>
        ) : val.k === 'list' ? (
          <Tiles items={val.items.map((c) => ({ id: c.id, text: valText(c.v), uninit: c.v.k === 'uninit' }))} ownerId={v.id} step={step} pointers={pointers} />
        ) : null
      ) : (
        <div className={`var__val${val.k === 'uninit' ? ' is-uninit' : ''}${val.k === 'v' && (val.text === 'true' || val.text === 'false') ? ` is-bool-${val.text}` : ''}`}>
          <span key={valText(val)} className="var__valtext">
            {val.k === 'uninit' ? '?' : valText(val)}
          </span>
          {oldText !== null && oldText !== valText(val) && <span className="var__old">was {oldText}</span>}
        </div>
      )}
      {v.refOf && <div className="var__ref">another name for {v.refOf}</div>}
      {val.k === 'uninit' && <div className="var__hint">no value yet</div>}
    </div>
  );
}

/** Memory: every variable as a labelled box, grouped by function call (the call stack). */
export const MemoryPanel = memo(function MemoryPanel({ trace, step, prev }: Props) {
  const frames = step.frames;
  const any = frames.some((f) => f.vars.length);
  return (
    <div className="memory">
      {!any && <p className="memory__empty">No variables yet. When the program creates one, a box appears here.</p>}
      {frames.map((f, i) => {
        if (!f.vars.length && f.fn !== 'main' && i !== frames.length - 1) return null;
        const top = i === frames.length - 1;
        return (
          <section key={f.id} className={`frame${top ? ' is-top' : ''}${frames.length > 1 ? ' frame--stacked' : ''}`}>
            {(frames.length > 1 || f.fn !== 'main') && <header className="frame__label">{f.fn === '(global)' ? 'global' : f.label}</header>}
            <div className="frame__vars">
              {f.vars.map((v) => (
                <VarBox key={`${v.id}-${v.name}`} v={v} step={step} prev={prev} trace={trace} frame={f} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
});
