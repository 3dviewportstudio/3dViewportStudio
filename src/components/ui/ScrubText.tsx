import { Fragment, type ElementType } from 'react';

type Props = { text: string; as?: ElementType; className?: string; id?: string };

/** Texto que se "enciende" palabra a palabra al hacer scroll (animado en MotionProvider). */
export function ScrubText({ text, as: Tag = 'p', className = '', id }: Props) {
  const words = text.split(' ');
  return (
    <Tag id={id} className={className} data-scrub-words>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="scrub-word">{word}</span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
