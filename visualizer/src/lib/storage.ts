import { useCallback, useEffect, useState } from 'react';

/** localStorage that never throws (private mode, blocked storage, …). */
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

const VISITED = 'dryrun:visited';
const listeners = new Set<() => void>();

export function markVisited(id: string) {
  const v = store.get<string[]>(VISITED, []);
  if (!v.includes(id)) {
    store.set(VISITED, [...v, id]);
    listeners.forEach((l) => l());
  }
}

export function useVisited(): Set<string> {
  const [v, setV] = useState(() => new Set(store.get<string[]>(VISITED, [])));
  useEffect(() => {
    const l = () => setV(new Set(store.get<string[]>(VISITED, [])));
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return v;
}

export type Theme = 'dark' | 'light';
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = store.get<Theme | null>('dryrun:theme', null);
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0e14' : '#f7f5f0');
  }, [theme]);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const n = t === 'dark' ? 'light' : 'dark';
      store.set('dryrun:theme', n);
      return n;
    });
  }, []);
  return [theme, toggle];
}

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
