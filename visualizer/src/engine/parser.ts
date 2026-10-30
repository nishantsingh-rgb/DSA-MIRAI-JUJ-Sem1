import type { BaseType, Capture, Declarator, Expr, FieldDecl, FuncDecl, Param, Program, Stmt, SwitchLabel, TypeSpec } from './ast';
import { CppSyntaxError, tokenize, type Token } from './lexer';

const TYPE_WORDS = new Set([
  'int', 'long', 'short', 'double', 'float', 'char', 'bool', 'string', 'void', 'auto',
  'unsigned', 'signed', 'const', 'vector', 'size_t', 'static', 'constexpr', 'pair', 'struct',
]);

const BINARY_PREC: Record<string, number> = {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
  '==': 6, '!=': 6,
  '<': 7, '<=': 7, '>': 7, '>=': 7,
  '<<': 8, '>>': 8,
  '+': 9, '-': 9,
  '*': 10, '/': 10, '%': 10,
};

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^=']);

let loopIds = 0;

export function parse(src: string): Program {
  // `std::` is noise for beginners' programs — drop it so `std::cout` == `cout`.
  const raw = tokenize(src);
  const toks: Token[] = [];
  for (let k = 0; k < raw.length; k++) {
    if (raw[k].kind === 'ident' && raw[k].text === 'std' && raw[k + 1]?.text === '::') {
      k++;
      continue;
    }
    toks.push(raw[k]);
  }
  return new Parser(toks, src).program();
}

class Parser {
  private p = 0;
  /** struct types (and `using` / `typedef` aliases) declared so far, by name */
  private structs = new Map<string, TypeSpec>();
  constructor(private toks: Token[], private src: string) {}

  // ---------- helpers ----------
  private peek(o = 0): Token {
    return this.toks[Math.min(this.p + o, this.toks.length - 1)];
  }
  private next(): Token {
    return this.toks[this.p++];
  }
  private is(text: string, o = 0): boolean {
    const t = this.peek(o);
    return (t.kind === 'op' || t.kind === 'ident') && t.text === text;
  }
  private eat(text: string): boolean {
    if (this.is(text)) {
      this.p++;
      return true;
    }
    return false;
  }
  private expect(text: string, what?: string): Token {
    if (!this.is(text)) {
      const t = this.peek();
      throw new CppSyntaxError(
        `Expected "${text}"${what ? ` ${what}` : ''} but found "${t.text || 'end of file'}"`,
        t.line,
      );
    }
    return this.next();
  }
  private ident(): Token {
    const t = this.peek();
    if (t.kind !== 'ident') throw new CppSyntaxError(`Expected a name but found "${t.text || 'end of file'}"`, t.line);
    return this.next();
  }
  private prevEnd(): number {
    return this.toks[this.p - 1]?.end ?? 0;
  }
  private node<T extends object>(startTok: Token, data: T): T & { line: number; start: number; end: number } {
    return { ...data, line: startTok.line, start: startTok.start, end: this.prevEnd() };
  }

  private isTypeStart(o = 0): boolean {
    const t = this.peek(o);
    if (t.kind === 'ident' && this.structs.has(t.text)) return true;
    if (t.kind !== 'ident' || !TYPE_WORDS.has(t.text)) return false;
    // `int(x)` / `char('A' + 1)` are functional casts, not declarations.
    if (['int', 'char', 'double', 'float', 'bool', 'long', 'string'].includes(t.text) && this.is('(', o + 1)) return false;
    return true;
  }

