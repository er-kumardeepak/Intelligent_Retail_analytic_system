import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { Metric, Tone } from '@/lib/types';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

/** Hard-edged bar sparkline. No smoothing — every value is a solid block. */
export function Sparkline({
  values,
  tone = 'ink',
  className,
  height = 34,
}: {
  values: number[];
  tone?: Tone;
  className?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return (
    <div
      className={cn('flex items-end gap-[2px]', className)}
      style={{ height }}
      aria-hidden="true"
    >
      {values.map((v, i) => {
        const pct = 12 + ((v - min) / span) * 88;
        return (
          <span
            key={i}
            className={cn('flex-1 border-2 border-ink', TONE_SOLID[tone])}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

function TrendChip({ metric }: { metric: Metric }) {
  const { trend } = metric;
  const Icon =
    trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : ArrowRight;
  const good = trend.good;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-brutal border-3 border-ink px-2 py-1 font-mono text-[10px] font-bold tnum',
        good ? 'bg-lime text-ink' : 'bg-coral text-ink',
      )}
      title={trend.label}
    >
      <Icon className="h-3 w-3" strokeWidth={3} />
      {trend.value > 0 ? '+' : ''}
      {trend.value}%
    </span>
  );
}

export interface MetricCardProps {
  metric: Metric;
  spark?: number[];
  index?: string;
  className?: string;
  /** Fills the card with the accent colour for the primary KPI row. */
  emphasis?: boolean;
}

export function MetricCard({ metric, spark, index, className, emphasis }: MetricCardProps) {
  const decimals = metric.precision ?? 0;
  const display = metric.value.toFixed(decimals);

  return (
    <BrutalCard
      className={cn('group relative overflow-hidden', className)}
      tone={metric.tone}
      interactive
      padding="none"
    >
      {/* Faint oversized index — editorial watermark */}
      {index && (
        <span className="pointer-events-none absolute -right-1 top-1 select-none font-bold leading-none text-ink/[0.07] text-8xl">
          {index}
        </span>
      )}

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase leading-tight tracking-mega text-muted">
            {metric.label}
          </span>
          <TrendChip metric={metric} />
        </div>

        <div className="flex items-end gap-1.5">
          <span className="text-5xl font-bold leading-none tracking-tightest tnum md:text-6xl">
            {display}
          </span>
          {metric.unit && (
            <span className={cn('pb-1 text-lg font-bold leading-none', TONE_TEXT[metric.tone])}>
              {metric.unit}
            </span>
          )}
        </div>

        {spark && <Sparkline values={spark} tone={metric.tone} height={30} />}

        <p className="border-t-3 border-dashed border-ink/25 pt-2 font-mono text-[10px] leading-relaxed text-muted">
          {metric.footnote}
        </p>
      </div>

      {emphasis && (
        <div
          className={cn('absolute inset-y-0 left-0 w-1.5 border-r-3 border-ink', TONE_SOLID[metric.tone])}
        />
      )}
    </BrutalCard>
  );
}

/** Wide, dense metric row used inside panels where a full card would be noise. */
export function MetricRow({ metric, className }: { metric: Metric; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b-3 border-ink/15 py-2.5 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-[10px] uppercase tracking-mega text-muted">
          {metric.label}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted">{metric.footnote}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-2xl font-bold leading-none tracking-tightest tnum">
          {metric.value.toFixed(metric.precision ?? 0)}
          <span className="ml-0.5 text-sm">{metric.unit}</span>
        </span>
        <StatusBadge tone={metric.trend.good ? 'lime' : 'coral'} size="sm">
          {metric.trend.value > 0 ? '+' : ''}
          {metric.trend.value}%
        </StatusBadge>
      </div>
    </div>
  );
}
