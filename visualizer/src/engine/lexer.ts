/**
 * Tokenizer for the beginner-friendly subset of C++ used in the course.
 * Every token remembers where it came from so the visualizer can highlight it.
 */

export type TokKind = 'num' | 'str' | 'char' | 'ident' | 'op' | 'eof';

export interface Token {
  kind: TokKind;
  text: string;
  /** decoded value for num/str/char tokens */
  value?: number | string;
  /** for numbers: was it written with a decimal point / exponent / LL suffix? */
  isFloat?: boolean;
  isLong?: boolean;
  line: number;
  col: number;
  start: number;
  end: number;
}

export class CppSyntaxError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.line = line;
  }
}

// Longest operators first so ">>=" wins over ">>" and ">".
const OPS = [
  '<<=', '>>=', '...',
  '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '->', '::',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '&', '|', '^', '~', '?', ':', ';', ',', '.',
  '(', ')', '{', '}', '[', ']',
];

const ESCAPES: Record<string, string> = {
  n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"', '0': '\0', r: '\r', a: '\x07', b: '\b', '?': '?',
};

export function tokenize(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;
  const n = src.length;

  const push = (kind: TokKind, start: number, extra: Partial<Token> = {}) => {
    toks.push({ kind, text: src.slice(start, i), line, col: start - lineStart + 1, start, end: i, ...extra });
  };

  const readEscape = (): string => {
    // assumes src[i] === '\\'
    const c = src[i + 1];
    i += 2;
    if (c === undefined) throw new CppSyntaxError('Unfinished escape sequence', line);
    if (c in ESCAPES) return ESCAPES[c];
    return c;
  };

  while (i < n) {
    const c = src[i];

    if (c === '\n') {
      i++;
      line++;
      lineStart = i;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
      continue;
    }
    // Preprocessor lines (#include ...) are ignored — the "library" is built in.
    if (c === '#') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') {
          line++;
          lineStart = i + 1;
        }
        i++;
      }
      i += 2;
      continue;
    }

    const start = i;

    // Numbers: 42, 3.14, 1e5, .5, 100LL, 2.5f, 0x1F
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let isFloat = false;
      let isLong = false;
      let value: number;
      if (c === '0' && /[xX]/.test(src[i + 1] ?? '')) {
        i += 2;
        while (/[0-9a-fA-F']/.test(src[i] ?? '')) i++;
        value = parseInt(src.slice(start + 2, i).replace(/'/g, ''), 16);
      } else {
        while (/[0-9']/.test(src[i] ?? '')) i++;
        if (src[i] === '.') {
          isFloat = true;
          i++;
          while (/[0-9]/.test(src[i] ?? '')) i++;
        }
        if (/[eE]/.test(src[i] ?? '') && /[-+0-9]/.test(src[i + 1] ?? '')) {
          isFloat = true;
          i += 2;
          while (/[0-9]/.test(src[i] ?? '')) i++;
        }
        value = Number(src.slice(start, i).replace(/'/g, ''));
      }
      // suffixes
      while (/[uUlLfF]/.test(src[i] ?? '')) {
        if (/[lL]/.test(src[i])) isLong = true;
        if (/[fF]/.test(src[i]) && isFloat) isFloat = true;
        i++;
      }
      push('num', start, { value, isFloat, isLong });
      continue;
    }

    if (/[A-Za-z_]/.test(c)) {
      while (/[A-Za-z0-9_]/.test(src[i] ?? '')) i++;
      push('ident', start);
      continue;
    }

    if (c === '"') {
      i++;
      let s = '';
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') throw new CppSyntaxError('A text in double quotes was not closed', line);
        if (src[i] === '\\') s += readEscape();
        else s += src[i++];
      }
      if (i >= n) throw new CppSyntaxError('A text in double quotes was not closed', line);
      i++;
      push('str', start, { value: s });
      continue;
    }

    if (c === "'") {
      i++;
      let s = '';
      if (src[i] === '\\') s = readEscape();
      else s = src[i++] ?? '';
      if (src[i] !== "'") throw new CppSyntaxError("A character in single quotes was not closed", line);
      i++;
      push('char', start, { value: s });
      continue;
    }

    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new CppSyntaxError(`Unexpected symbol "${c}"`, line);
    i += op.length;
    push('op', start);
  }
  toks.push({ kind: 'eof', text: '', line, col: 1, start: n, end: n });
  return toks;
}
