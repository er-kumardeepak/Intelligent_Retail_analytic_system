import { cn } from '@/lib/utils';
import { TONE_SOLID } from '@/lib/tone';
import type { Tone } from '@/lib/types';
import { toneFromFill } from '@/lib/tone';

export interface SegmentBarProps {
  /** 0–100 */
  value: number;
  segments?: number;
  tone?: Tone;
  className?: string;
  height?: 'xs' | 'sm' | 'md' | 'lg';
  /** Blocks the bar out into hard steps rather than a smooth fill. */
  showValue?: boolean;
}

const HEIGHT = { xs: 'h-2.5', sm: 'h-4', md: 'h-6', lg: 'h-8' } as const;

export function SegmentBar({
  value,
  segments = 20,
  tone,
  className,
  height = 'md',
  showValue = false,
}: SegmentBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const filled = Math.round((pct / 100) * segments);
  const resolvedTone = tone ?? toneFromFill(pct);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex flex-1 gap-[2px]', HEIGHT[height])} role="img" aria-label={`${pct}%`}>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 border-2 border-ink',
              i < filled ? TONE_SOLID[resolvedTone] : 'bg-ink/10',
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="w-10 shrink-0 text-right font-mono text-[11px] font-bold tnum">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

/** Discrete 5-step heat block strip — the hard-edged heatmap primitive. */
export function HeatStrip({
  value,
  segments = 16,
  className,
}: {
  /** 0–100 */
  value: number;
  segments?: number;
  className?: string;
}) {
  const level = Math.min(4, Math.floor((value / 100) * 5));
  const STEPS: Tone[] = ['blue', 'lime', 'yellow', 'coral', 'coral'];
  const active = STEPS[level];
  const filled = Math.round((value / 100) * segments);

  return (
    <div className={cn('flex gap-[2px]', className)} role="img" aria-label={`heat ${Math.round(value)}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={cn('h-4 flex-1 border-2 border-ink', i < filled ? TONE_SOLID[active] : 'bg-ink/10')}
        />
      ))}
    </div>
  );
}