  // ---------- types ----------
  private type(): TypeSpec {
    let isConst = false;
    let unsigned = false;
    let longs = 0;
    let base: BaseType | null = null;
    let elem: TypeSpec | undefined;
    let struct: TypeSpec | undefined;
    for (;;) {
      const t = this.peek();
      if (t.kind !== 'ident') break;
      const w = t.text;
      if (w === 'const' || w === 'constexpr') {
        isConst = true;
      } else if (w === 'static' || w === 'signed') {
        /* ignore */
      } else if (w === 'unsigned') {
        unsigned = true;
      } else if (w === 'long') {
        longs++;
      } else if (w === 'short') {
        base = 'short';
      } else if (base === null && ['int', 'double', 'float', 'char', 'bool', 'string', 'void', 'auto'].includes(w)) {
        base = w as BaseType;
      } else if (base === null && w === 'size_t') {
        base = 'ull';
      } else if (base === null && w === 'vector') {
        this.next();
        this.expect('<', 'after vector');
        elem = this.type();
        this.closeAngle('vector');
        base = 'vector';
        continue;
      } else if (base === null && w === 'pair') {
        this.next();
        this.expect('<', 'after pair');
        const first = this.type();
        this.expect(',', 'between the two types of pair<..., ...>');
        const second = this.type();
        this.closeAngle('pair');
        struct = {
          base: 'struct',
          name: 'pair',
          fields: [
            { name: 'first', type: first, init: null },
            { name: 'second', type: second, init: null },
          ],
        };
        base = 'struct';
        continue;
      } else if (w === 'struct' && this.structs.has(this.peek(1).text)) {
        /* `struct Student s;` — the keyword is optional */
      } else if (base === null && this.structs.has(w)) {
        struct = this.structs.get(w)!;
        base = struct.base;
      } else break;
      this.next();
    }
    if (base === null && longs === 0 && !unsigned) {
      const t = this.peek();
      throw new CppSyntaxError(`Expected a type but found "${t.text}"`, t.line);
    }
    if (base === 'double' && longs) base = 'double';
    else if (longs >= 1 && (base === null || base === 'int')) base = unsigned ? 'ull' : 'll';
    else if (base === null) base = unsigned ? 'uint' : 'int';
    else if (unsigned && base === 'int') base = 'uint';
    // NB: `long` alone is 64-bit on Linux/macOS, which is what the course machines use.
    let isRef = false;
    if (this.eat('&')) isRef = true;
    if (struct) return { ...struct, isConst, isRef };
    return { base, elem, isConst, isRef };
  }

  /** Expect the `>` that closes a template, splitting `>>` (vector<pair<int,int>>). */
  private closeAngle(what: string) {
    if (this.is('>>')) {
      const t2 = this.peek();
      this.toks.splice(this.p, 1, { ...t2, text: '>', end: t2.start + 1 }, { ...t2, text: '>', start: t2.start + 1 });
    }
    this.expect('>', `to close ${what}<...>`);
  }

  /** struct Name { type a; type b, c; }; */
  private isStructDef(): boolean {
    return this.is('struct') && this.peek(1).kind === 'ident' && this.is('{', 2);
  }
  private structDef() {
    this.expect('struct');
    const name = this.ident().text;
    const fields: FieldDecl[] = [];
    const spec: TypeSpec = { base: 'struct', name, fields };
    this.structs.set(name, spec);
    this.expect('{');
    while (!this.is('}')) {
      const ft = this.type();
      do {
        const fn = this.ident();
        if (this.is('(')) throw new CppSyntaxError('Functions inside a struct are not supported by the visualizer yet', fn.line);
        let init: Expr | null = null;
        if (this.eat('=')) init = this.is('{') ? this.initList() : this.assign();
        else if (this.is('{')) init = this.initList();
        fields.push({ name: fn.text, type: ft, init });
      } while (this.eat(','));
      this.expect(';', 'after the struct member');
    }
    this.expect('}');
    this.expect(';', 'after the struct definition (a struct ends with "};")');
  }

