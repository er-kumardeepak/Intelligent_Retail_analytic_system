import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BG, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { Tone } from '@/lib/types';

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: Tone;
  /** Square status pip — square, not round, to stay on-brand. */
  dot?: boolean;
  pulse?: boolean;
  outline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BADGE_SIZE = {
  sm: 'px-2 py-[3px] text-[9px] gap-1.5',
  md: 'px-2.5 py-1 text-[10px] gap-1.5',
  lg: 'px-3.5 py-1.5 text-[11px] gap-2',
} as const;

const PIP_SIZE = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-2 w-2' } as const;

export function StatusBadge({
  children,
  tone = 'ink',
  dot = false,
  pulse = false,
  outline = false,
  size = 'md',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-brutal border-3 border-ink font-bold uppercase tracking-mega',
        outline ? cn('bg-surface', TONE_TEXT[tone]) : TONE_BG[tone],
        BADGE_SIZE[size],
        className,
      )}
    >
      {dot && <Pip tone={tone} pulse={pulse} size={size} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function Pip({
  tone = 'lime',
  pulse = false,
  size = 'md',
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const fill = TONE_SOLID[tone];
  return (
    <span className={cn('relative inline-flex shrink-0', PIP_SIZE[size], className)}>
      <span className={cn('absolute inset-0', fill)} />
      {pulse && (
        <span className={cn('absolute inset-0 animate-ping_soft', fill)} aria-hidden="true" />
      )}
    </span>
  );
}

/** Rotated sticker — the handcrafted, deliberately-off-grid element. */
export function Sticker({
  children,
  tone = 'yellow',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex -rotate-2 items-center rounded-brutal border-3 border-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-mega shadow-brutal-xs',
        TONE_BG[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Micro uppercase label used above numbers and inside cards. */
export function MicroLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('font-mono text-[10px] font-semibold uppercase tracking-mega', className)}
    >
      {children}
    </span>
  );
}
