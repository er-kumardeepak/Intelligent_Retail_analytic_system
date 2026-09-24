import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/brutal';
import type { Tone } from '@/lib/types';
import { DATE_FILTERS, useAppState } from '@/lib/app-state';

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

/** TODAY / 7 DAYS / 30 DAYS — maps onto the backend's `window` query param. */
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
      {DATE_FILTERS.map((filter) => {
        const active = filter === dateFilter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => setDateFilter(filter)}
            aria-pressed={active}
            className={cn(
              'rounded-[3px] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega transition-colors',
              active ? 'bg-ink text-paper' : 'text-muted hover:bg-ink/10 hover:text-ink',
            )}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Progressive disclosure. Secondary detail lives behind this so the default
 * view stays readable; it uses native <details> so it works without JS and
 * keeps full keyboard/screen-reader semantics.
 */
export function Disclosure({
  summary,
  hint,
  children,
  className,
}: {
  summary: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    // Left uncontrolled on purpose: the dashboard re-renders on every poll,
    // and a controlled `open` prop would snap the panel shut each time.
    <details
      className={cn('group rounded-brutal border-3 border-ink bg-surface shadow-brutal-xs', className)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden">
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-90"
          strokeWidth={3}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 font-mono text-[10px] font-bold uppercase tracking-mega">
          {summary}
        </span>
        {hint && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
            {hint}
          </span>
        )}
      </summary>
      <div className="border-t-3 border-ink px-4 py-4">{children}</div>
    </details>
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
  const GAP = { sm: 'gap-3', md: 'gap-5', lg: 'gap-7' } as const;
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
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  } as const;
  return <div className={cn('grid gap-5', COLS[cols], className)}>{children}</div>;
}

/** Compact section header used between blocks inside a page. */
export function BlockHeading({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold uppercase tracking-tightest md:text-2xl">{children}</h2>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
