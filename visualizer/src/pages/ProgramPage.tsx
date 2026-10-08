import { useEffect } from 'react';
import { IconArrowLeft, IconArrowRight, IconFile } from '../components/Icons';
import { Player } from '../components/Player';
import { findProgram, neighbours, programHref, topicHue, topicOf } from '../lib/catalog';
import { markVisited } from '../lib/storage';
import { NotFound } from './NotFound';

export default function ProgramPage({ id }: { id: string }) {
  const program = findProgram(id);

  useEffect(() => {
    if (!program) return;
    markVisited(program.id);
    document.title = `${program.title} · DryRun`;
    return () => {
      document.title = 'DryRun — watch C++ code think, step by step';
    };
  }, [program]);

  if (!program) return <NotFound />;
  const topic = topicOf(program);
  const { prev, next } = neighbours(program);

  return (
    <main className="program" style={{ ['--hue' as string]: topicHue(topic) }}>
      <header className="program__head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#/">Course</a>
          <span aria-hidden="true">/</span>
          <a href="#/">{topic.title}</a>
          <span aria-hidden="true">/</span>
          <span>Lesson {program.lesson}</span>
        </nav>
        <div className="program__titlerow">
          <h1 className="program__title">{program.title}</h1>
          <div className="program__pills">
            <span className={`pill kind-${program.kind.toLowerCase()}`}>{program.kind}{program.index ? ` ${program.index}` : ''}</span>
            {program.usesInput && <span className="pill">reads input</span>}
            {topic.notes && (
              <a className="pill pill--link" href={topic.notes} target="_blank" rel="noopener">
                <IconFile size={13} /> Topic notes
              </a>
            )}
          </div>
        </div>
        {(program.summary || program.analogy || program.watchFor) && (
          <div className="story">
            {program.summary && (
              <div className="story__card">
                <span className="story__k">What it does</span>
                <p>{program.summary}</p>
              </div>
            )}
            {program.analogy && (
              <div className="story__card">
                <span className="story__k">Think of it like</span>
                <p>{program.analogy}</p>
              </div>
            )}
            {program.watchFor && (
              <div className="story__card story__card--accent">
                <span className="story__k">Watch for</span>
                <p>{program.watchFor}</p>
              </div>
            )}
          </div>
        )}
      </header>

      <Player key={program.id} program={program} />

      <nav className="pager" aria-label="More programs">
        {prev ? (
          <a className="pager__link" href={programHref(prev)}>
            <IconArrowLeft size={16} />
            <span>
              <small>Previous</small>
              {prev.title}
            </span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="pager__link pager__link--next" href={programHref(next)}>
            <span>
              <small>Next</small>
              {next.title}
            </span>
            <IconArrowRight size={16} />
          </a>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
