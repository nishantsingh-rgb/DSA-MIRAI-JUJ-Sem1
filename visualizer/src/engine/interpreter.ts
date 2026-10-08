import type { Expr, FuncDecl, Program, Stmt, TypeSpec } from './ast';
import type { Access, ConsoleSeg, EvalLine, FrameSnap, LoopSnap, SnapVal, Step, StepKind, Trace, VarSnap } from './trace';
import {
  RuntimeError,
  VOID,
  charLiteral,
  cloneValue,
  defaultFmt,
  defaultValue,
  fit,
  isIntegral,
  isNumeric,
  newCell,
  num,
  printText,
  promote,
  showValue,
  sizeOf,
  typeMeaning,
  typeName,
  type Cell,
  type NumType,
  type StreamFmt,
  type Value,
} from './values';

export interface RunOptions {
  input?: string;
  maxSteps?: number;
}

type Signal = undefined | { s: 'break' } | { s: 'continue' } | { s: 'return'; value: Value };

interface LValue {
  get(): Value;
  set(v: Value): void;
  type: TypeSpec;
  cell: Cell;
  owner: Cell | null;
  path: number[];
}

interface Frame {
  id: number;
  fn: string;
  label: string;
  scopes: Map<string, Cell>[];
  refs: Map<string, string>;
}

interface LoopState {
  id: number;
  line: number;
  kind: LoopSnap['kind'];
  round: number;
  varName: string | null;
  head: string;
}

interface PrintPiece {
  src: string;
  text: string;
  literal: boolean;
  newline: boolean;
}

class StepLimit extends Error {}
class ExitSignal extends Error {}

const CONSTANTS: Record<string, Value> = {
  INT_MAX: num('int', 2147483647),
  INT_MIN: num('int', -2147483648),
  LLONG_MAX: num('ll', Number.MAX_SAFE_INTEGER),
  LLONG_MIN: num('ll', Number.MIN_SAFE_INTEGER),
  M_PI: num('double', Math.PI),
};
const MANIPS = new Set(['endl', 'fixed', 'scientific', 'boolalpha', 'noboolalpha', 'left', 'right', 'showpoint', 'noshowpoint', 'flush', 'ws']);

const OP_WORDS: Record<string, string> = {
  '+=': 'Add',
  '-=': 'Subtract',
  '*=': 'Multiply',
  '/=': 'Divide',
  '%=': 'Take the remainder of',
};

/** Input stream that behaves like std::cin over a fixed text. */
class InputStream {
  pos = 0;
  failed = false;
  constructor(public text: string) {}
  private skipWs() {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) this.pos++;
  }
  read(re: RegExp): string | null {
    if (this.failed) return null;
    this.skipWs();
    const m = this.text.slice(this.pos).match(re);
    if (!m || !m[0]) {
      this.failed = true;
      return null;
    }
    this.pos += m[0].length;
    return m[0];
  }
  line(): string | null {
    if (this.failed || this.pos >= this.text.length) {
      this.failed = true;
      return null;
    }
    const nl = this.text.indexOf('\n', this.pos);
    const end = nl === -1 ? this.text.length : nl;
    const s = this.text.slice(this.pos, end);
    this.pos = nl === -1 ? end : end + 1;
    return s;
  }
}

export function run(program: Program, opts: RunOptions = {}): Trace {
  return new Interpreter(program, opts).run();
}

class Interpreter {
  private steps: Step[] = [];
  private console: ConsoleSeg[] = [];
  private stdout = '';
  private frames: Frame[] = [];
  private globals = new Map<string, Cell>();
  private loops: LoopState[] = [];
  private breakables: ('loop' | 'switch')[] = [];
  private fmt: StreamFmt = defaultFmt();
  private cin: InputStream;
  private maxSteps: number;
  private frameIds = 0;
  private lineStarts: number[] = [];

  // collectors for the statement currently being narrated
  private evals: EvalLine[] = [];
  private changed = new Set<number>();
  private access: Access[] = [];
  private printed: PrintPiece[] = [];
  private lastPushed: Value | null = null;
  private typed: { token: string; target: string; ok: boolean }[] = [];

  constructor(private prog: Program, opts: RunOptions) {
    this.cin = new InputStream(opts.input ?? '');
    this.maxSteps = opts.maxSteps ?? 20000;
    let i = 0;
    this.lineStarts.push(0);
    while ((i = prog.src.indexOf('\n', i) + 1) > 0) this.lineStarts.push(i);
  }

  // ============ driver ============
  run(): Trace {
    let error: Trace['error'] = null;
    const main = this.prog.functions.get('main')!;
    try {
      this.frames.push({ id: ++this.frameIds, fn: '(global)', label: 'global', scopes: [this.globals], refs: new Map() });
      for (const g of this.prog.globals) this.exec(g);
      this.frames.pop();
      this.pushFrame('main', 'main()');
      this.emit(main.line, 'start', 'The program starts running from `main()` — the front door of every C++ program.');
      const sig = this.execBlockBody(main.body.body);
      if (!(sig && sig.s === 'return')) {
        this.emit(this.lineOf(main.body.end - 1), 'return', 'Reached the closing `}` of `main` — the program is done.');
      }
      this.flushOut();
      this.emit(this.lineOf(main.body.end - 1), 'end', 'Finished! Everything the program printed is on the screen.');
    } catch (e) {
      if (e instanceof ExitSignal) {
        this.emit(this.steps.at(-1)?.line ?? 1, 'end', 'The program called `exit()` and stopped.');
      } else if (e instanceof StepLimit) {
        error = {
          message: `Stopped after ${this.maxSteps.toLocaleString()} steps — the program may be stuck in an endless loop, or it is simply too long to animate.`,
          line: this.steps.at(-1)?.line ?? 1,
          kind: 'limit',
        };
      } else if (e instanceof RuntimeError) {
        error = { message: e.message, line: e.line, kind: 'runtime' };
        this.forceEmit(e.line, 'error', `**Runtime error:** ${e.message}`);
      } else {
        error = { message: String((e as Error)?.message ?? e), line: this.steps.at(-1)?.line ?? 1, kind: 'runtime' };
        this.forceEmit(error.line, 'error', `**Something went wrong:** ${error.message}`);
      }
    }
    return {
      steps: this.steps,
      console: this.console,
      stdout: this.stdout,
      error,
      pointers: collectPointers(this.prog),
    };
  }

