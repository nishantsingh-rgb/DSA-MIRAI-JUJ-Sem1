import data from '../generated/catalog.json';

export interface ProgramEntry {
  id: string;
  slug: string;
  file: string;
  lesson: number;
  kind: 'Classwork' | 'Homework' | 'Extra';
  index: number;
  title: string;
  summary: string | null;
  analogy: string | null;
  watchFor: string | null;
  usesInput: boolean;
  input: string | null;
  source: string;
  expectedOutput: string | null;
}

export interface TopicEntry {
  id: string;
  order: number;
  title: string;
  tagline: string | null;
  blurb: string | null;
  notes: string | null;
  programs: ProgramEntry[];
}

export const catalog = data as unknown as { compiler: string | null; topics: TopicEntry[] };
export const topics = catalog.topics;
export const allPrograms: ProgramEntry[] = topics.flatMap((t) => t.programs);

export const findProgram = (id: string) => allPrograms.find((p) => p.id === id) ?? null;
export const topicOf = (p: ProgramEntry) => topics.find((t) => p.id.startsWith(t.id + '/'))!;

export function neighbours(p: ProgramEntry) {
  const i = allPrograms.indexOf(p);
  return { prev: allPrograms[i - 1] ?? null, next: allPrograms[i + 1] ?? null };
}

/** Lessons of a topic, in order: [{ lesson: 1, programs: [...] }, ...] */
export function lessonsOf(t: TopicEntry) {
  const map = new Map<number, ProgramEntry[]>();
  for (const p of t.programs) map.set(p.lesson, [...(map.get(p.lesson) ?? []), p]);
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([lesson, programs]) => ({ lesson, programs }));
}

/** A stable accent hue per topic so each "line" on the home page has its own colour. */
const HUES = [45, 160, 265, 200, 330, 25, 120, 290, 180, 10];
export const topicHue = (t: TopicEntry) => HUES[(t.order - 1 + HUES.length) % HUES.length];

export const programHref = (p: ProgramEntry) => `#/p/${p.id}`;
