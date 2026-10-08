import { Component, useCallback, useState, type ReactNode } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { Footer, Header } from './components/Header';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import ProgramPage from './pages/ProgramPage';
import { useRoute } from './lib/router';

// The program page is bundled with the rest of the app on purpose: a separately
// loaded chunk can disappear after a redeploy while an old page is still cached,
// which breaks navigation ("Importing a module script failed").

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  static getDerivedStateFromProps(p: { resetKey: string }, s: { key: string; error: Error | null }) {
    return p.resetKey !== s.key ? { error: null, key: p.resetKey } : null;
  }
  render() {
    if (this.state.error)
      return (
        <main className="notfound">
          <p className="eyebrow">Oops</p>
          <h1>Something broke while drawing this page.</h1>
          <p className="muted">{this.state.error.message}</p>
          <a className="btn" href="#/">
            Back to the course
          </a>
        </main>
      );
    return this.props.children;
  }
}

export function App() {
  const route = useRoute();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const key = route.name === 'program' ? route.id : route.name;

  return (
    <>
      <a className="skip" href="#main-content" onClick={(e) => (e.preventDefault(), document.getElementById('main-content')?.focus())}>
        Skip to content
      </a>
      <Header onSearch={openPalette} />
      <div id="main-content" tabIndex={-1} className="page">
        <ErrorBoundary resetKey={key}>
          {route.name === 'home' && <Home />}
          {route.name === 'program' && <ProgramPage id={route.id} />}
          {route.name === 'notfound' && <NotFound />}
        </ErrorBoundary>
      </div>
      <Footer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