  // ---------- program ----------
  program(): Program {
    const functions = new Map<string, FuncDecl>();
    const globals: (Stmt & { type: 'Decl' })[] = [];
    const protoDefaults = new Map<string, (Expr | null)[]>();
    while (this.peek().kind !== 'eof') {
      if (this.eat('using')) {
        // using pii = pair<int, int>;  (using namespace std; is ignored)
        if (this.peek().kind === 'ident' && this.is('=', 1)) {
          const name = this.next().text;
          this.next();
          this.structs.set(name, this.type());
          this.expect(';');
          continue;
        }
        while (!this.is(';')) this.next();
        this.next();
        continue;
      }
      if (this.eat('typedef')) {
        const t = this.type();
        this.structs.set(this.ident().text, t);
        this.expect(';');
        continue;
      }
      if (this.eat(';')) continue;
      if (this.isStructDef()) {
        this.structDef();
        continue;
      }
      const startTok = this.peek();
      const type = this.type();
      if (this.peek().kind === 'ident' && this.is('(', 1)) {
        const name = this.next().text;
        this.expect('(');
        const params: Param[] = [];
        if (!this.is(')')) {
          if (this.is('void') && this.is(')', 1)) this.next();
          else
            do {
              const pt = this.type();
              const pn = this.ident().text;
              let isArray = false;
              while (this.eat('[')) {
                isArray = true;
                while (!this.is(']')) this.next();
                this.expect(']');
              }
              const def = this.eat('=') ? this.assign() : null;
              params.push({ type: pt, name: pn, isArray, def });
            } while (this.eat(','));
        }
        this.expect(')');
        if (this.eat(';')) {
          // prototype: remember its default arguments for the definition below
          protoDefaults.set(name, params.map((p) => p.def));
          continue;
        }
        const body = this.block();
        const fromProto = protoDefaults.get(name);
        if (fromProto) params.forEach((p, i) => (p.def ??= fromProto[i] ?? null));
        functions.set(name, { name, ret: type, params, body, line: startTok.line });
      } else {
        globals.push(this.declRest(startTok, type));
      }
    }
    if (!functions.has('main')) throw new CppSyntaxError('This program has no main() function', 1);
    return { functions, globals, src: this.src };
  }

  // ---------- statements ----------
  private block(): Stmt & { type: 'Block' } {
    const s = this.expect('{', 'to open a block');
    const body: Stmt[] = [];
    while (!this.is('}')) {
      if (this.peek().kind === 'eof') throw new CppSyntaxError('A "{" was never closed with "}"', s.line);
      body.push(this.statement());
    }
    this.next();
    return this.node(s, { type: 'Block' as const, body });
  }

  private declRest(startTok: Token, varType: TypeSpec): Stmt & { type: 'Decl' } {
    const decls: Declarator[] = [];
    do {
      let bind: string[] | undefined;
      if (this.is('[')) bind = this.bindList();
      const nt = bind ? this.toks[this.p - 1] : this.ident();
      const dims: (Expr | null)[] = [];
      while (this.eat('[')) {
        dims.push(this.is(']') ? null : this.expr());
        this.expect(']');
      }
      let init: Expr | null = null;
      let ctorArgs: Expr[] | null = null;
      if (this.eat('=')) {
        init = this.is('{') ? this.initList() : this.assign();
      } else if (this.is('{')) {
        init = this.initList();
      } else if (this.eat('(')) {
        ctorArgs = [];
        if (!this.is(')')) do ctorArgs.push(this.assign()); while (this.eat(','));
        this.expect(')');
      }
      decls.push({ name: bind ? `[${bind.join(', ')}]` : nt.text, dims, init, ctorArgs, bind, line: nt.line, start: nt.start, end: this.prevEnd() });
    } while (this.eat(','));
    this.expect(';', 'at the end of the declaration');
    return this.node(startTok, { type: 'Decl' as const, varType, decls });
  }

  /** [a, b] of a structured binding */
  private bindList(): string[] {
    this.expect('[');
    const names: string[] = [];
    do names.push(this.ident().text);
    while (this.eat(','));
    this.expect(']', 'to close the [a, b] names');
    return names;
  }

  private initList(): Expr {
    const s = this.expect('{');
    const items: Expr[] = [];
    while (!this.is('}')) {
      items.push(this.is('{') ? this.initList() : this.assign());
      if (!this.eat(',')) break;
    }
    this.expect('}');
    return this.node(s, { type: 'InitList' as const, items });
  }

