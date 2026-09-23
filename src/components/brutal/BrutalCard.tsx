import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BORDER, TONE_SOLID } from '@/lib/tone';
import type { Tone } from '@/lib/types';

const PADDING = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' } as const;
const SHADOW = {
  none: 'shadow-none',
  xs: 'shadow-brutal-xs',
  sm: 'shadow-brutal-sm',
  md: 'shadow-brutal',
  lg: 'shadow-brutal-lg',
} as const;

export interface BrutalCardProps {
  children?: ReactNode;
  className?: string;
  /** Adds a solid accent strip along the top edge. */
  tone?: Tone;
  padding?: keyof typeof PADDING;
  shadow?: keyof typeof SHADOW;
  /** Card lifts toward the light on hover. Use for clickable cards only. */
  interactive?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function BrutalCard({
  children,
  className,
  tone,
  padding = 'md',
  shadow = 'md',
  interactive = false,
  title,
  subtitle,
  right,
  footer,
  as: Tag = 'div',
}: BrutalCardProps) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden rounded-brutal border-3 border-ink bg-surface',
        SHADOW[shadow],
        interactive && 'lift cursor-pointer',
        className,
      )}
    >
      {tone && <div className={cn('h-2.5 w-full border-b-3 border-ink', TONE_SOLID[tone])} />}

      {(title || right) && (
        <div className="flex items-start justify-between gap-3 border-b-3 border-ink px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-[11px] font-bold uppercase tracking-mega">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}

      <div className={PADDING[padding]}>{children}</div>

      {footer && <div className="border-t-3 border-ink px-4 py-3">{footer}</div>}
    </Tag>
  );
}

/** Panel heading with a rule under it — used inside cards that need a mini header. */
export function PanelLabel({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-2', className)}>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
        {children}
      </span>
      {right}
    </div>
  );
}

/** Left-ruled note block for secondary explanation text. */
export function Callout({
  tone = 'ink',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-l-4 py-0.5 pl-3 font-mono text-[11px] leading-relaxed text-muted',
        TONE_BORDER[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
