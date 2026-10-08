import { memo } from 'react';
import type { LoopSnap, Step } from '../engine';

const KIND_LABEL: Record<Step['kind'], string> = {
  start: 'Program starts',
  decl: 'New box in memory',
  assign: 'Value changes',
  print: 'Printing',
  input: 'Reading input',
  branch: 'Decision',
  loop: 'Loop check',
  'loop-init': 'Loop begins',
  'loop-update': 'Loop update',
  switch: 'Switch',
  jump: 'Jump',
  call: 'Function call',
  return: 'Return',
  expr: 'Action',
  end: 'Finished',
  error: 'Problem',
};

const KIND_TONE: Partial<Record<Step['kind'], string>> = {
  branch: 'accent',
  loop: 'loop',
  'loop-init': 'loop',
  'loop-update': 'loop',
  print: 'yes',
  input: 'info',
  error: 'no',
  end: 'yes',
  switch: 'accent',
};

function loopValue(step: Step, loop: LoopSnap): string | null {
  if (!loop.varName) return null;
  for (let f = step.frames.length - 1; f >= 0; f--) {
    const v = step.frames[f].vars.find((x) => x.name === loop.varName);
    if (v) return v.val.k === 'v' ? v.val.text : v.val.k === 'uninit' ? '?' : null;
  }
  return null;
}

function Fork({ step, index }: { step: Step; index: number }) {
  const b = step.branch!;
  const yes = b.result;
  const isLoop = b.label !== 'if';
  return (
    <div className="fork" key={index}>
      <div className={`fork__q ${yes ? 'is-yes' : 'is-no'}`}>
        <span className="fork__qmark">{isLoop ? '↻' : '?'}</span>
        <code>{b.cond}</code>
      </div>
      <svg className="fork__svg" viewBox="0 0 300 92" aria-hidden="true">
        <path id={`fy${index}`} d="M150 0 C150 40, 60 40, 60 92" className={`fork__path ${yes ? 'is-taken yes' : 'is-dim'}`} />
        <path id={`fn${index}`} d="M150 0 C150 40, 240 40, 240 92" className={`fork__path ${!yes ? 'is-taken no' : 'is-dim'}`} />
        <circle r="7" className={`fork__ball ${yes ? 'yes' : 'no'}`}>
          <animateMotion dur="0.7s" fill="freeze" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" path={yes ? 'M150 0 C150 40, 60 40, 60 92' : 'M150 0 C150 40, 240 40, 240 92'} />
        </circle>
      </svg>
      <div className="fork__ends">
        <span className={`fork__end yes ${yes ? 'is-on' : ''}`}>
          <b>YES</b> {isLoop ? 'go round again' : 'take this path'}
        </span>
        <span className={`fork__end no ${!yes ? 'is-on' : ''}`}>
          <b>NO</b> {isLoop ? 'leave the loop' : b.outcome === 'skip' ? 'skip it' : 'other path'}
        </span>
      </div>
    </div>
  );
}

