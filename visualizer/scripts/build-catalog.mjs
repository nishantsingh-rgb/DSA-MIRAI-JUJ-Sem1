#!/usr/bin/env node
/**
 * build-catalog.mjs
 * -----------------
 * Scans the course folders (../01_Getting_Started_with_Cpp, ../02_Operators, ...)
 * and produces src/generated/catalog.json — the single data file the website reads.
 *
 * For every  NN_Topic/Codes/L<lesson>_<Class|HW>_<k>_<Title>.cpp  it records:
 *   - the source code
 *   - human-friendly text from content/programs.json (optional — sensible fallbacks)
 *   - the REAL output, produced by compiling and running the program with g++/clang++
 *     (when a compiler is available). The site uses it to show a "verified" badge.
 *
 * It also copies each topic's *_Content.pdf into public/notes/ so the site can link it.
 *
 * New topics / programs appear automatically: just add files and rebuild.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const REPO = path.resolve(APP, '..');
const OUT_FILE = path.join(APP, 'src/generated/catalog.json');
const NOTES_DIR = path.join(APP, 'public/notes');
const CACHE_DIR = path.join(APP, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'outputs.json');

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const programText = readJson(path.join(APP, 'content/programs.json'), {});
const topicText = readJson(path.join(APP, 'content/topics.json'), {});
const cache = readJson(CACHE_FILE, {});

const titleCase = (s) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- compiler detection ----------
function findCompiler() {
  if (process.env.SKIP_COMPILE === '1') return null;
  for (const cxx of [process.env.CXX, 'g++', 'clang++'].filter(Boolean)) {
    const r = spawnSync(cxx, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return { cmd: cxx, name: r.stdout.split('\n')[0].trim() };
  }
  return null;
}
const compiler = findCompiler();

function runReal(source, input) {
  if (!compiler) return null;
  const key = createHash('sha256')
    .update(compiler.name + '\0' + source + '\0' + (input ?? ''))
    .digest('hex');
  if (cache[key]) return cache[key];

  const dir = path.join(CACHE_DIR, 'build');
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, `${key.slice(0, 16)}.cpp`);
  const bin = path.join(dir, `${key.slice(0, 16)}.bin`);
  fs.writeFileSync(src, source);
  const c = spawnSync(compiler.cmd, ['-std=c++17', '-O0', '-w', src, '-o', bin], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  let result;
  if (c.status !== 0) {
    result = { ok: false, output: '', error: (c.stderr || 'compile failed').slice(0, 2000) };
  } else {
    const r = spawnSync(bin, [], { input: input ?? '', encoding: 'utf8', timeout: 5_000 });
    result = r.error
      ? { ok: false, output: r.stdout ?? '', error: String(r.error.message) }
      : { ok: true, output: r.stdout ?? '' };
  }
  fs.rmSync(src, { force: true });
  fs.rmSync(bin, { force: true });
  cache[key] = result;
  return result;
}

// ---------- scan ----------
const FILE_RE = /^L(\d+)_(Class|HW)_(\d+)_(.+)\.cpp$/i;
const topicDirs = fs
  .readdirSync(REPO, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}_/.test(d.name))
  .map((d) => d.name)
  .sort();

fs.mkdirSync(NOTES_DIR, { recursive: true });

let programCount = 0;
let verified = 0;
const topics = [];
for (const dir of topicDirs) {
  const codesDir = path.join(REPO, dir, 'Codes');
  if (!fs.existsSync(codesDir)) continue;
  const [, order, rawTitle] = dir.match(/^(\d{2})_(.+)$/);
  const meta = topicText[dir] ?? {};

  // Copy the topic notes PDF (if any) so the site can link to it.
  let notes = null;
  const pdf = fs.readdirSync(path.join(REPO, dir)).find((f) => f.toLowerCase().endsWith('.pdf'));
  if (pdf) {
    fs.copyFileSync(path.join(REPO, dir, pdf), path.join(NOTES_DIR, `${dir}.pdf`));
    notes = `notes/${dir}.pdf`;
  }

  const programs = fs
    .readdirSync(codesDir)
    .filter((f) => f.endsWith('.cpp'))
    .map((file) => {
      const m = file.match(FILE_RE);
      const base = file.replace(/\.cpp$/, '');
      const id = `${dir}/${base}`;
      const text = programText[id] ?? {};
      const source = fs.readFileSync(path.join(codesDir, file), 'utf8').replace(/\r\n/g, '\n');
      const usesInput = /\bcin\b|\bgetline\s*\(/.test(source);
      const input = usesInput ? (text.input ?? '') : undefined;
      const real = runReal(source, input);
      if (real?.ok) verified++;
      programCount++;
      return {
        id,
        slug: base,
        file: `${dir}/Codes/${file}`,
        lesson: m ? Number(m[1]) : 0,
        kind: m ? (m[2].toLowerCase() === 'hw' ? 'Homework' : 'Classwork') : 'Extra',
        index: m ? Number(m[3]) : 0,
        title: text.title ?? titleCase(m ? m[4] : base),
        summary: text.summary ?? null,
        analogy: text.analogy ?? null,
        watchFor: text.watchFor ?? null,
        usesInput,
        input: input ?? null,
        source,
        expectedOutput: real?.ok ? real.output : null,
      };
    })
    .sort((a, b) => a.lesson - b.lesson || (a.kind > b.kind ? 1 : a.kind < b.kind ? -1 : 0) || a.index - b.index);

  topics.push({
    id: dir,
    order: Number(order),
    title: meta.title ?? titleCase(rawTitle),
    tagline: meta.tagline ?? null,
    blurb: meta.blurb ?? null,
    notes,
    programs,
  });
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  JSON.stringify({ compiler: compiler?.name ?? null, topics }, null, 0),
);
fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

console.log(
  `catalog: ${topics.length} topics, ${programCount} programs` +
    (compiler ? `, ${verified} run with ${compiler.name}` : ', no C++ compiler found (skipped real runs)'),
);
