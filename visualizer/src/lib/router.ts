import { useEffect, useState } from 'react';

export type Route = { name: 'home' } | { name: 'program'; id: string } | { name: 'notfound' };

export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (h === '' || h === '/') return { name: 'home' };
  const m = h.match(/^\/p\/(.+)$/);
  if (m) return { name: 'program', id: m[1].replace(/\/$/, '') };
  return { name: 'notfound' };
}

/** Tiny hash router — works on any static host (GitHub Pages, Netlify, …) with zero config. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (href: string) => {
  window.location.hash = href.replace(/^#/, '');
};
