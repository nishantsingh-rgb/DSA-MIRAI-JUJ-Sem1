import { useState } from 'react';
import { lessonsOf, programHref, topicHue, topics, type TopicEntry } from '../lib/catalog';
import { useVisited } from '../lib/storage';
import { IconCheck, IconChevron, IconFile } from './Icons';

/** The course as a list of "lines": click a topic to unfold its programs. */
export function TopicList() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const visited = useVisited();
  const latest = topics[topics.length - 1]?.id;

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <ol className="topics">
      {topics.map((t) => (
        <TopicRow key={t.id} t={t} open={open.has(t.id)} onToggle={() => toggle(t.id)} visited={visited} isNew={t.id === latest} />
      ))}
    </ol>
  );
}

function TopicRow({ t, open, onToggle, visited, isNew }: { t: TopicEntry; open: boolean; onToggle: () => void; visited: Set<string>; isNew: boolean }) {
  const seen = t.programs.filter((p) => visited.has(p.id)).length;
  const cw = t.programs.filter((p) => p.kind === 'Classwork').length;
  const hw = t.programs.filter((p) => p.kind === 'Homework').length;
  const panelId = `topic-${t.id}`;
  return (
    <li className={`topic${open ? ' is-open' : ''}`} style={{ ['--hue' as string]: topicHue(t) }}>
      <button className="topic__line" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
        <span className="topic__num">{String(t.order).padStart(2, '0')}</span>
        <span className="topic__main">
          <span className="topic__title">
            {t.title}
            {isNew && <span className="pill pill--new">Latest</span>}
          </span>
          {t.tagline && <span className="topic__tagline">{t.tagline}</span>}
        </span>
        <span className="topic__meta">
          <span className="topic__count">{t.programs.length} programs</span>
          <span className="progress" aria-label={`${seen} of ${t.programs.length} opened`}>
            <span style={{ width: `${(seen / Math.max(1, t.programs.length)) * 100}%` }} />
          </span>
        </span>
        <span className="topic__chev">
          <IconChevron />
        </span>
      </button>

      <div className="topic__panel" id={panelId} role="region" aria-label={t.title}>
        <div className="topic__panel-inner">
          <div className="topic__intro">
            {t.blurb && <p>{t.blurb}</p>}
            <div className="topic__chips">
              <span className="pill">{cw} classwork</span>
              <span className="pill">{hw} homework</span>
              {t.notes && (
                <a className="pill pill--link" href={t.notes} target="_blank" rel="noopener">
                  <IconFile size={13} /> Notes (PDF)
                </a>
              )}
            </div>
          </div>
          {lessonsOf(t).map(({ lesson, programs }) => (
            <div className="lesson" key={lesson}>
              <div className="lesson__label">{lesson ? `Lesson ${lesson}` : 'More'}</div>
              <div className="lesson__programs">
                {programs.map((p) => (
                  <a key={p.id} href={programHref(p)} className={`progbtn${visited.has(p.id) ? ' is-seen' : ''}`} tabIndex={open ? 0 : -1}>
                    <span className={`progbtn__kind kind-${p.kind.toLowerCase()}`}>{p.kind === 'Homework' ? 'HW' : p.kind === 'Classwork' ? 'CW' : '+'}{p.index || ''}</span>
                    <span className="progbtn__title">{p.title}</span>
                    {visited.has(p.id) && <IconCheck size={15} className="progbtn__check" />}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}
