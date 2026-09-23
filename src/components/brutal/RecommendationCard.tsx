import { useState } from 'react';
import { ArrowRight, Check, Clock, User, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_TONE, TONE_TEXT } from '@/lib/tone';
import type { Recommendation } from '@/lib/types';
import { BrutalButton } from './BrutalButton';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?: (id: string) => void;
  className?: string;
}

export function RecommendationCard({ recommendation, onApply, className }: RecommendationCardProps) {
  const [state, setState] = useState<'open' | 'applied' | 'dismissed'>('open');
  const tone = PRIORITY_TONE[recommendation.priority];

  if (state === 'dismissed') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-brutal border-3 border-dashed border-ink/40 bg-surface px-4 py-3',
          className,
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-mega text-muted line-through">
          {recommendation.title}
        </span>
        <BrutalButton size="sm" variant="secondary" onClick={() => setState('open')}>
          UNDO
        </BrutalButton>
      </div>
    );
  }

  return (
    <BrutalCard
      className={cn(className, state === 'applied' && 'shadow-none')}
      tone={tone}
      padding="none"
      interactive={state === 'open'}
    >
      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={tone} size="sm" dot pulse={recommendation.priority === 'critical'}>
            {recommendation.priority.toUpperCase()} PRIORITY
          </StatusBadge>
          <span className="inline-flex items-center gap-1.5 border-3 border-ink bg-surface px-2 py-[3px] font-mono text-[9px] font-bold uppercase tracking-mega">
            <Clock className="h-3 w-3" strokeWidth={3} />
            {recommendation.window}
          </span>
          {state === 'applied' && (
            <StatusBadge tone="lime" size="sm">
              ACTIONED
            </StatusBadge>
          )}
        </div>

        <h3 className="flex items-start gap-2 text-xl font-bold uppercase leading-none tracking-tightest md:text-2xl">
          <Zap className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} />
          {recommendation.title}
        </h3>

        <div className="border-l-4 border-ink/30 pl-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-mega text-muted">
            WHY THE SYSTEM THINKS SO
          </p>
          <p className="mt-1 text-[13px] leading-snug text-muted">{recommendation.reason}</p>
        </div>

        <div
          className={cn(
            'rounded-brutal border-3 border-dashed border-ink px-3 py-2.5',
            state === 'applied' ? 'bg-lime/25' : 'bg-ink/[0.04]',
          )}
        >
          <p className="font-mono text-[9px] font-semibold uppercase tracking-mega text-muted">
            SUGGESTED ACTION
          </p>
          <p className="mt-1 text-sm font-bold uppercase tracking-wide">{recommendation.action}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={cn('font-mono text-[10px] font-bold uppercase tracking-mega', TONE_TEXT[tone])}>
            {recommendation.impact}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-mega text-muted">
            <User className="h-3.5 w-3.5" strokeWidth={2.5} />
            {recommendation.owner}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 border-t-3 border-ink/15 pt-3">
          <BrutalButton
            variant={state === 'applied' ? 'success' : 'primary'}
            size="md"
            icon={state === 'applied' ? <Check strokeWidth={3} /> : <ArrowRight strokeWidth={3} />}
            onClick={() => {
              setState(state === 'applied' ? 'open' : 'applied');
              onApply?.(recommendation.id);
            }}
          >
            {state === 'applied' ? 'ACTIONED' : 'APPLY ACTION'}
          </BrutalButton>
          {state === 'open' && (
            <BrutalButton
              variant="secondary"
              size="md"
              icon={<X strokeWidth={3} />}
              onClick={() => setState('dismissed')}
            >
              DISMISS
            </BrutalButton>
          )}
        </div>
      </div>

      {state === 'applied' && (
        <div
          className={cn('absolute inset-x-0 bottom-0 h-1.5 border-t-3 border-ink bg-lime')}
          aria-hidden="true"
        />
      )}
    </BrutalCard>
  );
}