  private statement(): Stmt {
    const t = this.peek();
    if (this.is('{')) return this.block();
    if (this.eat(';')) return this.node(t, { type: 'Empty' as const });

    if (this.eat('if')) {
      this.expect('(', 'after if');
      const test = this.expr();
      this.expect(')', 'to close the if condition');
      const then = this.statement();
      let elseStmt: Stmt | null = null;
      let elseLine = 0;
      if (this.is('else')) {
        elseLine = this.next().line;
        elseStmt = this.statement();
      }
      return { type: 'If', test, then, else: elseStmt, elseLine, line: t.line, start: t.start, end: test.end + 1 };
    }

    if (this.eat('for')) {
      this.expect('(', 'after for');
      // range-based for: for (int x : v)
      if (this.isTypeStart()) {
        const save = this.p;
        const vt = this.type();
        let bind: string[] | undefined;
        if (this.is('[')) {
          bind = this.bindList();
          this.p--; // re-read "]" as the loop variable's "name" token below
        }
        if ((this.peek().kind === 'ident' || bind) && this.is(':', 1)) {
          this.next();
          const name = bind ? `[${bind.join(', ')}]` : this.toks[this.p - 1].text;
          this.next();
          const range = this.expr();
          this.expect(')');
          const head = this.prevEnd();
          const body = this.statement();
          return { type: 'ForRange', varType: vt, name, bind, range, body, id: ++loopIds, line: t.line, start: t.start, end: head };
        }
        this.p = save;
      }
      let init: Stmt | null = null;
      if (this.isTypeStart()) {
        const st = this.peek();
        init = this.declRest(st, this.type());
      } else if (!this.eat(';')) {
        const st = this.peek();
        const e = this.exprSeq();
        this.expect(';');
        init = this.node(st, { type: 'ExprStmt' as const, expr: e });
      }
      const test = this.is(';') ? null : this.expr();
      this.expect(';', 'in the for loop header');
      const update = this.is(')') ? null : this.exprSeq();
      this.expect(')', 'to close the for loop header');
      const head = this.prevEnd();
      const body = this.statement();
      return { type: 'For', init, test, update, body, id: ++loopIds, line: t.line, start: t.start, end: head };
    }

    if (this.eat('while')) {
      this.expect('(', 'after while');
      const test = this.expr();
      this.expect(')');
      const head = this.prevEnd();
      const body = this.statement();
      return { type: 'While', test, body, id: ++loopIds, line: t.line, start: t.start, end: head };
    }

    if (this.eat('do')) {
      const body = this.statement();
      const wt = this.expect('while', 'after the do { } block');
      this.expect('(');
      const test = this.expr();
      this.expect(')');
      this.expect(';');
      return { type: 'DoWhile', test, body, id: ++loopIds, testLine: wt.line, line: t.line, start: t.start, end: t.end };
    }

    if (this.eat('switch')) {
      this.expect('(', 'after switch');
      const disc = this.expr();
      this.expect(')');
      const head = this.prevEnd();
      this.expect('{');
      const body: Stmt[] = [];
      const labels: SwitchLabel[] = [];
      while (!this.is('}')) {
        const lt = this.peek();
        if (this.eat('case')) {
          const test = this.ternary();
          this.expect(':', 'after the case value');
          labels.push({ test, index: body.length, line: lt.line });
        } else if (this.eat('default')) {
          this.expect(':', 'after default');
          labels.push({ test: null, index: body.length, line: lt.line });
        } else {
          if (lt.kind === 'eof') throw new CppSyntaxError('The switch block was never closed', t.line);
          body.push(this.statement());
        }
      }
      this.next();
      return { type: 'Switch', disc, body, labels, line: t.line, start: t.start, end: head };
    }

    if (this.eat('break')) {
      this.expect(';');
      return this.node(t, { type: 'Break' as const });
    }
    if (this.eat('continue')) {
      this.expect(';');
      return this.node(t, { type: 'Continue' as const });
    }
    if (this.eat('return')) {
      const value = this.is(';') ? null : this.expr();
      this.expect(';', 'after return');
      return this.node(t, { type: 'Return' as const, value });
    }

    if (this.isStructDef()) {
      this.structDef();
      return this.node(t, { type: 'Empty' as const });
    }
    if (this.isTypeStart()) {
      return this.declRest(t, this.type());
    }

    const expr = this.exprSeq();
    this.expect(';', 'at the end of the statement');
    return this.node(t, { type: 'ExprStmt' as const, expr });
  }

