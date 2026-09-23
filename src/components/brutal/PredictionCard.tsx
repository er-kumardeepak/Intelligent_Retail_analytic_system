import { Activity, Brain, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RISK_TONE, TONE_BG, TONE_SOLID } from '@/lib/tone';
import type { Prediction } from '@/lib/types';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

export function AIBadge({ className, label = 'YOLO EDGE' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-brutal border-3 border-ink bg-purple px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-mega text-white',
        className,
      )}
    >
      <Brain className="h-3 w-3" strokeWidth={3} />
      {label}
    </span>
  );
}

export interface PredictionCardProps {
  prediction: Prediction;
  className?: string;
}

export function PredictionCard({ prediction, className }: PredictionCardProps) {
  const tone = RISK_TONE[prediction.level];
  const confidence = Math.round(prediction.confidence * 100);

  return (
    <BrutalCard
      className={cn('relative overflow-hidden', className)}
      tone={prediction.tone}
      interactive
      padding="none"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
            <Activity className="h-3.5 w-3.5" strokeWidth={3} />
            {prediction.kind}
          </span>
          <StatusBadge tone={tone} size="sm" dot pulse={prediction.level === 'high'}>
            {prediction.level.toUpperCase()} RISK
          </StatusBadge>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-bold uppercase leading-none tracking-tightest md:text-3xl">
            {prediction.subject}
          </h3>
          <span
            className={cn(
              'shrink-0 -rotate-2 rounded-brutal border-3 border-ink px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide shadow-brutal-xs',
              TONE_BG[prediction.tone],
            )}
          >
            {prediction.eta}
          </span>
        </div>

        <p className="text-[13px] leading-snug text-muted">{prediction.detail}</p>

        <div className="mt-auto border-t-3 border-dashed border-ink/20 pt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
              MODEL CONFIDENCE
            </span>
            <span className="font-mono text-[11px] font-bold tnum">{confidence}%</span>
          </div>
          <div className="flex h-3 w-full border-3 border-ink bg-surface" aria-hidden="true">
            <div
              className={cn('h-full transition-[width] duration-700', TONE_SOLID[prediction.tone])}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-muted">
            <TrendingUp className="h-3 w-3" strokeWidth={3} />
            <span className="font-mono text-[9px] uppercase tracking-mega">
              HORIZON 60 MIN · EDGE INFERENCE
            </span>
          </div>
        </div>
      </div>
    </BrutalCard>
  );
}