  // ============ helpers ============
  private lineOf(offset: number): number {
    let lo = 0;
    let hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
  private text(n: { start: number; end: number }): string {
    return this.prog.src.slice(n.start, n.end).replace(/\s+/g, ' ').trim();
  }
  private get frame(): Frame {
    return this.frames[this.frames.length - 1];
  }
  private pushFrame(fn: string, label: string) {
    this.frames.push({ id: ++this.frameIds, fn, label, scopes: [new Map()], refs: new Map() });
  }
  private lookup(name: string): Cell | null {
    const f = this.frame;
    for (let i = f.scopes.length - 1; i >= 0; i--) {
      const c = f.scopes[i].get(name);
      if (c) return c;
    }
    return this.globals.get(name) ?? null;
  }
  private declare(name: string, cell: Cell) {
    this.frame.scopes[this.frame.scopes.length - 1].set(name, cell);
    this.changed.add(cell.id);
  }

  private resetCollectors() {
    this.evals = [];
    this.changed = new Set();
    this.access = [];
    this.printed = [];
    this.typed = [];
  }

  private emit(line: number, kind: StepKind, text: string, extra: Partial<Step> = {}, endLine = line) {
    if (this.steps.length >= this.maxSteps) throw new StepLimit();
    this.forceEmit(line, kind, text, extra, endLine);
  }
  private forceEmit(line: number, kind: StepKind, text: string, extra: Partial<Step> = {}, endLine = line) {
    this.flushOut();
    this.steps.push({
      line,
      endLine: Math.max(line, endLine),
      kind,
      text,
      evals: this.evals.slice(0, 14),
      frames: this.snapshot(),
      out: this.console.length,
      changed: [...this.changed],
      access: this.access.slice(0, 24),
      loops: this.loops.map((l) => ({ ...l })),
      ...extra,
    });
    this.resetCollectors();
  }

  private pendingOut = '';
  private pendingLine = 0;
  private write(text: string, line: number) {
    if (!text) return;
    this.stdout += text;
    if (this.pendingOut && this.pendingLine !== line) this.flushOut();
    this.pendingOut += text;
    this.pendingLine = line;
  }
  private flushOut() {
    if (this.pendingOut) {
      this.console.push({ text: this.pendingOut, kind: 'out', step: this.steps.length, line: this.pendingLine });
      this.pendingOut = '';
    }
  }

  // ---------- snapshots ----------
  private snapVal(c: Cell, depth = 0): SnapVal {
    if (!c.init && c.value.k !== 'arr') return { k: 'uninit' };
    const v = c.value;
    if (v.k === 'arr') {
      const items = v.items.slice(0, 64).map((it) => ({ id: it.id, v: depth > 2 ? { k: 'v' as const, text: '…', t: '' } : this.snapVal(it, depth + 1) }));
      return { k: 'list', items, vector: v.vector, total: v.items.length };
    }
    if (v.k === 'str') return { k: 'str', text: v.v };
    return { k: 'v', text: showValue(v, this.fmt), t: v.k === 'num' ? v.t : v.k };
  }
  private typeLabel(c: Cell): string {
    const v = c.value;
    if (v.k === 'arr' && !v.vector) {
      let t = '';
      let cur: Value = v;
      const dims: number[] = [];
      while (cur.k === 'arr' && !cur.vector) {
        dims.push(cur.items.length);
        t = typeName(cur.elem);
        cur = cur.items[0]?.value ?? VOID;
      }
      return `${t.replace(/vector<.*>/, '') || 'int'}${dims.map((d) => `[${d}]`).join('')}`;
    }
    return typeName(c.type);
  }
  private snapshot(): FrameSnap[] {
    const frames: FrameSnap[] = [];
    const visible = this.frames.filter((f) => f.fn !== '(global)');
    const all: Frame[] = this.globals.size ? [{ id: 0, fn: '(global)', label: 'global variables', scopes: [this.globals], refs: new Map() }, ...visible] : visible;
    for (const f of all) {
      const vars: VarSnap[] = [];
      for (const scope of f.scopes) {
        for (const [name, c] of scope) {
          const ref = f.refs.get(name);
          vars.push({
            id: c.id,
            name,
            type: this.typeLabel(c) + (ref ? '&' : ''),
            meaning: c.value.k === 'arr' && !c.value.vector ? 'fixed-size list' : typeMeaning(c.type),
            val: this.snapVal(c),
            isConst: !!c.type.isConst,
            refOf: ref,
          });
        }
      }
      frames.push({ id: f.id, fn: f.fn, label: f.label, vars });
    }
    return frames;
  }

  // ============ statements ============
  private execBlockBody(body: Stmt[]): Signal {
    for (const s of body) {
      const sig = this.exec(s);
      if (sig) return sig;
    }
    return undefined;
  }

  private scoped<T>(fn: () => T): T {
    this.frame.scopes.push(new Map());
    try {
      return fn();
    } finally {
      this.frame.scopes.pop();
    }
  }

  private exec(s: Stmt): Signal {
    switch (s.type) {
      case 'Empty':
        return undefined;
      case 'Block':
        return this.scoped(() => this.execBlockBody(s.body));
      case 'Decl':
        this.execDecl(s);
        return undefined;
      case 'ExprStmt':
        this.execExprStmt(s.expr, s.line, this.lineOf(s.end - 1));
        return undefined;
      case 'If': {
        const v = this.truthy(this.ev(s.test));
        const cond = this.text(s.test);
        const elseIsIf = s.else?.type === 'If';
        const why = this.why(s.test, v);
        const outcome = v
          ? 'run the `if` part'
          : s.else
            ? elseIsIf
              ? 'check the next condition (`else if`)'
              : 'jump to the `else` part'
            : 'skip it';
        this.emit(s.line, 'branch', `Decision: is \`${cond}\`? ${v ? '**Yes**' : '**No**'}${why} → ${outcome}.`, {
          branch: { cond, result: v, outcome: v ? 'then' : s.else ? 'else' : 'skip', label: 'if' },
        });
        if (v) return this.scoped(() => this.exec(s.then));
        if (s.else) return this.scoped(() => this.exec(s.else!));
        return undefined;
      }
      case 'For':
        return this.execFor(s);
      case 'ForRange':
        return this.execForRange(s);
      case 'While':
      case 'DoWhile':
        return this.execWhile(s);
      case 'Switch':
        return this.execSwitch(s);
      case 'Break': {
        const inner = this.breakables.at(-1);
        this.emit(s.line, 'jump', inner === 'switch' ? '`break` → leave the `switch` right now.' : '`break` → stop the loop immediately and jump past it.');
        return { s: 'break' };
      }
      case 'Continue':
        this.emit(s.line, 'jump', '`continue` → skip the rest of this round and go to the next one.');
        return { s: 'continue' };
      case 'Return': {
        const fnName = this.frame.fn;
        const fn = this.prog.functions.get(fnName);
        let value: Value = VOID;
        if (s.value) {
          value = this.ev(s.value);
          if (fn && fn.ret.base !== 'void' && fn.ret.base !== 'auto') value = this.convert(value, fn.ret, s.line);
        }
        const endLine = this.lineOf(s.end - 1);
        if (fnName === 'main') {
          const code = value.k === 'num' ? value.v : 0;
          this.emit(s.line, 'return', `\`return ${code};\` → main is finished${code === 0 ? ' and reports success (0 means "all good")' : ''}. The program ends.`, {}, endLine);
        } else if (value.k === 'void') {
          this.emit(s.line, 'return', `\`return\` → leave \`${fnName}\` and go back to where it was called.`, {}, endLine);
        } else {
          this.emit(
            s.line,
            'return',
            `\`${this.text(s)}\` → hand back **${showValue(value, this.fmt)}** to whoever called \`${fnName}\`.`,
            {},
            endLine,
          );
        }
        return { s: 'return', value };
      }
    }
  }

  /** a short "(because …)" for conditions */
  private why(e: Expr, v: boolean): string {
    if (e.type === 'Bool' || e.type === 'Num') return '';
    if (e.type === 'Ident') {
      const c = this.lookup(e.name);
      return c ? ` (\`${e.name}\` is ${showValue(c.value, this.fmt)})` : '';
    }
    const top = this.evals.find((x) => x.expr === this.text(e));
    if (top && top.calc !== top.result) return ` — ${top.calc} is ${v ? 'true' : 'false'}`;
    return '';
  }

  private execDecl(s: Stmt & { type: 'Decl' }, quietPrefix?: string) {
    const parts: string[] = [];
    for (const d of s.decls) {
      let t: TypeSpec = { ...s.varType };
      let value: Value;
      let init = true;
      let phrase: string;
      if (d.dims.length) {
        const dims = d.dims.map((x) => (x ? this.toInt(this.ev(x), d.line) : -1));
        if (dims[0] === -1) dims[0] = d.init?.type === 'InitList' ? d.init.items.length : d.init?.type === 'Str' ? d.init.value.length + 1 : 0;
        const build = (level: number, initE: Expr | null): Value => {
          const n = dims[level];
          if (n < 0 || n > 100000) throw new RuntimeError(`An array of size ${n} is not allowed here`, d.line);
          const items: Cell[] = [];
          const list = initE?.type === 'InitList' ? initE.items : initE?.type === 'Str' ? [...initE.value, '\0'].map((ch) => ({ type: 'Char', value: ch, line: d.line, start: 0, end: 0 }) as Expr) : null;
          for (let i = 0; i < n; i++) {
            if (level < dims.length - 1) {
              const inner = build(level + 1, list?.[i] ?? (list ? { type: 'InitList', items: [], line: d.line, start: 0, end: 0 } : null));
              items.push(newCell(`${d.name}`, { base: 'vector', elem: t }, inner));
            } else {
              const ie = list?.[i];
              const has = !!ie || !!list || this.frame.fn === '(global)';
              items.push(newCell(d.name, t, ie ? this.convert(this.ev(ie), t, d.line) : defaultValue(t), has));
            }
          }
          return { k: 'arr', elem: level < dims.length - 1 ? { base: 'vector', elem: t } : t, items, vector: false };
        };
        value = build(0, d.init);
        const list = d.init?.type === 'InitList';
        phrase = `an array \`${d.name}\` with ${dims.map((x) => x).join(' × ')} boxes${list ? ` = ${showValue(value, this.fmt)}` : ''}`;
      } else if (t.base === 'vector') {
        if (d.init) {
          value = this.convert(this.ev(d.init, t), t, d.line);
        } else if (d.ctorArgs?.length) {
          const n = this.toInt(this.ev(d.ctorArgs[0]), d.line);
          const fillV = d.ctorArgs[1] ? this.ev(d.ctorArgs[1]) : defaultValue(t.elem ?? { base: 'int' });
          value = {
            k: 'arr',
            elem: t.elem ?? { base: 'int' },
            vector: true,
            items: Array.from({ length: Math.max(0, n) }, () => newCell(d.name, t.elem ?? { base: 'int' }, cloneValue(this.convert(fillV, t.elem ?? { base: 'int' }, d.line)))),
          };
        } else value = defaultValue(t);
        phrase = `a list \`${d.name}\` = ${showValue(value, this.fmt)}`;
      } else if (d.ctorArgs) {
        // string s(3, '*')  /  int x(5)
        const args = d.ctorArgs.map((a) => this.ev(a));
        if (t.base === 'string' && args.length === 2) value = { k: 'str', v: printText(args[1], defaultFmt()).repeat(Math.max(0, this.toInt(args[0], d.line))) };
        else value = args.length ? this.convert(args[0], t, d.line) : defaultValue(t);
        phrase = `\`${d.name}\` = **${showValue(value, this.fmt)}**`;
      } else if (d.init) {
        if (t.isRef && t.base !== 'auto') {
          const target = this.lv(d.init);
          this.declare(d.name, target.cell);
          this.frame.refs.set(d.name, this.text(d.init));
          parts.push(`a nickname \`${d.name}\` for \`${this.text(d.init)}\` (both names share one box)`);
          continue;
        }
        const raw = this.ev(d.init, t);
        if (t.base === 'auto') t = this.typeOf(raw);
        value = this.convert(raw, t, d.line);
        if (raw.k === 'num' && value.k === 'num' && raw.t !== value.t && (value.t === 'char' || (isIntegral(value.t) && !isIntegral(raw.t)))) {
          this.evals.push({
            expr: `store into ${typeName(t)}`,
            calc: showValue(raw, this.fmt),
            result: showValue(value, this.fmt),
            note: value.t === 'char' ? `${raw.v} is the ASCII code of ${charLiteral(value.v)}` : 'the decimal part is cut off',
          });
        }
        const lit = ['Num', 'Str', 'Char', 'Bool'].includes(d.init.type) || (d.init.type === 'Unary' && d.init.arg.type === 'Num');
        phrase = lit ? `\`${d.name}\` = **${showValue(value, this.fmt)}**` : `\`${d.name}\` = \`${this.text(d.init)}\` → **${showValue(value, this.fmt)}**`;
      } else {
        value = defaultValue(t);
        init = this.frame.fn === '(global)' || t.base === 'string';
        phrase = init ? `\`${d.name}\` = ${showValue(value, this.fmt)}` : `\`${d.name}\` (empty for now)`;
      }
      const cell = newCell(d.name, t, value, init);
      this.declare(d.name, cell);
      parts.push(phrase);
    }
    if (quietPrefix !== undefined) {
      this.emit(s.line, 'loop-init', `${quietPrefix}${parts.join(', ')}.`, {}, this.lineOf(s.end - 1));
      return;
    }
    const t = s.varType;
    const kindWord = t.isConst ? 'constant' : 'box';
    const typeWord = `${typeName(t)} — ${typeMeaning(t)}`;
    const special = (p: string) => p.startsWith('an array') || p.startsWith('a list') || p.startsWith('a nickname');
    let text: string;
    if (parts.length === 1 && special(parts[0])) {
      text = `Make ${parts[0]}.`;
    } else if (parts.length === 1) {
      const m = parts[0].match(/^(`[^`]+`) (.*)$/);
      const [nameCode, rest] = m ? [m[1], m[2]] : [parts[0], ''];
      text = rest.startsWith('(empty')
        ? `Make a ${kindWord} ${nameCode} (${typeWord}). It's empty for now.`
        : `Make a ${kindWord} ${nameCode} (${typeWord}) and put ${rest.replace(/^= /, '')} in it.`;
    } else {
      text = `Make ${parts.length} ${kindWord}es (${typeWord}): ${parts.join(', ').replace(/\(empty for now\)/g, '(empty)')}.`;
    }
    this.emit(s.line, 'decl', text, {}, this.lineOf(s.end - 1));
  }

  private typeOf(v: Value): TypeSpec {
    if (v.k === 'num') return { base: v.t };
    if (v.k === 'str') return { base: 'string' };
    if (v.k === 'arr') return { base: 'vector', elem: v.elem };
    return { base: 'int' };
  }

  // ---------- expression statements (with narration) ----------
  private execExprStmt(e: Expr, line: number, endLine: number) {
    // cout << ... / cin >> ...
    const root = leftmost(e);
    if (root?.type === 'Ident' && (root.name === 'cout' || root.name === 'cerr') && !this.lookup(root.name)) {
      this.ev(e);
      const pieces = this.printed;
      const real = pieces.filter((p) => p.text !== '' || p.newline);
      let text: string;
      if (!real.length) {
        text = `Change how numbers are printed: ${describeManips(this.text(e))}`;
      } else {
        const parts = real.map((p) =>
          p.newline ? 'a new line ⏎' : p.literal ? `“${visible(p.text)}”` : `\`${p.src}\` (${visible(p.text)})`,
        );
        text = `Print ${joinWords(parts)} on the screen.`;
      }
      const printed = real.map((p) => (p.newline ? '\n' : p.text)).join('');
      this.emit(line, 'print', text, { printed }, endLine);
      return;
    }
    if (root?.type === 'Ident' && root.name === 'cin' && !this.lookup('cin')) {
      this.ev(e);
      const t = this.typed;
      if (t.length) {
        this.console.push({ text: t.map((x) => x.token).join(' ') + '\n', kind: 'in', step: this.steps.length, line });
      }
      const parts = t.map((x) => (x.ok ? `**${visible(x.token)}** → \`${x.target}\`` : `nothing left → \`${x.target}\` becomes 0`));
      const text = `The program waits for the user to type. They typed ${joinWords(parts)}.`;
      this.emit(line, 'input', text, { typed: t.map((x) => x.token) }, endLine);
      return;
    }
    if (e.type === 'Call' && e.callee === 'getline') {
      this.ev(e);
      const t = this.typed[0];
      if (t) this.console.push({ text: t.token + '\n', kind: 'in', step: this.steps.length, line });
      this.emit(line, 'input', t ? `Read a whole line of text: **${JSON.stringify(t.token)}** → \`${t.target}\`.` : 'Read a line — but there was no more input.', { typed: t ? [t.token] : [] }, endLine);
      return;
    }

    if (e.type === 'Assign') {
      const target = this.lv(e.target);
      const mark = this.access.length;
      const before = target.cell.init ? showValue(target.get(), this.fmt) : '?';
      this.access.length = mark;
      this.ev(e);
      const after = showValue(target.get(), this.fmt);
      const name = this.text(e.target);
      let text: string;
      if (e.op === '=') {
        const lit = ['Num', 'Str', 'Char', 'Bool'].includes(e.value.type);
        text = lit
          ? `Put **${after}** into \`${name}\`.`
          : e.value.type === 'Ident'
            ? `Copy the value of \`${this.text(e.value)}\` into \`${name}\` → \`${name}\` is now **${after}**.`
            : `Work out \`${this.text(e.value)}\` and store it in \`${name}\` → **${after}**.`;
      } else {
        const w = OP_WORDS[e.op];
        const rhs = this.text(e.value);
        text = w
          ? `${w} \`${name}\` ${e.op === '+=' ? 'with' : 'by'} \`${rhs}\`: \`${name}\` goes from ${before} to **${after}**.`
          : `\`${this.text(e)}\` → \`${name}\` is now **${after}**.`;
      }
      this.emit(line, 'assign', text, {}, endLine);
      return;
    }
    if (e.type === 'Update') {
      const target = this.lv(e.arg);
      const mark = this.access.length;
      const before = showValue(target.get(), this.fmt);
      this.access.length = mark;
      this.ev(e);
      const after = showValue(target.get(), this.fmt);
      const name = this.text(e.arg);
      this.emit(line, 'assign', `\`${this.text(e)}\` → \`${name}\` goes ${e.op === '++' ? 'up' : 'down'} by 1: ${before} → **${after}**.`, {}, endLine);
      return;
    }
    if (e.type === 'Call' && this.prog.functions.has(e.callee)) {
      const v = this.ev(e);
      this.emit(line, 'expr', `Back in \`${this.frame.fn}\` — the call \`${this.text(e)}\` is finished${v.k !== 'void' ? ` (it gave back ${showValue(v, this.fmt)})` : ''}.`, {}, endLine);
      return;
    }
    if (e.type === 'Call' && e.callee === 'swap') {
      this.ev(e);
      this.emit(line, 'assign', `Swap the values of \`${this.text(e.args[0])}\` and \`${this.text(e.args[1])}\`.`, {}, endLine);
      return;
    }
    if (e.type === 'Method') {
      this.lastPushed = null;
      const v = this.ev(e);
      const obj = this.text(e.obj);
      const after = this.lookupValue(e.obj);
      const size = after.k === 'arr' ? after.items.length : after.k === 'str' ? after.v.length : 0;
      const verbs: Record<string, string> = {
        push_back: `Add ${this.lastPushed ? `**${showValue(this.lastPushed, this.fmt)}**` : 'an item'} to the end of \`${obj}\` (it now holds ${size})`,
        pop_back: `Remove the last item of \`${obj}\` (it now holds ${size})`,
        clear: `Empty \`${obj}\``,
      };
      this.emit(line, 'expr', `${verbs[e.name] ?? `Run \`${this.text(e)}\`${v.k !== 'void' ? ` → ${showValue(v, this.fmt)}` : ''}`}.`, {}, endLine);
      return;
    }
    const v = this.ev(e);
    this.emit(line, 'expr', `Run \`${this.text(e)}\`${v.k !== 'void' && e.type !== 'Seq' ? ` → ${showValue(v, this.fmt)}` : ''}.`, {}, endLine);
  }

  /** current value of a simple variable expression (for narration only) */
  private lookupValue(e: Expr): Value {
    return e.type === 'Ident' ? (this.lookup(e.name)?.value ?? VOID) : VOID;
  }

  // ---------- loops ----------
  private condCheck(test: Expr, line: number, loop: LoopState, label: 'for' | 'while' | 'do'): boolean {
    const v = this.truthy(this.ev(test));
    const cond = this.text(test);
    const why = this.why(test, v);
    const nextRound = loop.round + 1;
    const text = v
      ? `Loop check: is \`${cond}\`? **Yes**${why} → ${label === 'do' ? 'go around again' : 'run the loop body'} (round ${nextRound}).`
      : `Loop check: is \`${cond}\`? **No**${why} → the loop is finished, move on.`;
    this.emit(line, 'loop', text, { branch: { cond, result: v, outcome: v ? 'then' : 'else', label } });
    return v;
  }

  private loopVar(s: Stmt & { type: 'For' }): string | null {
    if (s.init?.type === 'Decl') return s.init.decls[0]?.name ?? null;
    if (s.init?.type === 'ExprStmt' && s.init.expr.type === 'Assign' && s.init.expr.target.type === 'Ident') return s.init.expr.target.name;
    if (s.update?.type === 'Update' && s.update.arg.type === 'Ident') return s.update.arg.name;
    return null;
  }

  private runLoop(state: LoopState, body: () => Signal): Signal {
    this.loops.push(state);
    this.breakables.push('loop');
    try {
      return body();
    } finally {
      this.loops.pop();
      this.breakables.pop();
    }
  }

  private execFor(s: Stmt & { type: 'For' }): Signal {
    const head = this.text(s);
    return this.scoped(() => {
      const state: LoopState = { id: s.id, line: s.line, kind: 'for', round: 0, varName: this.loopVar(s), head };
      return this.runLoop(state, () => {
        if (s.init) {
          if (s.init.type === 'Decl') this.execDecl(s.init, 'Start the `for` loop: ');
          else {
            this.ev((s.init as Stmt & { type: 'ExprStmt' }).expr);
            this.emit(s.line, 'loop-init', `Start the \`for\` loop: \`${this.text(s.init)}\`.`);
          }
        }
        for (;;) {
          if (s.test && !this.condCheck(s.test, s.line, state, 'for')) break;
          state.round++;
          const sig = this.scoped(() => this.exec(s.body));
          if (sig?.s === 'break') break;
          if (sig?.s === 'return') return sig;
          if (s.update) {
            this.ev(s.update);
            const u = s.update;
            const name = u.type === 'Update' || u.type === 'Assign' ? this.text(u.type === 'Update' ? u.arg : u.target) : null;
            const c = name ? this.lookup(name) : null;
            this.emit(
              s.line,
              'loop-update',
              c ? `Update: \`${this.text(u)}\` → \`${name}\` is now **${showValue(c.value, this.fmt)}**.` : `Update: \`${this.text(u)}\`.`,
            );
          }
        }
        return undefined;
      });
    });
  }

  private execForRange(s: Stmt & { type: 'ForRange' }): Signal {
    const head = this.text(s);
    const coll = this.ev(s.range);
    const items: Value[] = coll.k === 'arr' ? coll.items.map((c) => c.value) : coll.k === 'str' ? [...coll.v].map((ch) => num('char', ch.charCodeAt(0))) : [];
    const cells = coll.k === 'arr' ? coll.items : null;
    const state: LoopState = { id: s.id, line: s.line, kind: 'range', round: 0, varName: s.name, head };
    return this.runLoop(state, () => {
      for (let i = 0; i < items.length; i++) {
        const r = this.scoped(() => {
          let t = s.varType;
          if (t.base === 'auto') t = { ...this.typeOf(items[i]), isRef: t.isRef };
          if (t.isRef && cells) this.declare(s.name, cells[i]);
          else this.declare(s.name, newCell(s.name, t, cloneValue(this.convert(items[i], t, s.line))));
          state.round = i + 1;
          this.emit(s.line, 'loop', `Take item ${i + 1} of ${items.length}: \`${s.name}\` = **${showValue(items[i], this.fmt)}**.`);
          return this.exec(s.body);
        });
        if (r?.s === 'break') break;
        if (r?.s === 'return') return r;
      }
      this.emit(s.line, 'loop', `No items left in \`${this.text(s.range)}\` → the loop is finished.`);
      return undefined;
    });
  }

  private execWhile(s: Stmt & ({ type: 'While' } | { type: 'DoWhile' })): Signal {
    const isDo = s.type === 'DoWhile';
    const state: LoopState = { id: s.id, line: s.line, kind: isDo ? 'do' : 'while', round: 0, varName: null, head: isDo ? `while (${this.text(s.test)})` : this.text(s) };
    return this.runLoop(state, () => {
      if (isDo) this.emit(s.line, 'loop-init', 'A `do … while` loop always runs its body at least once before checking.');
      for (;;) {
        if (!isDo && !this.condCheck(s.test, s.line, state, 'while')) break;
        state.round++;
        const sig = this.scoped(() => this.exec(s.body));
        if (sig?.s === 'break') break;
        if (sig?.s === 'return') return sig;
        if (isDo && !this.condCheck(s.test, s.testLine, state, 'do')) break;
      }
      return undefined;
    });
  }

  private execSwitch(s: Stmt & { type: 'Switch' }): Signal {
    const v = this.ev(s.disc);
    const subject = this.text(s.disc);
    const cases: { label: string; state: 'skip' | 'match' | 'none' }[] = s.labels.map((l) => ({ label: l.test ? `case ${this.text(l.test)}` : 'default', state: 'none' }));
    let start = -1;
    let matched = '';
    for (let i = 0; i < s.labels.length; i++) {
      const l = s.labels[i];
      if (!l.test) continue;
      const cv = this.ev(l.test);
      if (this.equals(v, cv)) {
        start = l.index;
        cases[i].state = 'match';
        matched = cases[i].label;
        break;
      }
      cases[i].state = 'skip';
    }
    if (start === -1) {
      const d = s.labels.findIndex((l) => !l.test);
      if (d !== -1) {
        start = s.labels[d].index;
        cases[d].state = 'match';
        matched = 'default';
      }
    }
    this.evals = [];
    const value = showValue(v, this.fmt);
    const text =
      start === -1
        ? `Switch on \`${subject}\` = **${value}** → no case matches and there is no \`default\`, so skip the whole switch.`
        : matched === 'default'
          ? `Switch on \`${subject}\` = **${value}** → no case matches, so jump to \`default\`.`
          : `Switch on \`${subject}\` = **${value}** → jump straight to \`${matched}:\`.`;
    this.emit(s.line, 'switch', text, { switchInfo: { subject, value, cases, matched } });
    if (start === -1) return undefined;
    this.breakables.push('switch');
    try {
      return this.scoped(() => {
        for (let i = start; i < s.body.length; i++) {
          const sig = this.exec(s.body[i]);
          if (sig?.s === 'break') return undefined;
          if (sig) return sig;
        }
        return undefined;
      });
    } finally {
      this.breakables.pop();
    }
  }

  // ============ expressions ============
  private truthy(v: Value): boolean {
    if (v.k === 'num') return v.v !== 0;
    if (v.k === 'stream') return !(v.which === 'cin' && this.cin.failed);
    return v.k === 'str' || v.k === 'arr';
  }

  private toInt(v: Value, line: number): number {
    if (v.k !== 'num') throw new RuntimeError('Expected a number here', line);
    return Math.trunc(v.v);
  }

  private equals(a: Value, b: Value): boolean {
    if (a.k === 'num' && b.k === 'num') return a.v === b.v;
    if (a.k === 'str' && b.k === 'str') return a.v === b.v;
    return false;
  }

  convert(v: Value, t: TypeSpec, line: number): Value {
    if (t.base === 'auto') return v;
    if (isNumeric(t.base)) {
      if (v.k === 'num') return num(t.base as NumType, fit(t.base as NumType, v.v));
      throw new RuntimeError(`Can't store ${v.k === 'str' ? 'text' : 'that'} in a ${typeName(t)} box`, line);
    }
    if (t.base === 'string') {
      if (v.k === 'str') return v;
      if (v.k === 'num' && v.t === 'char') return { k: 'str', v: String.fromCharCode(v.v & 0xff) };
      throw new RuntimeError('Only text can be stored in a string', line);
    }
    if (t.base === 'vector') {
      if (v.k === 'arr') {
        const elem = t.elem ?? v.elem;
        return { k: 'arr', elem, vector: true, items: v.items.map((c) => newCell(c.name, elem, cloneValue(this.convert(c.value, elem, line)), c.init)) };
      }
      throw new RuntimeError('Expected a list of values', line);
    }
    return v;
  }

  private rec(e: Expr, calc: string, result: Value, note?: string) {
    const expr = this.text(e);
    const r = showValue(result, this.fmt);
    if (expr === r) return;
    this.evals.push({ expr, calc, result: r, note });
  }

  private show(v: Value) {
    return showValue(v, this.fmt);
  }

  /** Evaluate an expression. `hint` is the type of the box the value will go into (for {…} lists). */
  ev(e: Expr, hint?: TypeSpec): Value {
    switch (e.type) {
      case 'Num':
        return e.isFloat ? num('double', e.value) : num(e.isLong || Math.abs(e.value) > 2147483647 ? 'll' : 'int', e.value);
      case 'Str':
        return { k: 'str', v: e.value };
      case 'Char':
        return num('char', e.value.charCodeAt(0));
      case 'Bool':
        return num('bool', e.value ? 1 : 0);
      case 'Ident': {
        const c = this.lookup(e.name);
        if (c) return c.value;
        if (e.name === 'cout' || e.name === 'cin' || e.name === 'cerr') return { k: 'stream', which: e.name };
        if (MANIPS.has(e.name)) return { k: 'manip', name: e.name };
        if (e.name in CONSTANTS) return CONSTANTS[e.name];
        if (e.name === 'npos') return num('ll', -1);
        throw new RuntimeError(`\`${e.name}\` is used but was never created`, e.line);
      }
      case 'InitList': {
        const elem = hint?.base === 'vector' ? (hint.elem ?? { base: 'int' }) : { base: 'int' as const };
        return {
          k: 'arr',
          elem,
          vector: true,
          items: e.items.map((it) => newCell('', elem, this.convert(this.ev(it, elem), elem, e.line))),
        };
      }
      case 'Seq': {
        let v: Value = VOID;
        for (const it of e.items) v = this.ev(it);
        return v;
      }
      case 'Assign':
        return this.evAssign(e);
      case 'Update': {
        const lv = this.lv(e.arg);
        const old = lv.get();
        if (old.k !== 'num') throw new RuntimeError(`\`${e.op}\` only works on numbers`, e.line);
        const nv = num(old.t, fit(old.t, old.v + (e.op === '++' ? 1 : -1)));
        lv.set(nv);
        return e.prefix ? nv : old;
      }
      case 'Ternary': {
        const t = this.truthy(this.ev(e.test));
        const v = this.ev(t ? e.then : e.else);
        this.rec(e, `${this.text(e.test)} is ${t ? 'true' : 'false'} → pick ${this.text(t ? e.then : e.else)}`, v);
        return v;
      }
      case 'Unary': {
        const a = this.ev(e.arg);
        if (a.k !== 'num') throw new RuntimeError(`\`${e.op}\` needs a number`, e.line);
        let r: Value;
        if (e.op === '!') r = num('bool', a.v ? 0 : 1);
        else if (e.op === '-') {
          const t = isIntegral(a.t) ? promote(a.t, 'int') : a.t;
          r = num(t, fit(t, -a.v));
        } else if (e.op === '~') r = num('int', ~a.v);
        else r = num(promote(a.t, 'int'), a.v);
        if (e.op === '!' && e.arg.type !== 'Bool') this.rec(e, `not ${this.show(a)}`, r);
        return r;
      }
      case 'Cast': {
        const a = this.ev(e.arg);
        const r = this.convert(a, e.to, e.line);
        const note =
          e.to.base === 'char' && a.k === 'num' && a.t !== 'char'
            ? `${a.v} is the ASCII code of ${charLiteral(r.k === 'num' ? r.v : 0)}`
            : e.to.base === 'int' && a.k === 'num' && a.t === 'char'
              ? `the ASCII code of ${charLiteral(a.v)}`
              : a.k === 'num' && !isIntegral(a.t) && isIntegral(e.to.base as NumType)
                ? 'the decimal part is cut off'
                : undefined;
        this.rec(e, `${typeName(e.to)}(${this.show(a)})`, r, note);
        return r;
      }
      case 'Sizeof': {
        let bytes: number;
        if (e.of) bytes = sizeOf(e.of);
        else {
          const v = this.ev(e.arg!);
          bytes = v.k === 'arr' && !v.vector ? v.items.length * (v.items[0] ? sizeOf(v.items[0].type) : 4) : v.k === 'num' ? sizeOf({ base: v.t }) : sizeOf({ base: v.k === 'str' ? 'string' : 'int' });
        }
        const r = num('ull', bytes);
        this.rec(e, `memory used`, r, `${bytes} byte${bytes === 1 ? '' : 's'}`);
        return r;
      }
      case 'Binary':
        return this.evBinary(e);
      case 'Index': {
        const lv = this.lv(e);
        return lv.get();
      }
      case 'Call':
        return this.evCall(e);
      case 'Method':
        return this.evMethod(e);
    }
  }

  private evAssign(e: Expr & { type: 'Assign' }): Value {
    const target = this.lv(e.target);
    if (target.type.isConst) throw new RuntimeError(`\`${this.text(e.target)}\` is a const — it can't be changed`, e.line);
    const rhs = this.ev(e.value, target.type);
    let nv: Value;
    if (e.op === '=') {
      nv = rhs;
    } else {
      const op = e.op.slice(0, -1);
      const cur = target.get();
      nv = this.arith(op, cur, rhs, e.line);
      this.evals.push({ expr: `${this.text(e.target)} ${op} ${this.text(e.value)}`, calc: `${this.show(cur)} ${op} ${this.show(rhs)}`, result: this.show(nv) });
    }
    const conv = this.convert(nv, target.type, e.line);
    if (nv.k === 'num' && conv.k === 'num' && nv.t !== conv.t && conv.t === 'char' && nv.t !== 'char') {
      this.evals.push({ expr: `store into char`, calc: this.show(nv), result: this.show(conv), note: `${nv.v} is the ASCII code of ${charLiteral(conv.v)}` });
    } else if (nv.k === 'num' && conv.k === 'num' && !isIntegral(nv.t) && isIntegral(conv.t) && nv.v !== conv.v) {
      this.evals.push({ expr: `store into ${conv.t}`, calc: this.show(nv), result: this.show(conv), note: 'the decimal part is cut off' });
    }
    target.set(conv);
    return conv;
  }

  /** Arithmetic and bitwise operators on two values. */
  private arith(op: string, a: Value, b: Value, line: number): Value {
    if (op === '+' && (a.k === 'str' || b.k === 'str')) {
      const s = (v: Value) => (v.k === 'str' ? v.v : v.k === 'num' && v.t === 'char' ? String.fromCharCode(v.v) : printText(v, defaultFmt()));
      return { k: 'str', v: s(a) + s(b) };
    }
    if (a.k !== 'num' || b.k !== 'num') throw new RuntimeError(`\`${op}\` can't be used on text here`, line);
    const t = promote(a.t, b.t);
    const x = a.v;
    const y = b.v;
    switch (op) {
      case '+':
        return num(t, fit(t, x + y));
      case '-':
        return num(t, fit(t, x - y));
      case '*':
        return num(t, fit(t, t === 'int' ? Math.imul(x, y) : x * y));
      case '/':
        if (isIntegral(t)) {
          if (y === 0) throw new RuntimeError('Division by zero — a whole number can\'t be divided by 0 (the real program would crash)', line);
          return num(t, fit(t, Math.trunc(x / y)));
        }
        return num(t, fit(t, x / y));
      case '%':
        if (!isIntegral(t)) throw new RuntimeError('`%` only works on whole numbers', line);
        if (y === 0) throw new RuntimeError('Remainder by zero — the real program would crash', line);
        return num(t, fit(t, x % y));
      case '&':
        return num(t, fit(t, Number(BigInt(Math.trunc(x)) & BigInt(Math.trunc(y)))));
      case '|':
        return num(t, fit(t, Number(BigInt(Math.trunc(x)) | BigInt(Math.trunc(y)))));
      case '^':
        return num(t, fit(t, Number(BigInt(Math.trunc(x)) ^ BigInt(Math.trunc(y)))));
      case '<<':
        return num(t, fit(t, x * 2 ** y));
      case '>>':
        return num(t, fit(t, Math.floor(x / 2 ** y)));
    }
    throw new RuntimeError(`Unknown operator ${op}`, line);
  }

  private compare(op: string, a: Value, b: Value, line: number): boolean {
    let x: number | string;
    let y: number | string;
    if (a.k === 'str' || b.k === 'str') {
      const s = (v: Value) => (v.k === 'str' ? v.v : v.k === 'num' && v.t === 'char' ? String.fromCharCode(v.v) : null);
      const sa = s(a);
      const sb = s(b);
      if (sa === null || sb === null) throw new RuntimeError('Text can only be compared with text', line);
      x = sa;
      y = sb;
    } else if (a.k === 'num' && b.k === 'num') {
      x = a.v;
      y = b.v;
    } else throw new RuntimeError(`\`${op}\` can't compare these`, line);
    switch (op) {
      case '==':
        return x === y;
      case '!=':
        return x !== y;
      case '<':
        return x < y;
      case '<=':
        return x <= y;
      case '>':
        return x > y;
      default:
        return x >= y;
    }
  }

  private evBinary(e: Expr & { type: 'Binary' }): Value {
    const { op } = e;
    if (op === '&&' || op === '||') {
      const a = this.truthy(this.ev(e.left));
      if (op === '&&' && !a) {
        const r = num('bool', 0);
        this.rec(e, `false && …`, r, 'the left side is false, so && stops right there');
        return r;
      }
      if (op === '||' && a) {
        const r = num('bool', 1);
        this.rec(e, `true || …`, r, 'the left side is true, so || stops right there');
        return r;
      }
      const b = this.truthy(this.ev(e.right));
      const r = num('bool', b ? 1 : 0);
      this.rec(e, `${a} ${op} ${b}`, r);
      return r;
    }

    const a = this.ev(e.left);
    // streams
    if (a.k === 'stream') {
      if (op === '<<' && a.which !== 'cin') {
        this.output(e.right);
        return a;
      }
      if (op === '>>' && a.which === 'cin') {
        this.input(e.right);
        return a;
      }
      throw new RuntimeError(op === '<<' ? 'Use `>>` with cin' : 'Use `<<` with cout', e.line);
    }

    const b = this.ev(e.right);
    if (['==', '!=', '<', '<=', '>', '>='].includes(op)) {
      const r = num('bool', this.compare(op, a, b, e.line) ? 1 : 0);
      this.rec(e, `${this.show(a)} ${op} ${this.show(b)}`, r, charNote(a, b));
      return r;
    }
    const r = this.arith(op, a, b, e.line);
    let note: string | undefined;
    if (op === '/' && r.k === 'num' && isIntegral(r.t) && a.k === 'num' && b.k === 'num' && a.v % b.v !== 0) {
      note = `whole-number division: ${a.v} ÷ ${b.v} = ${(a.v / b.v).toFixed(2).replace(/0+$/, '')}, the part after the point is dropped`;
    } else if (op === '%' && a.k === 'num' && b.k === 'num') {
      note = `remainder: ${a.v} = ${b.v} × ${Math.trunc(a.v / b.v)} + ${a.v % b.v}`;
    } else note = charNote(a, b);
    this.rec(e, `${this.show(a)} ${op} ${this.show(b)}`, r, note);
    return r;
  }

  private output(e: Expr) {
    const v = this.ev(e);
    const line = e.line;
    if (v.k === 'manip') {
      switch (v.name) {
        case 'endl':
          this.write('\n', line);
          this.printed.push({ src: 'endl', text: '\n', literal: true, newline: true });
          return;
        case 'fixed':
          this.fmt.fixed = true;
          this.fmt.scientific = false;
          break;
        case 'scientific':
          this.fmt.scientific = true;
          this.fmt.fixed = false;
          break;
        case 'boolalpha':
          this.fmt.boolalpha = true;
          break;
        case 'noboolalpha':
          this.fmt.boolalpha = false;
          break;
        case 'left':
          this.fmt.left = true;
          break;
        case 'right':
          this.fmt.left = false;
          break;
        case 'showpoint':
          this.fmt.showpoint = true;
          break;
        case 'noshowpoint':
          this.fmt.showpoint = false;
          break;
        case 'setprecision':
          this.fmt.precision = v.arg ?? 6;
          break;
        case 'setw':
          this.fmt.width = v.arg ?? 0;
          break;
        case 'setfill':
          this.fmt.fill = String.fromCharCode(v.arg ?? 32);
          break;
      }
      return;
    }
    let text = printText(v, this.fmt);
    if (this.fmt.width > text.length) {
      const pad = this.fmt.fill.repeat(this.fmt.width - text.length);
      text = this.fmt.left ? text + pad : pad + text;
    }
    this.fmt.width = 0;
    this.write(text, line);
    const literal = e.type === 'Str' || e.type === 'Char';
    if (literal && text === '\n') this.printed.push({ src: this.text(e), text, literal: true, newline: true });
    else this.printed.push({ src: this.text(e), text, literal, newline: false });
  }

  private input(e: Expr) {
    const target = this.lv(e);
    const t = target.type.base;
    const name = this.text(e);
    let token: string | null;
    let v: Value;
    if (t === 'char') {
      token = this.cin.read(/^\S/);
      v = num('char', token ? token.charCodeAt(0) : 0);
    } else if (t === 'string') {
      token = this.cin.read(/^\S+/);
      v = { k: 'str', v: token ?? '' };
    } else if (t === 'double' || t === 'float') {
      token = this.cin.read(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
      v = num(t, token ? Number(token) : 0);
    } else if (t === 'bool') {
      token = this.cin.read(/^[01]/);
      v = num('bool', token === '1' ? 1 : 0);
    } else {
      token = this.cin.read(/^[+-]?\d+/);
      v = num(t as NumType, token ? Number(token) : 0);
    }
    if (token !== null || t !== 'string') target.set(this.convert(v, target.type, e.line));
    this.typed.push({ token: token ?? '', target: name, ok: token !== null });
  }

  // ---------- lvalues ----------
  private lv(e: Expr): LValue {
    if (e.type === 'Ident') {
      const c = this.lookup(e.name);
      if (!c) throw new RuntimeError(`\`${e.name}\` is used but was never created`, e.line);
      return {
        get: () => c.value,
        set: (v) => {
          c.value = v;
          c.init = true;
          this.changed.add(c.id);
        },
        type: c.type,
        cell: c,
        owner: c.value.k === 'arr' || c.value.k === 'str' ? c : null,
        path: [],
      };
    }
    if (e.type === 'Index') {
      const base = this.lv(e.obj);
      const container = base.get();
      const idx = this.toInt(this.ev(e.index), e.line);
      const owner = base.owner ?? base.cell;
      const path = [...base.path, idx];
      if (container.k === 'arr') {
        if (idx < 0 || idx >= container.items.length) {
          throw new RuntimeError(
            `Index ${idx} is outside \`${this.text(e.obj)}\`, which only has positions 0 to ${container.items.length - 1}`,
            e.line,
          );
        }
        const cell = container.items[idx];
        return {
          get: () => {
            this.access.push({ owner: owner.id, path, mode: 'r' });
            return cell.value;
          },
          set: (v) => {
            cell.value = v;
            cell.init = true;
            this.changed.add(cell.id);
            this.changed.add(owner.id);
            this.access.push({ owner: owner.id, path, mode: 'w' });
          },
          type: { ...cell.type, isConst: base.type.isConst },
          cell,
          owner,
          path,
        };
      }
      if (container.k === 'str') {
        if (idx < 0 || idx > container.v.length) {
          throw new RuntimeError(`Index ${idx} is outside the text \`${this.text(e.obj)}\` (length ${container.v.length})`, e.line);
        }
        return {
          get: () => {
            this.access.push({ owner: owner.id, path, mode: 'r' });
            const s = base.get() as Value & { k: 'str' };
            return num('char', idx < s.v.length ? s.v.charCodeAt(idx) : 0);
          },
          set: (v) => {
            const s = base.get() as Value & { k: 'str' };
            const ch = String.fromCharCode(v.k === 'num' ? v.v & 0xff : 0);
            base.set({ k: 'str', v: s.v.slice(0, idx) + ch + s.v.slice(idx + 1) });
            this.access.push({ owner: owner.id, path, mode: 'w' });
          },
          type: { base: 'char' },
          cell: base.cell,
          owner,
          path,
        };
      }
      throw new RuntimeError(`\`${this.text(e.obj)}\` can't be indexed with [ ]`, e.line);
    }
    if (e.type === 'Method' && (e.name === 'at' || e.name === 'back' || e.name === 'front')) {
      const base = this.lv(e.obj);
      const c = base.get();
      const len = c.k === 'arr' ? c.items.length : c.k === 'str' ? c.v.length : 0;
      const idx = e.name === 'at' ? this.toInt(this.ev(e.args[0]), e.line) : e.name === 'back' ? len - 1 : 0;
      const fake: Expr = { type: 'Index', obj: e.obj, index: { type: 'Num', value: idx, isFloat: false, isLong: false, line: e.line, start: 0, end: 0 }, line: e.line, start: e.start, end: e.end };
      if (idx < 0 || idx >= len) throw new RuntimeError(`\`${this.text(e)}\` is outside the ${len} items`, e.line);
      return this.lv(fake);
    }
    // temporary values (function results, etc.)
    const v = this.ev(e);
    const cell = newCell('(temp)', this.typeOf(v), v);
    return { get: () => cell.value, set: (nv) => (cell.value = nv), type: cell.type, cell, owner: null, path: [] };
  }

  // ---------- calls ----------
  private evCall(e: Expr & { type: 'Call' }): Value {
    const fn = this.prog.functions.get(e.callee);
    if (fn) return this.callUser(fn, e);
    return this.callBuiltin(e);
  }

  private callUser(fn: FuncDecl, e: Expr & { type: 'Call' }): Value {
    if (this.frames.length > 200) throw new RuntimeError('Too many function calls inside each other (stack overflow) — is a recursive function missing its stopping case?', e.line);
    if (e.args.length !== fn.params.length) throw new RuntimeError(`\`${fn.name}\` needs ${fn.params.length} value(s) but got ${e.args.length}`, e.line);
    const bound: { name: string; cell: Cell; ref?: string }[] = [];
    fn.params.forEach((p, i) => {
      const a = e.args[i];
      if (p.type.isRef || p.isArray) {
        const target = this.lv(a);
        bound.push({ name: p.name, cell: target.cell, ref: this.text(a) });
      } else {
        const v = this.convert(this.ev(a), p.type, e.line);
        bound.push({ name: p.name, cell: newCell(p.name, p.type, cloneValue(v)) });
      }
    });
    // keep the caller's half-finished narration safe while the function runs
    const saved = { evals: this.evals, changed: this.changed, access: this.access, printed: this.printed, typed: this.typed };
    const label = `${fn.name}(${bound.map((b) => `${b.name} = ${b.ref && b.cell.value.k === 'arr' ? b.ref : showValue(b.cell.value, this.fmt)}`).join(', ')})`;
    const savedLoops = this.loops;
    const savedBreak = this.breakables;
    this.loops = [];
    this.breakables = [];
    this.resetCollectors();
    this.pushFrame(fn.name, label);
    for (const b of bound) {
      this.declare(b.name, b.cell);
      if (b.ref) this.frame.refs.set(b.name, b.ref);
    }
    let result: Value = VOID;
    try {
      this.emit(fn.line, 'call', `Call \`${this.text(e)}\` → jump into \`${fn.name}\` with ${bound.length ? bound.map((b) => `\`${b.name}\` = ${b.ref ? `\`${b.ref}\` (shared, not copied)` : `**${showValue(b.cell.value, this.fmt)}**`}`).join(', ') : 'nothing'}.`);
      const sig = this.execBlockBody(fn.body.body);
      if (sig?.s === 'return') result = sig.value;
      else if (fn.ret.base !== 'void') throw new RuntimeError(`\`${fn.name}\` finished without returning a value`, this.lineOf(fn.body.end - 1));
      else this.emit(this.lineOf(fn.body.end - 1), 'return', `Reached the end of \`${fn.name}\` → go back to the caller.`);
    } finally {
      this.frames.pop();
      this.loops = savedLoops;
      this.breakables = savedBreak;
    }
    Object.assign(this, saved);
    if (result.k !== 'void') this.rec(e, `${fn.name}(…)`, result, 'the value returned by the function');
    return result;
  }

  private callBuiltin(e: Expr & { type: 'Call' }): Value {
    const name = e.callee;
    const args = () => e.args.map((a) => this.ev(a));
    const n = (v: Value) => {
      if (v.k !== 'num') throw new RuntimeError(`\`${name}\` needs a number`, e.line);
      return v.v;
    };
    const dbl = (x: number) => num('double', x);
    let r: Value;
    switch (name) {
      case 'setprecision':
      case 'setw':
      case 'setfill':
        return { k: 'manip', name, arg: n(this.ev(e.args[0])) };
      case 'sqrt':
        r = dbl(Math.sqrt(n(args()[0])));
        break;
      case 'pow': {
        const [a, b] = args();
        r = dbl(Math.pow(n(a), n(b)));
        break;
      }
      case 'abs': {
        const [a] = args();
        r = a.k === 'num' ? num(isIntegral(a.t) ? promote(a.t, 'int') : a.t, Math.abs(a.v)) : a;
        break;
      }
      case 'fabs':
        r = dbl(Math.abs(n(args()[0])));
        break;
      case 'floor':
        r = dbl(Math.floor(n(args()[0])));
        break;
      case 'ceil':
        r = dbl(Math.ceil(n(args()[0])));
        break;
      case 'round':
        r = dbl(Math.sign(n(args()[0])) * Math.round(Math.abs(n(args()[0]))));
        break;
      case 'max':
      case 'min': {
        const [a, b] = args();
        if (a.k === 'num' && b.k === 'num') {
          const t = promote(a.t, b.t);
          const pick = name === 'max' ? (a.v >= b.v ? a : b) : a.v <= b.v ? a : b;
          r = a.t === b.t ? pick : num(t, (pick as Value & { k: 'num' }).v);
        } else r = a;
        break;
      }
      case 'swap': {
        const x = this.lv(e.args[0]);
        const y = this.lv(e.args[1]);
        const xv = x.get();
        const yv = y.get();
        x.set(yv);
        y.set(xv);
        return VOID;
      }
      case 'tolower':
      case 'toupper': {
        const c = n(args()[0]);
        const ch = String.fromCharCode(c);
        const res = (name === 'tolower' ? ch.toLowerCase() : ch.toUpperCase()).charCodeAt(0);
        r = num('int', res);
        this.rec(e, `${name}(${charLiteral(c)})`, num('char', res), `${charLiteral(c)} → ${charLiteral(res)}`);
        return r;
      }
      case 'isdigit':
      case 'isalpha':
      case 'isupper':
      case 'islower':
      case 'isalnum':
      case 'isspace':
      case 'ispunct': {
        const c = String.fromCharCode(n(args()[0]));
        const tests: Record<string, RegExp> = {
          isdigit: /[0-9]/, isalpha: /[A-Za-z]/, isupper: /[A-Z]/, islower: /[a-z]/, isalnum: /[A-Za-z0-9]/, isspace: /\s/, ispunct: /[!-/:-@[-`{-~]/,
        };
        r = num('bool', tests[name].test(c) ? 1 : 0);
        break;
      }
      case 'to_string': {
        const [a] = args();
        r = { k: 'str', v: a.k === 'num' && !isIntegral(a.t) ? a.v.toFixed(6) : printText(a, defaultFmt()) };
        break;
      }
      case 'stoi':
      case 'stoll':
      case 'stod': {
        const [a] = args();
        const s = a.k === 'str' ? a.v : '';
        const v = name === 'stod' ? parseFloat(s) : parseInt(s, 10);
        if (Number.isNaN(v)) throw new RuntimeError(`${name}("${s}") — that text is not a number`, e.line);
        r = num(name === 'stod' ? 'double' : name === 'stoll' ? 'll' : 'int', v);
        break;
      }
      case 'string': {
        const a = args();
        r = a.length === 2 ? { k: 'str', v: printText(a[1], defaultFmt()).repeat(Math.max(0, n(a[0]))) } : a[0] ?? { k: 'str', v: '' };
        break;
      }
      case 'getline': {
        const target = this.lv(e.args[1]);
        const line = this.cin.line();
        target.set({ k: 'str', v: line ?? '' });
        this.typed.push({ token: line ?? '', target: this.text(e.args[1]), ok: line !== null });
        return { k: 'stream', which: 'cin' };
      }
      case 'exit':
        throw new ExitSignal();
      default:
        throw new RuntimeError(`The visualizer doesn't know the function \`${name}()\` yet`, e.line);
    }
    this.rec(e, `${name}(${e.args.map((a) => this.text(a)).join(', ')})`, r);
    return r;
  }

  private evMethod(e: Expr & { type: 'Method' }): Value {
    const base = this.lv(e.obj);
    const v = base.get();
    const name = e.name;
    const arg = (i: number) => this.ev(e.args[i]);
    if (v.k === 'str') {
      const s = v.v;
      let r: Value;
      switch (name) {
        case 'length':
        case 'size':
          r = num('ll', s.length);
          break;
        case 'empty':
          r = num('bool', s.length === 0 ? 1 : 0);
          break;
        case 'substr': {
          const pos = this.toInt(arg(0), e.line);
          if (pos > s.length) throw new RuntimeError(`substr start ${pos} is past the end of the text`, e.line);
          const len = e.args[1] ? this.toInt(arg(1), e.line) : s.length;
          r = { k: 'str', v: s.substr(pos, len) };
          break;
        }
        case 'find': {
          const what = arg(0);
          const needle = what.k === 'str' ? what.v : what.k === 'num' ? String.fromCharCode(what.v) : '';
          r = num('ll', s.indexOf(needle, e.args[1] ? this.toInt(arg(1), e.line) : 0));
          break;
        }
        case 'push_back':
        case 'append':
        case 'pop_back':
        case 'clear': {
          let nv = s;
          if (name === 'push_back' || name === 'append') {
            const a = arg(0);
            this.lastPushed = a;
            nv = s + (a.k === 'str' ? a.v : a.k === 'num' ? String.fromCharCode(a.v) : '');
          } else if (name === 'pop_back') nv = s.slice(0, -1);
          else nv = '';
          base.set({ k: 'str', v: nv });
          return VOID;
        }
        case 'at':
        case 'back':
        case 'front':
          return this.lv(e).get();
        default:
          throw new RuntimeError(`The visualizer doesn't know \`.${name}()\` for text yet`, e.line);
      }
      this.rec(e, `${this.text(e.obj)}.${name}(…)`, r);
      return r;
    }
    if (v.k === 'arr') {
      switch (name) {
        case 'size': {
          const r = num('ll', v.items.length);
          this.rec(e, `count the items`, r);
          return r;
        }
        case 'empty':
          return num('bool', v.items.length === 0 ? 1 : 0);
        case 'push_back': {
          const a = this.convert(arg(0), v.elem, e.line);
          this.lastPushed = a;
          v.items.push(newCell('', v.elem, cloneValue(a)));
          this.changed.add(base.cell.id);
          this.access.push({ owner: (base.owner ?? base.cell).id, path: [...base.path, v.items.length - 1], mode: 'w' });
          return VOID;
        }
        case 'pop_back':
          if (!v.items.length) throw new RuntimeError('pop_back() on an empty list', e.line);
          v.items.pop();
          this.changed.add(base.cell.id);
          return VOID;
        case 'clear':
          v.items.length = 0;
          this.changed.add(base.cell.id);
          return VOID;
        case 'at':
        case 'back':
        case 'front':
          return this.lv(e).get();
        default:
          throw new RuntimeError(`The visualizer doesn't know \`.${name}()\` for lists yet`, e.line);
      }
    }
    throw new RuntimeError(`\`.${name}()\` can't be used on \`${this.text(e.obj)}\``, e.line);
  }
}

// ============ small utilities ============
function leftmost(e: Expr): Expr | null {
  let cur: Expr = e;
  while (cur.type === 'Binary' && (cur.op === '<<' || cur.op === '>>')) cur = cur.left;
  return cur;
}

function charNote(a: Value, b: Value): string | undefined {
  const c = [a, b].find((v) => v.k === 'num' && v.t === 'char') as (Value & { k: 'num' }) | undefined;
  const other = [a, b].find((v) => v !== c);
  if (!c || (other?.k === 'num' && other.t === 'char')) return undefined;
  if (other?.k === 'str') return undefined;
  return `${charLiteral(c.v)} is stored as the number ${c.v} (its ASCII code)`;
}

function visible(s: string): string {
  if (/^ +$/.test(s)) return '␣'.repeat(s.length);
  return s.replace(/\n/g, '⏎').replace(/\t/g, '⇥');
}

function joinWords(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

function describeManips(code: string): string {
  const out: string[] = [];
  if (/boolalpha/.test(code)) out.push('`boolalpha` makes true/false print as words instead of 1/0');
  if (/fixed/.test(code)) out.push('`fixed` prints decimals with a fixed number of digits after the point');
  const p = code.match(/setprecision\s*\(\s*(\d+)/);
  if (p) out.push(`\`setprecision(${p[1]})\` → ${p[1]} digit${p[1] === '1' ? '' : 's'}${/fixed/.test(code) ? ' after the decimal point' : ''}`);
  return out.length ? out.join('; ') + '.' : `\`${code}\`.`;
}

/** Which simple variables are used as indexes into which arrays/strings (for pointer arrows). */
function collectPointers(p: Program): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  const visitE = (e: Expr | null | undefined): void => {
    if (!e) return;
    switch (e.type) {
      case 'Index': {
        let root: Expr = e.obj;
        while (root.type === 'Index') root = root.obj;
        if (root.type === 'Ident') {
          const ids: string[] = [];
          const grab = (x: Expr) => {
            if (x.type === 'Ident') ids.push(x.name);
            else if (x.type === 'Binary' && (x.op === '+' || x.op === '-')) {
              if (x.left.type === 'Ident' && x.right.type === 'Num') ids.push(x.left.name);
            }
          };
          grab(e.index);
          (map[root.name] ??= new Set());
          ids.forEach((id) => map[root.name].add(id));
        }
        visitE(e.obj);
        visitE(e.index);
        return;
      }
      case 'Binary':
        visitE(e.left);
        visitE(e.right);
        return;
      case 'Assign':
        visitE(e.target);
        visitE(e.value);
        return;
      case 'Unary':
      case 'Update':
        visitE(e.arg);
        return;
      case 'Ternary':
        visitE(e.test);
        visitE(e.then);
        visitE(e.else);
        return;
      case 'Call':
        e.args.forEach(visitE);
        return;
      case 'Method':
        visitE(e.obj);
        e.args.forEach(visitE);
        return;
      case 'Cast':
        visitE(e.arg);
        return;
      case 'InitList':
      case 'Seq':
        e.items.forEach(visitE);
        return;
      default:
        return;
    }
  };
  const visitS = (s: Stmt | null): void => {
    if (!s) return;
    switch (s.type) {
      case 'Block':
        s.body.forEach(visitS);
        return;
      case 'Decl':
        s.decls.forEach((d) => visitE(d.init));
        return;
      case 'ExprStmt':
        visitE(s.expr);
        return;
      case 'If':
        visitE(s.test);
        visitS(s.then);
        visitS(s.else);
        return;
      case 'For':
        visitS(s.init);
        visitE(s.test);
        visitE(s.update);
        visitS(s.body);
        return;
      case 'ForRange':
        visitS(s.body);
        return;
      case 'While':
      case 'DoWhile':
        visitE(s.test);
        visitS(s.body);
        return;
      case 'Switch':
        visitE(s.disc);
        s.body.forEach(visitS);
        return;
      case 'Return':
        visitE(s.value);
        return;
      default:
        return;
    }
  };
  p.functions.forEach((f) => visitS(f.body));
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) out[k] = [...v];
  return out;
}
