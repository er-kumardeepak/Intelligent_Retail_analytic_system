import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BG } from '@/lib/tone';
import type { Tone } from '@/lib/types';

export interface SectionHeadingProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  tone?: Tone;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  /** Renders the title as hollow outlined type. Used sparingly. */
  outline?: boolean;
}

const SIZE = {
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-5xl',
  xl: 'text-4xl md:text-6xl lg:text-7xl',
} as const;

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  right,
  tone = 'ink',
  size = 'lg',
  className,
  outline = false,
}: SectionHeadingProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 max-w-3xl">
        {(eyebrow || index) && (
          <div className="mb-2.5 flex items-center gap-2.5">
            <span
              className={cn('h-3.5 w-3.5 shrink-0 border-3 border-ink', TONE_BG[tone].split(' ')[0])}
              aria-hidden="true"
            />
            {eyebrow && (
              <span className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
                {eyebrow}
              </span>
            )}
            {index && (
              <span className="border-3 border-ink bg-ink px-1.5 py-[1px] font-mono text-[10px] font-bold tracking-wider text-paper">
                {index}
              </span>
            )}
          </div>
        )}

        <h2
          className={cn(
            'font-bold uppercase tracking-tightest',
            SIZE[size],
            outline ? 'text-stroke-ink' : 'text-ink',
          )}
        >
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-[15px]">
            {description}
          </p>
        )}
      </div>

      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </header>
  );
}

/** Thin section divider with a hard dot, keeps long pages legible. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn('h-[3px] w-full bg-ink/15', className)} />;
}
