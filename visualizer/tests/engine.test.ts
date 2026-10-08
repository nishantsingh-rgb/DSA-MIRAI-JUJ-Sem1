/**
 * The most important test in the project:
 * for EVERY course program, the in-browser interpreter must print exactly
 * what the real C++ compiler printed (captured by scripts/build-catalog.mjs).
 */
import { describe, expect, it } from 'vitest';
import catalog from '../src/generated/catalog.json';
import { analyze, applyKnob } from '../src/engine';

// Programs whose output legitimately differs between compilers.
// sizeof(string) is 32 with GCC's libstdc++ but 24 with Apple's libc++.
const PLATFORM_DEPENDENT = new Set(['01_Getting_Started_with_Cpp/L2_HW_1_Print_sizeof_of_each_type']);

const programs = catalog.topics.flatMap((t) => t.programs);

describe('every course program', () => {
  it('catalog is not empty', () => {
    expect(programs.length).toBeGreaterThan(0);
  });

  for (const p of programs) {
    it(p.id, () => {
      const a = analyze(p.source, p.input ?? '');
      expect(a.syntaxError).toBeNull();
      expect(a.trace!.error).toBeNull();
      expect(a.trace!.steps.length).toBeGreaterThan(1);
      if (p.expectedOutput !== null && !PLATFORM_DEPENDENT.has(p.id)) {
        expect(a.trace!.stdout).toBe(p.expectedOutput);
      }
    });
  }
});

const out = (src: string, input = '') => {
  const a = analyze(src, input);
  if (a.syntaxError) throw new Error(a.syntaxError.message);
  return a.trace!;
};

describe('language features beyond the current course', () => {
  it('functions, recursion and references', () => {
    const t = out(`#include <iostream>
using namespace std;
int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); }
void twice(int &x) { x *= 2; }
int main() { int a = 5; twice(a); cout << fact(5) << " " << a << endl; return 0; }`);
    expect(t.stdout).toBe('120 10\n');
    expect(t.steps.some((s) => s.kind === 'call')).toBe(true);
  });

  it('arrays, vectors and bubble sort', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
int main() {
  int a[5] = {5, 1, 4, 2, 8};
  int n = 5;
  for (int i = 0; i < n - 1; i++)
    for (int j = 0; j < n - 1 - i; j++)
      if (a[j] > a[j + 1]) swap(a[j], a[j + 1]);
  vector<int> v;
  for (int x : a) v.push_back(x * 10);
  for (int i = 0; i < v.size(); i++) cout << v[i] << ' ';
  cout << endl << v.size();
  return 0;
}`);
    expect(t.stdout).toBe('10 20 40 50 80 \n5');
    expect(t.pointers.a).toEqual(expect.arrayContaining(['j']));
  });

  it('while, do-while, continue, ternary, compound ops', () => {
    const t = out(`#include <iostream>
using namespace std;
int main() {
  int i = 0, s = 0;
  do { i++; if (i % 2 == 0) continue; s += i; } while (i < 9);
  int big = s > 20 ? s : -1;
  cout << s << " " << big << endl;
  return 0;
}`);
    expect(t.stdout).toBe('25 25\n');
  });

  it('formats doubles like iostream', () => {
    const t = out(`#include <iostream>
#include <iomanip>
using namespace std;
int main() {
  cout << 1.0/3 << " " << 100.0 << " " << 1e7 << " " << 0.0001 << " " << 123456789.0 << endl;
  cout << fixed << setprecision(3) << 2.0/3 << endl;
  return 0;
}`);
    expect(t.stdout).toBe('0.333333 100 1e+07 0.0001 1.23457e+08\n0.667\n');
  });

  it('reports runtime errors kindly instead of crashing', () => {
    const t = out(`int main() { int a = 5, b = 0; int c = a / b; return 0; }`);
    expect(t.error?.kind).toBe('runtime');
  });

  it('stops endless loops', () => {
    const t = out(`int main() { while (true) {} return 0; }`);
    expect(t.error?.kind).toBe('limit');
  });

  it('reports syntax errors with a line number', () => {
    const a = analyze(`int main() {\n  int x = 5\n  return 0;\n}`);
    expect(a.syntaxError?.line).toBe(3);
  });

  it('knobs rewrite the starting value', () => {
    const src = `int main() {\n  int n = 5;\n  return 0;\n}`;
    const a = analyze(src);
    expect(a.knobs[0].name).toBe('n');
    expect(applyKnob(src, a.knobs[0], 7)).toContain('int n = 7;');
  });
});
