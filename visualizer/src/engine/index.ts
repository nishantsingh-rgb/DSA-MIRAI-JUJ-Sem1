import type { Expr } from './ast';
import { run } from './interpreter';
import { CppSyntaxError } from './lexer';
import { parse } from './parser';
import type { Knob, Trace } from './trace';

export type { Knob, Trace, Step, FrameSnap, VarSnap, SnapVal, EvalLine, LoopSnap, ConsoleSeg, Access } from './trace';

export interface Analysis {
  trace: Trace | null;
  knobs: Knob[];
  /** compile-time problem (syntax / unsupported feature) */
  syntaxError: { message: string; line: number } | null;
}

/** Parse + run a program and return everything the visualizer needs. */
export function analyze(source: string, input = '', maxSteps = 20000): Analysis {
  let program;
  try {
    program = parse(source);
  } catch (e) {
    if (e instanceof CppSyntaxError) return { trace: null, knobs: [], syntaxError: { message: e.message, line: e.line } };
    return { trace: null, knobs: [], syntaxError: { message: String((e as Error).message ?? e), line: 1 } };
  }
  const knobs = findKnobs(program.functions.get('main')!.body.body, source);
  const trace = run(program, { input, maxSteps });
  return { trace, knobs, syntaxError: null };
}

/**
 * "Knobs" are the simple numbers set at the top of main (e.g. `int n = 5;`).
 * The UI turns them into +/- controls so a learner can change n and watch the
 * whole animation change — no code editing needed.
 */
function findKnobs(body: import('./ast').Stmt[], src: string): Knob[] {
  const knobs: Knob[] = [];
  for (const s of body) {
    if (s.type !== 'Decl' || s.varType.base === 'string' || s.varType.base === 'bool' || s.varType.base === 'char') continue;
    for (const d of s.decls) {
      if (!d.init || d.dims.length) continue;
      let lit: Expr = d.init;
      let neg = false;
      if (lit.type === 'Unary' && lit.op === '-' && lit.arg.type === 'Num') {
        neg = true;
        lit = lit.arg;
      }
      if (lit.type !== 'Num') continue;
      const start = neg ? d.init.start : lit.start;
      knobs.push({
        name: d.name,
        value: neg ? -lit.value : lit.value,
        isFloat: lit.isFloat || s.varType.base === 'double' || s.varType.base === 'float',
        start,
        end: lit.end,
        line: d.line,
      });
      void src;
    }
  }
  return knobs.slice(0, 4);
}

/** Return `source` with one knob's literal replaced by a new value. */
export function applyKnob(source: string, knob: Knob, value: number): string {
  const text = knob.isFloat && Number.isInteger(value) && /\./.test(source.slice(knob.start, knob.end)) ? value.toFixed(1) : String(value);
  return source.slice(0, knob.start) + text + source.slice(knob.end);
}