  // ---------- expressions ----------
  private exprSeq(): Expr {
    const s = this.peek();
    const first = this.assign();
    if (!this.is(',')) return first;
    const items = [first];
    while (this.eat(',')) items.push(this.assign());
    return this.node(s, { type: 'Seq' as const, items });
  }

  expr(): Expr {
    return this.assign();
  }

  private assign(): Expr {
    const s = this.peek();
    const left = this.ternary();
    const t = this.peek();
    if (t.kind === 'op' && ASSIGN_OPS.has(t.text)) {
      this.next();
      const value = this.is('{') ? this.initList() : this.assign();
      if (!['Ident', 'Index', 'Member', 'Unary'].includes(left.type))
        throw new CppSyntaxError(`Can't assign to "${this.src.slice(left.start, left.end)}"`, t.line);
      return this.node(s, { type: 'Assign' as const, op: t.text, target: left, value });
    }
    return left;
  }

  private ternary(): Expr {
    const s = this.peek();
    const test = this.binary(1);
    if (this.eat('?')) {
      const then = this.assign();
      this.expect(':', 'in the ?: expression');
      const els = this.assign();
      return this.node(s, { type: 'Ternary' as const, test, then, else: els });
    }
    return test;
  }

  private binary(minPrec: number): Expr {
    const s = this.peek();
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      const prec = t.kind === 'op' ? BINARY_PREC[t.text] : undefined;
      if (prec === undefined || prec < minPrec) break;
      this.next();
      const right = this.binary(prec + 1);
      left = this.node(s, { type: 'Binary' as const, op: t.text, left, right });
    }
    return left;
  }

  private unary(): Expr {
    const t = this.peek();
    if (t.kind === 'op' && ['!', '-', '+', '~', '*'].includes(t.text)) {
      this.next();
      const arg = this.unary();
      return this.node(t, { type: 'Unary' as const, op: t.text, arg });
    }
    if (t.kind === 'op' && (t.text === '++' || t.text === '--')) {
      this.next();
      const arg = this.unary();
      return this.node(t, { type: 'Update' as const, op: t.text as '++' | '--', prefix: true, arg });
    }
    // C-style cast: (int) x
    if (this.is('(') && this.peek(1).kind === 'ident' && TYPE_WORDS.has(this.peek(1).text) && this.peek(1).text !== 'const') {
      const save = this.p;
      this.next();
      try {
        const to = this.type();
        if (this.eat(')')) {
          const arg = this.unary();
          return this.node(t, { type: 'Cast' as const, to, arg });
        }
      } catch {
        /* not a cast */
      }
      this.p = save;
    }
    if (this.is('sizeof')) {
      this.next();
      if (this.is('(') && this.peek(1).kind === 'ident' && TYPE_WORDS.has(this.peek(1).text)) {
        this.next();
        const of = this.type();
        this.expect(')');
        return this.node(t, { type: 'Sizeof' as const, of, arg: null });
      }
      const arg = this.unary();
      return this.node(t, { type: 'Sizeof' as const, of: null, arg });
    }
    return this.postfix();
  }

  private postfix(): Expr {
    const s = this.peek();
    let e = this.primary();
    for (;;) {
      if (this.eat('[')) {
        const index = this.expr();
        this.expect(']');
        e = this.node(s, { type: 'Index' as const, obj: e, index });
      } else if (this.is('.')) {
        this.next();
        const name = this.ident().text;
        if (!this.eat('(')) {
          e = this.node(s, { type: 'Member' as const, obj: e, name });
          continue;
        }
        const args: Expr[] = [];
        if (!this.is(')')) do args.push(this.assign()); while (this.eat(','));
        this.expect(')');
        e = this.node(s, { type: 'Method' as const, obj: e, name, args });
      } else if (this.is('++') || this.is('--')) {
        const op = this.next().text as '++' | '--';
        e = this.node(s, { type: 'Update' as const, op, prefix: false, arg: e });
      } else break;
    }
    return e;
  }

  private primary(): Expr {
    const t = this.peek();
    if (t.kind === 'num') {
      this.next();
      return this.node(t, { type: 'Num' as const, value: t.value as number, isFloat: !!t.isFloat, isLong: !!t.isLong });
    }
    if (t.kind === 'str') {
      this.next();
      let value = t.value as string;
      while (this.peek().kind === 'str') value += this.next().value as string; // "a" "b"
      return this.node(t, { type: 'Str' as const, value });
    }
    if (t.kind === 'char') {
      this.next();
      return this.node(t, { type: 'Char' as const, value: t.value as string });
    }
    if (this.eat('(')) {
      const e = this.exprSeq();
      this.expect(')', 'to close the bracket');
      // keep the brackets in the node's text so narration reads naturally
      return { ...e, start: t.start, end: this.prevEnd() };
    }
    if (this.is('{')) return this.initList();
    if (this.is('[')) return this.lambda();
    if (t.kind === 'ident') {
      // greater<int>()  /  greater<>()  /  less<int>()
      if ((t.text === 'greater' || t.text === 'less') && this.is('<', 1) && (this.is('>', 2) || this.isTypeStart(2))) {
        this.next();
        this.next();
        if (!this.is('>') && !this.is('>>')) this.type();
        this.closeAngle(t.text);
        this.expect('(');
        this.expect(')');
        return this.node(t, { type: 'Functor' as const, name: t.text });
      }
      if (t.text === 'true' || t.text === 'false') {
        this.next();
        return this.node(t, { type: 'Bool' as const, value: t.text === 'true' });
      }
      if (t.text === 'static_cast') {
        this.next();
        this.expect('<');
        const to = this.type();
        this.expect('>');
        this.expect('(');
        const arg = this.expr();
        this.expect(')');
        return this.node(t, { type: 'Cast' as const, to, arg });
      }
      // functional cast: int(x), char(x), double(x)
      if (['int', 'char', 'double', 'float', 'bool', 'long'].includes(t.text) && this.is('(', 1)) {
        const to = this.type();
        this.expect('(');
        const arg = this.expr();
        this.expect(')');
        return this.node(t, { type: 'Cast' as const, to, arg });
      }
      this.next();
      if (this.is('(')) {
        this.next();
        const args: Expr[] = [];
        if (!this.is(')')) do args.push(this.assign()); while (this.eat(','));
        this.expect(')', `to close the call to ${t.text}()`);
        return this.node(t, { type: 'Call' as const, callee: t.text, args });
      }
      return this.node(t, { type: 'Ident' as const, name: t.text });
    }
    throw new CppSyntaxError(`Unexpected "${t.text || 'end of file'}"`, t.line);
  }

  /** [captures](params) -> ret { body } */
  private lambda(): Expr {
    const s = this.expect('[');
    const capture: Capture = { all: null, names: [] };
    while (!this.is(']')) {
      if (this.is('&') && this.peek(1).kind !== 'ident') {
        this.next();
        capture.all = 'ref';
      } else if (this.eat('=')) {
        capture.all = 'val';
      } else {
        const byRef = this.eat('&');
        capture.names.push({ name: this.ident().text, byRef });
      }
      if (!this.eat(',')) break;
    }
    this.expect(']', 'to close the lambda capture list');
    const params: Param[] = [];
    if (this.eat('(')) {
      if (!this.is(')'))
        do {
          const pt = this.type();
          const pn = this.ident().text;
          params.push({ type: pt, name: pn, isArray: false, def: null });
        } while (this.eat(','));
      this.expect(')', 'to close the lambda parameters');
    }
    this.eat('mutable');
    let ret: TypeSpec = { base: 'auto' };
    if (this.eat('->')) ret = this.type();
    const body = this.block();
    const fn: FuncDecl = { name: 'lambda', ret, params, body, line: s.line };
    return this.node(s, { type: 'Lambda' as const, fn, capture });
  }
}
