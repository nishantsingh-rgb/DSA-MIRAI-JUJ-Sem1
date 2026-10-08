import { useEffect } from 'react';
import { useTheme } from '../lib/storage';
import { IconMoon, IconSearch, IconSun, Logo } from './Icons';

export function Header({ onSearch }: { onSearch: () => void }) {
  const [theme, toggle] = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        onSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearch]);

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a href="#/" className="brand" aria-label="DryRun home">
          <Logo />
          <span className="brand__name">
            Dry<span>Run</span>
          </span>
        </a>
        <nav className="topbar__actions">
          <button className="searchbtn" onClick={onSearch} aria-label="Search programs">
            <IconSearch size={16} />
            <span className="hide-sm">Search programs</span>
            <kbd className="hide-sm">/</kbd>
          </button>
          <button className="iconbtn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>
          <b>DryRun</b> — every program from the course, explained one step at a time.
        </span>
        <span className="footer__muted">Runs entirely in your browser. No sign-up, no tracking.</span>
      </div>
    </footer>
  );
}
