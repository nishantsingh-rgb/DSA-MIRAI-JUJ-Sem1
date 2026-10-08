import type { BaseType, TypeSpec } from './ast';

export type NumType = 'int' | 'll' | 'uint' | 'ull' | 'short' | 'double' | 'float' | 'char' | 'bool';

export type Value =
  | { k: 'num'; t: NumType; v: number }
  | { k: 'str'; v: string }
  | { k: 'arr'; elem: TypeSpec; items: Cell[]; vector: boolean }
  | { k: 'stream'; which: 'cout' | 'cin' | 'cerr' }
  | { k: 'manip'; name: string; arg?: number }
  | { k: 'void' };

/** A "box" in memory. Variables and array elements are cells. */
export interface Cell {
  id: number;
  name: string;
  type: TypeSpec;
  value: Value;
  init: boolean;
}

let cellIds = 0;
export const newCell = (name: string, type: TypeSpec, value: Value, init = true): Cell => ({
  id: ++cellIds,
  name,
  type,
  value,
  init,
});

export const num = (t: NumType, v: number): Value => ({ k: 'num', t, v });
export const VOID: Value = { k: 'void' };

export class RuntimeError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.line = line;
  }
}

export const isNumeric = (b: BaseType) =>
  ['int', 'll', 'uint', 'ull', 'short', 'double', 'float', 'char', 'bool'].includes(b);

/** Wrap a number into the range of the given C++ type. */
export function fit(t: NumType, v: number): number {
  switch (t) {
    case 'int':
      return Number.isFinite(v) ? Math.trunc(v) | 0 : 0;
    case 'short':
      return ((Math.trunc(v) << 16) >> 16) | 0;
    case 'uint':
      return Number.isFinite(v) ? Math.trunc(v) >>> 0 : 0;
    case 'll':
    case 'ull':
      return Number.isFinite(v) ? Math.trunc(v) : 0;
    case 'char':
      return ((Math.trunc(v) << 24) >> 24) | 0;
    case 'bool':
      return v !== 0 && !Number.isNaN(v) ? 1 : 0;
    case 'float':
      return Math.fround(v);
    case 'double':
      return v;
  }
}

export const isIntegral = (t: NumType) => t !== 'double' && t !== 'float';

/** Usual arithmetic conversions (simplified but faithful for course programs). */
export function promote(a: NumType, b: NumType): NumType {
  if (a === 'double' || b === 'double') return 'double';
  if (a === 'float' || b === 'float') return 'float';
  if (a === 'ull' || b === 'ull') return 'ull';
  if (a === 'll' || b === 'll') return 'll';
  if (a === 'uint' || b === 'uint') return 'uint';
  return 'int';
}

// ---------- friendly type names ----------
export function typeName(t: TypeSpec): string {
  switch (t.base) {
    case 'll':
      return 'long long';
    case 'ull':
      return 'unsigned long long';
    case 'uint':
      return 'unsigned int';
    case 'vector':
      return `vector<${t.elem ? typeName(t.elem) : '?'}>`;
    default:
      return t.base;
  }
}

export function typeMeaning(t: TypeSpec): string {
  switch (t.base) {
    case 'int':
    case 'short':
    case 'uint':
      return 'whole number';
    case 'll':
    case 'ull':
      return 'big whole number';
    case 'double':
    case 'float':
      return 'decimal number';
    case 'char':
      return 'single character';
    case 'bool':
      return 'true / false';
    case 'string':
      return 'text';
    case 'vector':
      return 'growable list';
    default:
      return '';
  }
}

// ---------- C++ iostream number formatting ----------
export interface StreamFmt {
  boolalpha: boolean;
  fixed: boolean;
  scientific: boolean;
  precision: number;
  width: number;
  fill: string;
  left: boolean;
  showpoint: boolean;
}

export const defaultFmt = (): StreamFmt => ({
  boolalpha: false,
  fixed: false,
  scientific: false,
  precision: 6,
  width: 0,
  fill: ' ',
  left: false,
  showpoint: false,
});

