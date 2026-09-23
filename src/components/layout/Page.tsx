import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/brutal';
import type { Tone } from '@/lib/types';
import { useAppState } from '@/lib/app-state';
import { DATE_FILTERS } from '@/lib/mock-data';

export interface PageProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: Tone;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}

export function Page({
  index,
  eyebrow,
  title,
  description,
  actions,
  tone,
  size = 'lg',
  children,
  className,
}: PageProps) {
  return (
    <div className={cn('flex animate-rise flex-col gap-7', className)}>
      <SectionHeading
        index={index}
        eyebrow={eyebrow}
        title={title}
        description={description}
        right={actions}
        tone={tone}
        size={size}
      />
      {children}
    </div>
  );
}

/** TODAY / 7 DAYS / 30 DAYS / CUSTOM — shared across analytics views. */
export function DateFilterBar({ className }: { className?: string }) {
  const { dateFilter, setDateFilter } = useAppState();
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center rounded-brutal border-3 border-ink bg-surface p-1',
        className,
      )}
      role="group"
      aria-label="Date range"
    >
      {DATE_FILTERS.map((f) => {
        const active = f === dateFilter;
        return (
          <button
            key={f}
            type="button"
            onClick={() => setDateFilter(f)}
            aria-pressed={active}
            className={cn(
              'rounded-[3px] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega transition-colors',
              active ? 'bg-ink text-paper' : 'text-muted hover:bg-ink/10 hover:text-ink',
            )}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

/** Uniform vertical rhythm for stacked card sections. */
export function Stack({
  children,
  className,
  gap = 'md',
}: {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}) {
  const GAP = { sm: 'gap-3', md: 'gap-5', lg: 'gap-8' } as const;
  return <div className={cn('flex flex-col', GAP[gap], className)}>{children}</div>;
}

/** Responsive card grid used everywhere so column counts stay consistent. */
export function Grid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const COLS = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  } as const;
  return <div className={cn('grid gap-5', COLS[cols], className)}>{children}</div>;
}
