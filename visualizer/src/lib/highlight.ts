/** Minimal, fast C++ syntax highlighter → tokens per line. */
export type HlKind = 'kw' | 'type' | 'str' | 'num' | 'com' | 'fn' | 'op' | 'pre' | 'id' | 'ws';
export interface HlTok {
  k: HlKind;
  t: string;
}

const KW = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'using', 'namespace', 'const', 'static', 'true', 'false', 'new', 'delete', 'struct', 'class',
  'public', 'private', 'void', 'auto', 'sizeof', 'static_cast', 'constexpr', 'nullptr',
]);
const TYPES = new Set(['int', 'long', 'short', 'double', 'float', 'char', 'bool', 'string', 'unsigned', 'signed', 'vector', 'size_t', 'std']);
const LIB = new Set(['cout', 'cin', 'endl', 'fixed', 'setprecision', 'boolalpha', 'setw', 'main']);

const RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(#[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*)|(\s+)|([^\w\s])/g;

export function highlight(src: string): HlTok[][] {
  const lines: HlTok[][] = [[]];
  const push = (k: HlKind, t: string) => {
    const parts = t.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ k, t: part });
    });
  };
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(src))) {
    const [all, com, pre, str, num, id, ws] = m;
    if (com) push('com', all);
    else if (pre) push('pre', all);
    else if (str) push('str', all);
    else if (num) push('num', all);
    else if (id) {
      const next = src.slice(RE.lastIndex).match(/^\s*\(/);
      push(KW.has(id) ? 'kw' : TYPES.has(id) ? 'type' : LIB.has(id) ? 'fn' : next ? 'fn' : 'id', id);
    } else if (ws) push('ws', all);
    else push('op', all);
  }
  return lines;
}