/** Format a floating value exactly like `cout << x` would (default / fixed / scientific). */
export function formatFloat(x: number, f: Pick<StreamFmt, 'fixed' | 'scientific' | 'precision' | 'showpoint'>): string {
  if (Number.isNaN(x)) return x < 0 ? '-nan' : 'nan';
  if (!Number.isFinite(x)) return x < 0 ? '-inf' : 'inf';
  if (f.fixed) return x.toFixed(Math.min(100, f.precision));
  if (f.scientific) return sci(x.toExponential(Math.min(100, f.precision)));
  // %g semantics
  const p = f.precision === 0 ? 1 : f.precision;
  if (x === 0) return Object.is(x, -0) ? '-0' : '0';
  const e = Number(x.toExponential(p - 1).split('e')[1]);
  let s: string;
  if (e < -4 || e >= p) {
    s = x.toExponential(p - 1);
    let [m, ex] = s.split('e');
    if (!f.showpoint && m.includes('.')) m = m.replace(/\.?0+$/, '');
    s = sci(`${m}e${ex}`);
  } else {
    s = x.toFixed(Math.max(0, p - 1 - e));
    if (!f.showpoint && s.includes('.')) s = s.replace(/\.?0+$/, '');
  }
  return s;
}

function sci(s: string): string {
  // JS: 1.5e+7  ->  C++: 1.5e+07
  return s.replace(/e([+-])(\d)$/, 'e$10$2');
}

/** Text that `cout << v` prints. */
export function printText(v: Value, f: StreamFmt): string {
  switch (v.k) {
    case 'str':
      return v.v;
    case 'num':
      if (v.t === 'char') return String.fromCharCode(v.v & 0xff);
      if (v.t === 'bool') return f.boolalpha ? (v.v ? 'true' : 'false') : String(v.v);
      if (v.t === 'double' || v.t === 'float') return formatFloat(v.v, f);
      return String(v.v);
    default:
      return '';
  }
}

/** How a value is shown inside the visualizer (memory boxes, narration). */
export function showValue(v: Value, fmt?: StreamFmt): string {
  switch (v.k) {
    case 'num':
      if (v.t === 'char') return charLiteral(v.v);
      if (v.t === 'bool') return v.v ? 'true' : 'false';
      if (v.t === 'double' || v.t === 'float') return formatFloat(v.v, fmt ?? defaultFmt());
      return String(v.v);
    case 'str':
      return JSON.stringify(v.v);
    case 'arr':
      return `{${v.items
        .slice(0, 12)
        .map((c) => showValue(c.value, fmt))
        .join(', ')}${v.items.length > 12 ? ', …' : ''}}`;
    case 'stream':
      return v.which;
    case 'manip':
      return v.name;
    case 'void':
      return '';
  }
}

export function charLiteral(code: number): string {
  const c = code & 0xff;
  const map: Record<number, string> = { 10: '\\n', 9: '\\t', 0: '\\0', 39: "\\'", 92: '\\\\', 13: '\\r' };
  if (map[c]) return `'${map[c]}'`;
  if (c < 32 || c > 126) return `'\\x${c.toString(16)}'`;
  return `'${String.fromCharCode(c)}'`;
}

export function defaultValue(t: TypeSpec): Value {
  if (t.base === 'string') return { k: 'str', v: '' };
  if (t.base === 'vector') return { k: 'arr', elem: t.elem ?? { base: 'int' }, items: [], vector: true };
  if (isNumeric(t.base)) return num(t.base as NumType, 0);
  return VOID;
}

export function cloneValue(v: Value): Value {
  if (v.k === 'arr') {
    return { ...v, items: v.items.map((c) => newCell(c.name, c.type, cloneValue(c.value), c.init)) };
  }
  return v;
}

/** Bytes reported by sizeof on a typical 64-bit compiler (libstdc++ for string). */
export function sizeOf(t: TypeSpec): number {
  switch (t.base) {
    case 'char':
    case 'bool':
      return 1;
    case 'short':
      return 2;
    case 'int':
    case 'uint':
    case 'float':
      return 4;
    case 'll':
    case 'ull':
    case 'double':
      return 8;
    case 'string':
      return 32;
    case 'vector':
      return 24;
    default:
      return 1;
  }
}
