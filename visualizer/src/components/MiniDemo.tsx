import { useEffect, useMemo, useState } from 'react';
import { analyze } from '../engine';
import type { ProgramEntry } from '../lib/catalog';
import { prefersReducedMotion } from '../lib/storage';
import { CodePanel } from './CodePanel';
import { ScreenPanel } from './ScreenPanel';

/** The self-playing preview in the hero — the real engine, running a real course program. */
export function MiniDemo({ program }: { program: ProgramEntry }) {
  const trace = useMemo(() => analyze(program.source, program.input ?? '').trace, [program]);
  const total = trace?.steps.length ?? 0;
  const [i, setI] = useState(() => (prefersReducedMotion() ? Math.max(0, total - 1) : 0));

  useEffect(() => {
    if (!total || prefersReducedMotion()) return;
    const id = window.setInterval(() => setI((x) => (x >= total - 1 ? 0 : x + 1)), i >= total - 1 ? 2600 : 120);
    return () => window.clearInterval(id);
  }, [total, i]);

  if (!trace) return null;
  return (
    <div className="minidemo" aria-label={`Live preview: ${program.title}`}>
      <div className="minidemo__chrome">
        <i />
        <i />
        <i />
        <span>{program.title}</span>
      </div>
      <div className="minidemo__body">
        <div className="minidemo__code">
          <CodePanel source={program.source} steps={trace.steps} index={i} compact />
        </div>
        <div className="minidemo__screen">
          <ScreenPanel trace={trace} index={i} mode="grid" />
        </div>
      </div>
      <div className="minidemo__progress" style={{ ['--p' as string]: `${(i / Math.max(1, total - 1)) * 100}%` }} />
    </div>
  );
}
