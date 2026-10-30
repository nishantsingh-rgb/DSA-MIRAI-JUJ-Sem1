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

  it('default arguments, in the definition or the prototype', () => {
    const t = out(`#include <iostream>
using namespace std;
int area(int w, int h = 3);
int power(int b, int e = 2) { int r = 1; for (int i = 0; i < e; i++) r *= b; return r; }
int main() { cout << power(5) << " " << power(2, 5) << " " << area(4) << endl; return 0; }
int area(int w, int h) { return w * h; }`);
    expect(t.stdout).toBe('25 32 12\n');
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

  it('sort on vectors, arrays and strings, greater<>(), offsets, reverse', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
int main() {
    vector<int> v = {5, 2, 9, 1, 7};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << endl;
    int a[] = {4, -1, 3, 8, 0};
    int n = 5;
    sort(a, a + n);
    for (int i = 0; i < n; i++) cout << a[i] << " ";
    cout << endl;
    sort(v.begin(), v.end(), greater<int>());
    for (int x : v) cout << x << " ";
    cout << endl;
    sort(a, a + n, greater<>());
    for (int x : a) cout << x << ' ';
    cout << endl;
    vector<double> d = {2.5, 1.25, 3.0};
    sort(d.begin(), d.end());
    for (double x : d) cout << x << " ";
    cout << endl;
    vector<char> c = {'z', 'a', 'm'};
    sort(c.begin(), c.end());
    for (char x : c) cout << x;
    cout << endl;
    vector<string> s = {"pear", "apple", "fig", "Banana"};
    sort(s.begin(), s.end());
    for (string x : s) cout << x << " ";
    cout << endl;
    string w = "hello";
    sort(w.begin(), w.end());
    cout << w << endl;
    vector<int> p = {9, 8, 7, 6, 5, 4};
    sort(p.begin() + 2, p.end());
    for (int x : p) cout << x << " ";
    cout << endl;
    reverse(p.begin(), p.end());
    for (int x : p) cout << x << " ";
    cout << endl;
    stable_sort(p.begin(), p.end());
    cout << p[0] << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("1 2 5 7 9 \n-1 0 3 4 8 \n9 7 5 2 1 \n8 4 3 0 -1 \n1.25 2.5 3 \namz\nBanana apple fig pear \nehllo\n9 8 4 5 6 7 \n7 6 5 4 8 9 \n4\n");
  });

  it('lambda and function comparators, [&] / [x] captures, stored lambdas', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
bool byLen(const string &a, const string &b) {
    if (a.size() != b.size()) return a.size() < b.size();
    return a < b;
}
int main() {
    vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
    sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    for (int x : v) cout << x << " ";
    cout << endl;
    vector<string> w = {"kiwi", "fig", "banana", "apple", "date"};
    sort(w.begin(), w.end(), byLen);
    for (const string &x : w) cout << x << " ";
    cout << endl;
    sort(w.begin(), w.end(), [](const string &a, const string &b) {
        if (a[0] != b[0]) return a[0] < b[0];
        return a.size() > b.size();
    });
    for (auto x : w) cout << x << " ";
    cout << endl;
    int freq[10] = {0};
    vector<int> nums = {4, 1, 4, 2, 1, 4, 3};
    for (int x : nums) freq[x]++;
    vector<int> keys = {1, 2, 3, 4};
    sort(keys.begin(), keys.end(), [&](int a, int b) { return freq[a] > freq[b] || (freq[a] == freq[b] && a < b); });
    for (int k : keys) cout << k << ":" << freq[k] << " ";
    cout << endl;
    auto cmp = [](int a, int b) {
        int ra = a % 3, rb = b % 3;
        if (ra != rb) return ra < rb;
        return a < b;
    };
    sort(nums.begin(), nums.end(), cmp);
    for (int x : nums) cout << x << " ";
    cout << endl;
    cout << cmp(3, 4) << " " << cmp(4, 3) << endl;
    int limit = 3;
    auto small = [limit](int x) { return x < limit; };
    cout << count(nums.begin(), nums.end(), 4) << " " << small(2) << small(5) << endl;
    vector<int> order = {2, 0, 1};
    vector<int> score = {50, 70, 60};
    sort(order.begin(), order.end(), [&score](int i, int j) { return score[i] > score[j]; });
    for (int i : order) cout << i << " ";
    cout << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("9 6 5 4 3 2 1 1 \nfig date kiwi apple banana \napple banana date fig kiwi \n4:3 1:2 2:1 3:1 \n3 1 1 4 4 4 2 \n1 0\n3 10\n1 2 0 \n");
  });

  it('pair: brace init, make_pair, .first/.second, sorting, structured bindings', () => {
    const t = out(`#include <iostream>
#include <vector>
#include <algorithm>
#include <utility>
using namespace std;
pair<int, int> minmax2(int a, int b) {
    if (a < b) return {a, b};
    return make_pair(b, a);
}
int main() {
    pair<int, int> p = {3, 4};
    cout << p.first << " " << p.second << endl;
    p.first = 10;
    p.second += 5;
    cout << p.first << "," << p.second << endl;
    pair<string, int> ps = make_pair("Asha", 85);
    cout << ps.first << " scored " << ps.second << endl;
    pair<int, string> q(2, "two");
    cout << q.second << endl;
    vector<pair<int, int>> v = {{1, 3}, {2, 6}, {8, 10}, {15, 18}, {1, 2}};
    v.push_back({4, 5});
    v.push_back(make_pair(0, 9));
    sort(v.begin(), v.end());
    for (auto x : v) cout << "(" << x.first << "," << x.second << ") ";
    cout << endl;
    vector<pair<int, int>> merged;
    for (auto &iv : v) {
        if (merged.empty() || merged.back().second < iv.first) merged.push_back(iv);
        else merged.back().second = max(merged.back().second, iv.second);
    }
    for (const auto &m : merged) cout << m.first << "-" << m.second << " ";
    cout << endl;
    for (auto &x : v) x.second = 0;
    cout << v[0].second << v[3].second << " " << v[2].first << endl;
    v[1].first = 99;
    cout << v[1].first << endl;
    auto [a, b] = minmax2(9, 2);
    cout << a << " " << b << endl;
    for (auto [x, y] : merged) cout << x + y << " ";
    cout << endl;
    sort(merged.begin(), merged.end(), [](const pair<int, int> &l, const pair<int, int> &r) {
        return l.second - l.first > r.second - r.first;
    });
    for (auto m : merged) cout << m.first << " ";
    cout << endl;
    pair<int, int> z = minmax2(5, 1);
    cout << (z < p) << (p == p) << (z != p) << endl;
    vector<pair<string, int>> people;
    people.push_back({"Ravi", 72});
    people.emplace_back("Mia", 90);
    sort(people.begin(), people.end(), [](const pair<string,int>& x, const pair<string,int>& y) { return x.second > y.second; });
    for (auto &pp : people) cout << pp.first << " " << pp.second << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("3 4\n10,9\nAsha scored 85\ntwo\n(0,9) (1,2) (1,3) (2,6) (4,5) (8,10) (15,18) \n0-10 15-18 \n00 1\n99\n2 9\n10 33 \n0 15 \n111\nMia 90\nRavi 72\n");
  });

  it('structs: aggregate init, members, vectors of structs, passing to functions', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
struct Student {
    string name;
    int marks;
};
struct Point { int x, y; char tag = 'p'; double w; };
void show(const Student &s) { cout << s.name << ": " << s.marks << endl; }
Student top(vector<Student> v) {
    Student best = v[0];
    for (int i = 1; i < (int)v.size(); i++)
        if (v[i].marks > best.marks) best = v[i];
    return best;
}
bool byMarks(const Student &a, const Student &b) { return a.marks > b.marks; }
int main() {
    Student s = {"Asha", 85};
    show(s);
    Student t;
    t.name = "Ravi";
    t.marks = 72;
    t.marks += 3;
    show(t);
    vector<Student> v = {{"Asha", 85}, {"Ravi", 72}};
    v.push_back({"Mia", 90});
    v.push_back(s);
    v[3].name = "Asha2";
    v[3].marks--;
    sort(v.begin(), v.end(), [](const Student &a, const Student &b) {
        if (a.marks != b.marks) return a.marks > b.marks;
        return a.name < b.name;
    });
    for (const auto &st : v) cout << st.name << " " << st.marks << " " << st.name.size() << " " << st.name[0] << endl;
    show(top(v));
    sort(v.begin(), v.end(), byMarks);
    cout << v.back().name << endl;
    Point p{1, 2};
    cout << p.x << p.y << p.tag << endl;
    Point arr[2] = {{3, 4, 'a', 1.5}, {5, 6}};
    cout << arr[0].w + arr[1].x << arr[1].tag << endl;
    Student copy = s;
    copy.marks = 0;
    cout << s.marks << " " << copy.marks << endl;
    double sum = 0;
    for (auto st : v) sum += st.marks;
    cout << fixed << setprecision(2) << sum / v.size() << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("Asha: 85\nRavi: 75\nMia 90 3 M\nAsha 85 4 A\nAsha2 84 5 A\nRavi 72 4 R\nMia: 90\nRavi\n12p\n6.5p\n85 0\n82.75\n");
  });

  it('searching: lower_bound, upper_bound, binary_search, find, count, max_element, INT_MIN', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
int main() {
    vector<int> v = {1, 3, 3, 5, 8, 13};
    cout << lower_bound(v.begin(), v.end(), 3) - v.begin() << endl;
    cout << upper_bound(v.begin(), v.end(), 3) - v.begin() << endl;
    cout << lower_bound(v.begin(), v.end(), 100) - v.begin() << endl;
    int a[] = {2, 4, 6, 8, 10};
    int n = 5;
    int pos = lower_bound(a, a + n, 7) - a;
    cout << pos << " " << (upper_bound(a, a + n, 10) - a) << endl;
    cout << binary_search(v.begin(), v.end(), 5) << binary_search(v.begin(), v.end(), 6) << endl;
    cout << boolalpha << binary_search(a, a + n, 8) << noboolalpha << endl;
    cout << count(v.begin(), v.end(), 3) << endl;
    cout << find(v.begin(), v.end(), 8) - v.begin() << endl;
    auto it = find(v.begin(), v.end(), 42);
    if (it == v.end()) cout << "not found" << endl;
    auto it2 = find(v.begin(), v.end(), 5);
    if (it2 != v.end()) cout << "found " << *it2 << " at " << it2 - v.begin() << endl;
    cout << max_element(v.begin(), v.end()) - v.begin() << " " << *max_element(v.begin(), v.end()) << endl;
    cout << *min_element(a, a + n) << " " << min_element(a, a + n) - a << endl;
    cout << accumulate(v.begin(), v.end(), 0) << endl;
    vector<int> w(5);
    vector<int> z(3, 7);
    cout << w.size() << " " << (int)z.size() << " " << z[2] << endl;
    cout << INT_MAX << " " << INT_MIN << endl;
    int best = INT_MIN, low = INT_MAX;
    for (int x : v) { best = max(best, x); low = min(low, x); }
    cout << best << " " << low << endl;
    vector<string> names = {"amy", "bob", "cat"};
    cout << lower_bound(names.begin(), names.end(), string("bob")) - names.begin() << endl;
    cout << (names[0] < names[1]) << (names[2] == "cat") << names[1].size() << names[2][0] << endl;
    auto p = v.begin() + 2;
    cout << *p << " " << *(v.begin() + 4) << " " << *v.begin() << endl;
    *p = 4;
    cout << v[2] << endl;
    double avg = accumulate(v.begin(), v.end(), 0.0) / v.size();
    cout << fixed << setprecision(2) << avg << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("1\n3\n6\n3 5\n10\ntrue\n2\n4\nnot found\nfound 5 at 3\n5 13\n2 0\n33\n5 3 7\n2147483647 -2147483648\n13 1\n1\n113c\n3 8 1\n4\n5.67\n");
  });

  it('type aliases, greater<pair>, structured bindings by reference', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
using pii = pair<int, int>;
typedef long long ll;
int main() {
    vector<pii> v;
    for (int i = 0; i < 4; i++) v.push_back({i % 2, 10 - i});
    sort(v.begin(), v.end(), greater<pii>());
    for (auto &[a, b] : v) b *= 2;
    for (const auto &[a, b] : v) cout << a << ":" << b << " ";
    cout << endl;
    ll big = 1LL << 40;
    cout << big << endl;
    int less = 3, greater = 5;
    cout << (less < greater) << endl;
    return 0;
}`);
    expect(t.error).toBeNull();
    expect(t.stdout).toBe("1:18 1:14 0:20 0:16 \n1099511627776\n1\n");
  });

  it('shows pairs, structs and comparator calls sensibly', () => {
    const t = out(`#include <bits/stdc++.h>
using namespace std;
struct Student { string name; int marks; };
int main() {
  vector<pair<int, int>> v = {{3, 1}, {1, 2}, {2, 0}};
  Student s = {"Asha", 85};
  sort(v.begin(), v.end(), [](const pair<int, int> &a, const pair<int, int> &b) { return a.second < b.second; });
  return 0;
}`);
    expect(t.error).toBeNull();
    const sortStep = t.steps.find((s) => s.text.startsWith('Sort'))!;
    expect(sortStep.text).toContain('the lambda');
    expect(sortStep.evals.length).toBeGreaterThan(0);
    // comparator calls run quietly: one step for the whole sort, not one per comparison
    expect(t.steps.filter((s) => s.kind === 'call')).toHaveLength(0);
    const vars = t.steps.at(-1)!.frames.at(-1)!.vars;
    const v = vars.find((x) => x.name === 'v')!;
    expect(v.val.k === 'list' && v.val.items.map((i) => (i.v.k === 'v' ? i.v.text : ''))).toEqual(['(2, 0)', '(3, 1)', '(1, 2)']);
    const s = vars.find((x) => x.name === 's')!;
    expect(s.type).toBe('Student');
    expect(s.val).toMatchObject({ k: 'v', text: '{name: "Asha", marks: 85}' });
  });
});
