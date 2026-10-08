import { Fragment, type ReactNode } from 'react';

/** Renders narration markup: `code` and **bold**. Nothing else is interpreted (safe by construction). */
export function Markup({ text }: { text: string }): ReactNode {
  const parts = text.split(/(`[^`]*`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('`') && p.endsWith('`') && p.length >= 2) return <code key={i} className="md-code">{p.slice(1, -1)}</code>;
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="md-strong">{p.slice(2, -2)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** Plain text version (for aria-live / titles). */
export const plain = (text: string) => text.replace(/\*\*|`/g, '');
