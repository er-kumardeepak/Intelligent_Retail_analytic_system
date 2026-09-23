import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_SOLID } from '@/lib/tone';
import type { Tone } from '@/lib/types';
import { BrutalCard } from './BrutalCard';

export interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: Tone;
  className?: string;
  bodyClassName?: string;
}

export function ChartCard({
  title,
  subtitle,
  right,
  children,
  footer,
  tone,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <BrutalCard
      className={className}
      tone={tone}
      padding="none"
      title={title}
      subtitle={subtitle}
      right={right}
      footer={footer}
    >
      <div className={cn('px-3 pb-3 pt-4', bodyClassName)}>{children}</div>
    </BrutalCard>
  );
}

export interface LegendItem {
  label: string;
  tone: Tone;
  value?: string;
}

/** Rectangular swatches — never circles. */
export function ChartLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            className={cn('h-3 w-5 shrink-0 border-3 border-ink', TONE_SOLID[item.tone])}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
            {item.label}
          </span>
          {item.value && (
            <span className="font-mono text-[10px] font-bold tnum">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Shared Recharts tooltip styled as a small brutalist panel. */
export function BrutalTooltip({
  active,
  payload,
  label,
  unit = '',
  palette,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string | number }[];
  label?: string | number;
  unit?: string;
  palette: { ink: string; surface: string };
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        border: `3px solid ${palette.ink}`,
        background: palette.surface,
        boxShadow: `4px 4px 0 0 ${palette.ink}`,
        padding: '8px 10px',
        borderRadius: 4,
      }}
    >
      <p
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: palette.ink,
          opacity: 0.6,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={`${entry.dataKey ?? i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 11,
            fontWeight: 600,
            color: palette.ink,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              border: `2px solid ${palette.ink}`,
              background: entry.color ?? palette.ink,
              display: 'inline-block',
            }}
          />
          <span style={{ textTransform: 'uppercase' }}>{entry.name ?? entry.dataKey}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}
