import { BellRing, Camera, Check, ShieldAlert } from 'lucide-react';
import { cn, clock, relativeTime } from '@/lib/utils';
import { LEVEL_LABEL, LEVEL_TONE, TONE_BG, TONE_TEXT } from '@/lib/tone';
import type { AlertItem } from '@/lib/types';
import { BrutalButton } from './BrutalButton';
import { MicroLabel, StatusBadge } from './StatusBadge';

export interface AlertCardProps {
  alert: AlertItem;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  compact = false,
  className,
}: AlertCardProps) {
  const tone = LEVEL_TONE[alert.level];
  const critical = alert.level === 'critical';
  const resolved = alert.level === 'resolved';

  return (
    <article
      className={cn(
        'relative flex overflow-hidden rounded-brutal border-3 border-ink bg-surface shadow-brutal-sm',
        alert.isNew && 'animate-pop',
        critical && 'shadow-brutal',
        className,
      )}
    >
      {/* Hazard-tape edge: black diagonal stripes on the accent colour */}
      <div
        className={cn(
          'w-3 shrink-0 border-r-3 border-ink',
          critical ? 'diag-stripes bg-yellow' : TONE_BG[tone],
        )}
        aria-hidden="true"
      />

      <div className={cn('min-w-0 flex-1', compact ? 'p-3' : 'p-4')}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={tone} size="sm" dot={critical} pulse={critical}>
            {LEVEL_LABEL[alert.level]}
          </StatusBadge>

          {alert.isNew && (
            <span className="inline-flex -rotate-2 items-center rounded-brutal border-3 border-ink bg-ink px-2 py-[3px] text-[9px] font-bold uppercase tracking-mega text-paper">
              NEW
            </span>
          )}

          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            <span className="tnum">{clock(alert.at)}</span>
            <span className="text-ink/30">/</span>
            <span>{relativeTime(alert.at)}</span>
          </span>
        </div>

        <h3
          className={cn(
            'mt-2 font-bold uppercase leading-none tracking-tightest',
            compact ? 'text-base' : 'text-lg md:text-xl',
            resolved && 'text-muted line-through decoration-3',
          )}
        >
          {alert.title}
        </h3>

        <p className={cn('mt-1.5 flex items-center gap-1.5', TONE_TEXT[tone])}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
            {alert.location}
          </span>
        </p>

        {!compact && (
          <p className="mt-2 max-w-2xl text-[13px] leading-snug text-muted">{alert.detail}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-3 border-dashed border-ink/20 pt-2.5">
          <MicroLabel className="flex items-center gap-1.5 text-muted">
            <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />
            {alert.camera}
          </MicroLabel>

          <span className="flex items-center gap-2">
            <MicroLabel className="text-muted">CONF</MicroLabel>
            <span className="flex h-2.5 w-14 border-2 border-ink">
              <span
                className={cn('h-full', TONE_BG[tone].split(' ')[0])}
                style={{ width: `${Math.round(alert.confidence * 100)}%` }}
              />
            </span>
            <span className="font-mono text-[10px] font-bold tnum">
              {Math.round(alert.confidence * 100)}%
            </span>
          </span>

          {!compact && (onAcknowledge || onResolve) && (
            <span className="ml-auto flex items-center gap-2">
              {onAcknowledge && (
                <BrutalButton
                  size="sm"
                  variant={alert.acknowledged ? 'secondary' : 'primary'}
                  icon={<Check strokeWidth={3} />}
                  disabled={alert.acknowledged}
                  onClick={() => onAcknowledge(alert.id)}
                >
                  {alert.acknowledged ? 'ACKED' : 'ACKNOWLEDGE'}
                </BrutalButton>
              )}
              {onResolve && (
                <BrutalButton
                  size="sm"
                  variant="success"
                  icon={<ShieldAlert strokeWidth={3} />}
                  disabled={alert.level === 'resolved'}
                  onClick={() => onResolve(alert.id)}
                >
                  RESOLVE
                </BrutalButton>
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** One-line alert used in tight side panels. */
export function AlertLine({
  alert,
  onClick,
  className,
}: {
  alert: AlertItem;
  onClick?: () => void;
  className?: string;
}) {
  const tone = LEVEL_TONE[alert.level];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 border-b-3 border-ink/15 px-1 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink/5',
        className,
      )}
    >
      <span
        className={cn('h-4 w-4 shrink-0 border-3 border-ink', TONE_BG[tone].split(' ')[0])}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
          {alert.title}
        </span>
        <span className="block truncate font-mono text-[10px] text-muted">{alert.location}</span>
      </span>
      <span className="shrink-0 font-mono text-[10px] text-muted tnum">
        {relativeTime(alert.at)}
      </span>
      {alert.level === 'critical' && !alert.acknowledged && (
        <BellRing className="h-3.5 w-3.5 shrink-0 animate-blink text-coral" strokeWidth={3} />
      )}
    </button>
  );
}
