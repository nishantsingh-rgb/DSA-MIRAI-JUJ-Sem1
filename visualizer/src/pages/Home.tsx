import { MiniDemo } from '../components/MiniDemo';
import { IconArrowRight, IconShield } from '../components/Icons';
import { TopicList } from '../components/TopicList';
import { allPrograms, catalog, programHref, topics } from '../lib/catalog';

const demo = allPrograms.find((p) => /star_pyramid/i.test(p.slug)) ?? allPrograms.find((p) => /pattern/i.test(p.id)) ?? allPrograms[0];

const HOW = [
  { n: '1', t: 'Pick a program', d: 'Every classwork and homework program from the course, sorted by topic.' },
  { n: '2', t: 'Press play', d: 'The code runs one line at a time. A plain-English sentence says what each line does.' },
  { n: '3', t: 'Watch the boxes', d: 'Variables are labelled boxes. When a value changes, the box flashes and shows the old value.' },
  { n: '4', t: 'Change the numbers', d: 'Turn n from 5 to 8, type a different input, or edit the code, and watch the whole run change.' },
];

export function Home() {
  const first = allPrograms[0];
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">C++ · step by step · no setup</span>
          <h1 className="hero__title">
            Watch your code <em>think</em>.
          </h1>
          <p className="hero__sub">
            DryRun plays every program from the course like a slow-motion replay. You see which line runs, what each variable holds, why each decision goes the way it does, and how every character reaches the screen.
          </p>
          <div className="hero__ctas">
            {first && (
              <a className="btn btn--lg" href={programHref(first)}>
                Start from lesson one <IconArrowRight size={18} />
              </a>
            )}
            {demo && demo !== first && (
              <a className="btn btn--lg btn--ghost" href={programHref(demo)}>
                Watch a pyramid build
              </a>
            )}
          </div>
          <dl className="hero__stats">
            <div>
              <dt>Topics</dt>
              <dd>{topics.length}</dd>
            </div>
            <div>
              <dt>Programs</dt>
              <dd>{allPrograms.length}</dd>
            </div>
            {catalog.compiler && (
              <div className="hero__verified">
                <dt>
                  <IconShield size={14} /> Checked
                </dt>
                <dd>against a real C++ compiler</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="hero__demo">{demo && <MiniDemo program={demo} />}</div>
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title" className="section-title">
          How it works
        </h2>
        <ol className="how__grid">
          {HOW.map((h) => (
            <li key={h.n} className="how__card">
              <span className="how__n">{h.n}</span>
              <h3>{h.t}</h3>
              <p>{h.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="course" aria-labelledby="course-title" id="course">
        <div className="course__head">
          <h2 id="course-title" className="section-title">
            The course
          </h2>
          <p className="course__sub">Tap a topic to open it, then pick any program to watch it run.</p>
        </div>
        <TopicList />
      </section>
    </main>
  );
}