function Loops({ step, highlightTop }: { step: Step; highlightTop: boolean }) {
  if (!step.loops.length) return null;
  return (
    <div className="loops">
      {step.loops.map((l, i) => {
        const val = loopValue(step, l);
        const top = i === step.loops.length - 1;
        const laps = Math.min(l.round, 14);
        return (
          <div className={`loopcard${top && highlightTop ? ' is-top' : ''}`} key={l.id} style={{ ['--depth' as string]: i }}>
            <div className="loopcard__head">
              <span className="loopcard__tag">{i === 0 ? 'outer loop' : i === 1 ? 'inner loop' : `loop ${i + 1}`}</span>
              <code className="loopcard__code">{l.head}</code>
            </div>
            <div className="loopcard__body">
              {val !== null && (
                <span className="loopcard__var">
                  <span className="loopcard__name">{l.varName}</span>
                  <span className="loopcard__val" key={val}>
                    {val}
                  </span>
                </span>
              )}
              <span className="loopcard__round">
                round <b>{l.round || '—'}</b>
              </span>
              <span className="laps" aria-hidden="true">
                {Array.from({ length: laps }, (_, k) => (
                  <i key={k} className={k === laps - 1 ? 'is-cur' : ''} />
                ))}
                {l.round > 14 && <em>+{l.round - 14}</em>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SwitchViz({ step }: { step: Step }) {
  const s = step.switchInfo!;
  return (
    <div className="switchviz">
      <div className="switchviz__subject">
        <code>{s.subject}</code> is <b>{s.value}</b>
      </div>
      <div className="switchviz__cases">
        {s.cases.map((c, i) => (
          <span key={i} className={`casechip is-${c.state}`} style={{ animationDelay: `${i * 70}ms` }}>
            {c.label}
            {c.state === 'match' && <em> ← here</em>}
          </span>
        ))}
      </div>
    </div>
  );
}

function PrintViz({ step }: { step: Step }) {
  const text = step.printed ?? '';
  const parts = text.split('\n');
  return (
    <div className="printviz">
      <div className="printviz__chip">
        {parts.map((p, i) => (
          <span key={i}>
            {p && <span className="printviz__text">{p.replace(/ /g, '␣')}</span>}
            {i < parts.length - 1 && <span className="printviz__nl" title="new line">⏎</span>}
          </span>
        ))}
        {!text && <span className="printviz__text muted">(output style only)</span>}
      </div>
      <span className="printviz__arrow" aria-hidden="true">
        → screen
      </span>
    </div>
  );
}

function InputViz({ step }: { step: Step }) {
  return (
    <div className="inputviz">
      {(step.typed ?? []).map((t, i) => (
        <span className="keycap" key={i} style={{ animationDelay: `${i * 160}ms` }}>
          {t || '∅'}
        </span>
      ))}
      <span className="inputviz__enter keycap">Enter ⏎</span>
    </div>
  );
}

function CallViz({ step }: { step: Step }) {
  const frames = step.frames.filter((f) => f.fn !== '(global)');
  return (
    <div className="callviz">
      {frames.map((f, i) => (
        <span key={f.id} className={`callviz__frame${i === frames.length - 1 ? ' is-top' : ''}`}>
          {f.label}
        </span>
      ))}
    </div>
  );
}

/** "What's happening now" — a picture of the current step plus the working-out. */
export const ThinkingPanel = memo(function ThinkingPanel({ step, index }: { step: Step; index: number }) {
  const tone = KIND_TONE[step.kind] ?? 'neutral';
  const loopish = step.kind === 'loop' || step.kind === 'loop-init' || step.kind === 'loop-update';
  return (
    <div className="think" key={index}>
      <div className={`think__badge tone-${tone}`}>{KIND_LABEL[step.kind]}</div>

      <div className="think__visual">
        {step.branch && <Fork step={step} index={index} />}
        {step.switchInfo && <SwitchViz step={step} />}
        {step.kind === 'print' && <PrintViz step={step} />}
        {step.kind === 'input' && <InputViz step={step} />}
        {(step.kind === 'call' || step.kind === 'return') && step.frames.length > 1 && <CallViz step={step} />}
        {step.kind === 'start' && <div className="think__hint">Press <kbd>Space</kbd> or ▶ to play, or step through with <kbd>→</kbd>.</div>}
        {step.kind === 'end' && <div className="think__done">✓ Done</div>}
      </div>

      {step.evals.length > 0 && (
        <div className="evals">
          <div className="evals__title">Working it out</div>
          <ol className="evals__list">
            {step.evals.map((e, i) => (
              <li key={i} className="evalrow" style={{ animationDelay: `${i * 110}ms` }}>
                <code className="evalrow__expr">{e.expr}</code>
                <span className="evalrow__arrow">→</span>
                {e.calc !== e.expr && <code className="evalrow__calc">{e.calc}</code>}
                {e.calc !== e.expr && <span className="evalrow__eq">=</span>}
                <code className="evalrow__res">{e.result}</code>
                {e.note && <span className="evalrow__note">{e.note}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {step.loops.length > 0 && <Loops step={step} highlightTop={loopish} />}
    </div>
  );
});
