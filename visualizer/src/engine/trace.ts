/**
 * A Trace is the complete recording of one program run.
 * The UI never re-executes code while you scrub — it just looks up steps[i].
 */

export type StepKind =
  | 'start'
  | 'decl'
  | 'assign'
  | 'print'
  | 'input'
  | 'branch'
  | 'loop'
  | 'loop-init'
  | 'loop-update'
  | 'switch'
  | 'jump'
  | 'call'
  | 'return'
  | 'expr'
  | 'end'
  | 'error';

/** One line of "working out" — e.g.  b * c  →  3 * 2 = 6 */
export interface EvalLine {
  expr: string;
  calc: string;
  result: string;
  note?: string;
}

export type SnapVal =
  | { k: 'v'; text: string; t: string }
  | { k: 'uninit' }
  | { k: 'str'; text: string }
  | { k: 'list'; items: SnapItem[]; vector: boolean; total: number };

export interface SnapItem {
  id: number;
  v: SnapVal;
}

export interface VarSnap {
  id: number;
  name: string;
  type: string;
  meaning: string;
  val: SnapVal;
  isConst: boolean;
  /** this name is a reference to another box */
  refOf?: string;
}

export interface FrameSnap {
  id: number;
  fn: string;
  label: string;
  vars: VarSnap[];
}

export interface LoopSnap {
  id: number;
  line: number;
  kind: 'for' | 'while' | 'do' | 'range';
  round: number;
  varName: string | null;
  head: string;
}

export interface Access {
  /** id of the variable (array / string / vector) */
  owner: number;
  path: number[];
  mode: 'r' | 'w';
}

export interface Step {
  line: number;
  endLine: number;
  kind: StepKind;
  /** narration with light markup: `code` and **bold** */
  text: string;
  evals: EvalLine[];
  branch?: { cond: string; result: boolean; outcome: string; label: 'if' | 'else if' | 'while' | 'for' | 'do' | '?:' };
  switchInfo?: { subject: string; value: string; cases: { label: string; state: 'skip' | 'match' | 'none' }[]; matched: string };
  printed?: string;
  typed?: string[];
  frames: FrameSnap[];
  /** number of console segments visible at this step */
  out: number;
  changed: number[];
  access: Access[];
  loops: LoopSnap[];
}

export interface ConsoleSeg {
  text: string;
  kind: 'out' | 'in';
  step: number;
  line: number;
}

export interface Trace {
  steps: Step[];
  console: ConsoleSeg[];
  /** exactly what the program wrote to cout */
  stdout: string;
  error: { message: string; line: number; kind: 'syntax' | 'runtime' | 'limit' } | null;
  /** variable names used as indexes for each array/string, e.g. { text: ['i'] } */
  pointers: Record<string, string[]>;
}

export interface Knob {
  name: string;
  value: number;
  isFloat: boolean;
  /** offsets of the literal in the source */
  start: number;
  end: number;
  line: number;
}
