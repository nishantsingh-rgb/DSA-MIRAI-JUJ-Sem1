import { useCallback, useEffect, useMemo, useState } from 'react';
import { analyze, applyKnob, type Knob } from '../engine';
import type { ProgramEntry } from '../lib/catalog';
import { Markup, plain } from '../lib/markup';
import { usePlayer } from '../lib/usePlayer';
import { CodePanel } from './CodePanel';
import { Controls } from './Controls';
import { IconEdit, IconKeyboard, IconMinus, IconPlus, IconReset, IconShield } from './Icons';
import { MemoryPanel } from './MemoryPanel';
import { ScreenPanel } from './ScreenPanel';
import { ThinkingPanel } from './ThinkingPanel';

/** The full interactive visualizer for one program. */
export function Player({ program }: { program: ProgramEntry }) {
  const [source, setSource] = useState(program.source);
  const [draft, setDraft] = useState(program.source);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(program.input ?? '');
  const [inputDraft, setInputDraft] = useState(program.input ?? '');

  // reset everything when navigating to another program
  useEffect(() => {
    setSource(program.source);
    setDraft(program.source);
    setEditing(false);
    setInput(program.input ?? '');
    setInputDraft(program.input ?? '');
  }, [program]);

  const analysis = useMemo(() => analyze(source, input), [source, input]);
  const trace = analysis.trace;
  const p = usePlayer(trace);
  const step = p.step;
  const prev = trace && p.index > 0 ? trace.steps[p.index - 1] : null;

  const nested = useMemo(() => !!trace?.steps.some((s) => s.loops.length >= 2), [trace]);
  const [modeChoice, setModeChoice] = useState<'auto' | 'grid' | 'terminal'>('auto');
  const mode = modeChoice === 'auto' ? (nested ? 'grid' : 'terminal') : modeChoice;

  const pristine = source === program.source && input === (program.input ?? '');
  const verified = pristine && trace && !trace.error && program.expectedOutput !== null && trace.stdout === program.expectedOutput;

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        p.toggle();
      } else if (e.key === 'ArrowRight' || e.key === '.') {
        e.preventDefault();
        p.setPlaying(false);
        p.go(p.index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === ',') {
        e.preventDefault();
        p.setPlaying(false);
        p.go(p.index - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        p.go(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        p.go(p.total - 1);
      } else if (e.key === 'l' || e.key === 'L') {
        p.skipLoop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p]);

  const knobValue = useCallback(
    (k: Knob) => {
      const m = source.slice(k.start, k.end);
      return Number(m);
    },
    [source],
  );
  const bump = (k: Knob, delta: number) => {
    const v = knobValue(k);
    const next = Math.max(-999, Math.min(999, Math.round((v + delta) * 100) / 100));
    const s = applyKnob(source, k, next);
    setSource(s);
    setDraft(s);
  };

  const runDraft = () => {
    setSource(draft);
    setEditing(false);
  };

  // ---------- compile error / unsupported feature fallback ----------
  if (!trace || analysis.syntaxError) {
    const err = analysis.syntaxError!;
    return (
      <div className="player player--error">
        <div className="callout callout--no">
          <strong>Can't animate this code yet.</strong> {err.message} (line {err.line}).
          {!pristine && ' Check your edit, or reset to the original program.'}
        </div>
        <div className="player__fallback">
          <div className="panel">
            <div className="panel__head">
              <h3>Code</h3>
              {!pristine && (
                <button className="btn btn--ghost btn--sm" onClick={() => (setSource(program.source), setDraft(program.source))}>
                  <IconReset size={14} /> Reset
                </button>
              )}
            </div>
            {editing || !pristine ? (
              <Editor draft={draft} setDraft={setDraft} onRun={runDraft} onCancel={() => (setDraft(program.source), setSource(program.source), setEditing(false))} />
            ) : (
              <CodePanel source={source} steps={[]} index={0} errorLine={err.line} />
            )}
          </div>
          {program.expectedOutput !== null && pristine && (
            <div className="panel">
              <div className="panel__head">
                <h3>Real output (from the C++ compiler)</h3>
              </div>
              <pre className="screen screen--terminal screen__pre">{program.expectedOutput}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  const inLoop = !!step?.loops.length;

  return (
    <div className="player">
      {/* ---- tweak bar: knobs, input, edit ---- */}
      <div className="tweaks">
        {analysis.knobs.length > 0 && (
          <div className="tweaks__group" aria-label="Try different starting values">
            <span className="tweaks__label">Try changing</span>
            {analysis.knobs.map((k) => {
              const v = knobValue(k);
              const stepBy = k.isFloat && !Number.isInteger(v) ? 0.5 : 1;
              return (
                <span className="knob" key={k.name}>
                  <code>{k.name}</code>
                  <button className="knob__btn" aria-label={`Decrease ${k.name}`} onClick={() => bump(k, -stepBy)}>
                    <IconMinus size={14} />
                  </button>
                  <span className="knob__val">{Number.isFinite(v) ? v : '?'}</span>
                  <button className="knob__btn" aria-label={`Increase ${k.name}`} onClick={() => bump(k, stepBy)}>
                    <IconPlus size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {program.usesInput && (
          <form
            className="tweaks__group tweaks__input"
            onSubmit={(e) => {
              e.preventDefault();
              setInput(inputDraft);
            }}
          >
            <label className="tweaks__label" htmlFor="stdin">
              <IconKeyboard size={15} /> User types
            </label>
            <input id="stdin" className="field" value={inputDraft} onChange={(e) => setInputDraft(e.target.value)} placeholder="e.g. 12 4" spellCheck={false} autoComplete="off" />
            <button className="btn btn--sm" type="submit" disabled={inputDraft === input}>
              Run
            </button>
          </form>
        )}
        {analysis.knobs.length === 0 && !program.usesInput && (
          <span className="tweaks__hint">Want to experiment? Edit the code and run your own version.</span>
        )}
        <div className="tweaks__group tweaks__right">
          {!pristine && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSource(program.source);
                setDraft(program.source);
                setInput(program.input ?? '');
                setInputDraft(program.input ?? '');
                setEditing(false);
              }}
            >
              <IconReset size={14} /> Reset
            </button>
          )}
          <button className={`btn btn--ghost btn--sm${editing ? ' is-on' : ''}`} onClick={() => (editing ? runDraft() : setEditing(true))}>
            <IconEdit size={14} /> {editing ? 'Run my code' : 'Edit code'}
          </button>
        </div>
      </div>

      {/* ---- narration ---- */}
      {step && (
        <div className={`narration kind-${step.kind}`} aria-live="polite" aria-atomic="true">
          <span className="narration__line">Line {step.line}</span>
          <p className="narration__text" key={p.index} aria-label={plain(step.text)}>
            <Markup text={step.text} />
          </p>
        </div>
      )}

      {/* ---- stage ---- */}
      <div className="stage">
        <section className="panel panel--code" aria-label="Code">
          <div className="panel__head">
            <h3>Code</h3>
            <span className="panel__hint hide-sm">click a line to jump to it</span>
          </div>
          {editing ? (
            <Editor draft={draft} setDraft={setDraft} onRun={runDraft} onCancel={() => (setDraft(source), setEditing(false))} />
          ) : (
            <CodePanel source={source} steps={trace.steps} index={p.index} onLineClick={(l) => (p.setPlaying(false), p.runToLine(l))} errorLine={trace.error?.line} />
          )}
        </section>

        <section className="panel panel--screen" aria-label="Screen output">
          <div className="panel__head">
            <h3>Screen</h3>
            <div className="seg-toggle" role="radiogroup" aria-label="Screen view">
              <button role="radio" aria-checked={mode === 'grid'} className={mode === 'grid' ? 'is-on' : ''} onClick={() => setModeChoice('grid')}>
                Grid
              </button>
              <button role="radio" aria-checked={mode === 'terminal'} className={mode === 'terminal' ? 'is-on' : ''} onClick={() => setModeChoice('terminal')}>
                Terminal
              </button>
            </div>
          </div>
          <ScreenPanel trace={trace} index={p.index} mode={mode} />
          {verified && p.index === p.total - 1 && (
            <div className="verified" title="The visualizer's output was compared with the real compiled program">
              <IconShield size={15} /> Matches the real C++ compiler, character for character
            </div>
          )}
        </section>

        <section className="panel panel--think" aria-label="What is happening now">
          <div className="panel__head">
            <h3>What's happening</h3>
          </div>
          {step && <ThinkingPanel step={step} index={p.index} />}
        </section>

        <section className="panel panel--memory" aria-label="Memory">
          <div className="panel__head">
            <h3>Memory</h3>
            <span className="panel__hint hide-sm">each box is a variable</span>
          </div>
          {step && <MemoryPanel trace={trace} step={step} prev={prev} />}
        </section>
      </div>

      {trace.error && trace.error.kind !== 'runtime' && (
        <div className="callout callout--no">
          <strong>Heads up:</strong> {trace.error.message}
        </div>
      )}

      <div className="dock">
        {step && (
          <div className="dock__narr" aria-hidden="true">
            <span className="narration__line">L{step.line}</span>
            <span>
              <Markup text={step.text} />
            </span>
          </div>
        )}
        <Controls p={p} inLoop={inLoop} />
      </div>
    </div>
  );
}

function Editor({ draft, setDraft, onRun, onCancel }: { draft: string; setDraft: (s: string) => void; onRun: () => void; onCancel: () => void }) {
  return (
    <div className="editor">
      <textarea
        className="editor__area"
        value={draft}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onRun();
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart: a, selectionEnd: b } = el;
            const next = draft.slice(0, a) + '    ' + draft.slice(b);
            setDraft(next);
            requestAnimationFrame(() => el.setSelectionRange(a + 4, a + 4));
          }
        }}
        aria-label="Edit the C++ code"
      />
      <div className="editor__bar">
        <span className="panel__hint">Ctrl/⌘ + Enter to run</span>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--sm" onClick={onRun}>
          Run my code
        </button>
      </div>
    </div>
  );
}
