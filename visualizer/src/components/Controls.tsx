import { memo } from 'react';
import type { Player } from '../lib/usePlayer';
import { SPEEDS } from '../lib/usePlayer';
import { IconFirst, IconLast, IconNext, IconPause, IconPlay, IconPrev, IconSkip } from './Icons';

/** Transport bar: restart · back · play · forward · skip loop · end, speed and a scrubber. */
export const Controls = memo(function Controls({ p, inLoop }: { p: Player; inLoop: boolean }) {
  const pct = p.total > 1 ? (p.index / (p.total - 1)) * 100 : 0;
  return (
    <div className="controls" role="toolbar" aria-label="Playback controls">
      <div className="controls__buttons">
        <button className="cbtn" onClick={() => p.go(0)} disabled={p.index === 0} aria-label="Restart (Home)" title="Restart (Home)">
          <IconFirst />
        </button>
        <button className="cbtn" onClick={() => p.go(p.index - 1)} disabled={p.index === 0} aria-label="Step back (←)" title="Step back (←)">
          <IconPrev />
        </button>
        <button className="cbtn cbtn--play" onClick={p.toggle} aria-label={p.playing ? 'Pause (Space)' : 'Play (Space)'} title={p.playing ? 'Pause (Space)' : 'Play (Space)'}>
          {p.playing ? <IconPause size={22} /> : <IconPlay size={22} />}
        </button>
        <button className="cbtn" onClick={() => p.go(p.index + 1)} disabled={p.index >= p.total - 1} aria-label="Step forward (→)" title="Step forward (→)">
          <IconNext />
        </button>
        <button className="cbtn cbtn--text" onClick={p.skipLoop} disabled={!inLoop} title="Finish the current loop (L)" aria-label="Finish the current loop (L)">
          <IconSkip /> <span className="hide-sm">Finish loop</span>
        </button>
        <button className="cbtn" onClick={() => p.go(p.total - 1)} disabled={p.index >= p.total - 1} aria-label="Jump to end (End)" title="Jump to end (End)">
          <IconLast />
        </button>
        <button
          className="cbtn cbtn--speed"
          onClick={() => p.setSpeed(SPEEDS[(SPEEDS.indexOf(p.speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length])}
          aria-label={`Speed ${p.speed}×, tap to change`}
        >
          {p.speed}×
        </button>
      </div>

      <div className="controls__scrub">
        <span className="controls__count" aria-live="off">
          <b>{p.index + 1}</b>
          <span>/{p.total}</span>
        </span>
        <input
          type="range"
          className="scrub"
          min={0}
          max={Math.max(0, p.total - 1)}
          value={p.index}
          onChange={(e) => {
            p.setPlaying(false);
            p.go(Number(e.target.value));
          }}
          aria-label="Timeline"
          style={{ ['--pct' as string]: `${pct}%` }}
        />
      </div>

      <div className="controls__speed" role="radiogroup" aria-label="Speed">
        {SPEEDS.map((s) => (
          <button key={s} role="radio" aria-checked={p.speed === s} className={`speed${p.speed === s ? ' is-on' : ''}`} onClick={() => p.setSpeed(s)}>
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
});
