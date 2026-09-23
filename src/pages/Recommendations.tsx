import { useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, Database, Gauge, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_TONE, TONE_SOLID } from '@/lib/tone';
import { CAMERAS, PREDICTIONS, RECOMMENDATIONS } from '@/lib/mock-data';
import type { Priority } from '@/lib/types';
import {
  AIBadge,
  BrutalCard,
  BrutalLink,
  ChartCard,
  ChartLegend,
  RecommendationCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

const FILTERS: (Priority | 'all')[] = ['all', 'critical', 'high', 'medium', 'low'];

const IMPACT_SERIES = [
  { t: 'MON', accepted: 14, ignored: 6 },
  { t: 'TUE', accepted: 17, ignored: 4 },
  { t: 'WED', accepted: 21, ignored: 8 },
  { t: 'THU', accepted: 18, ignored: 5 },
  { t: 'FRI', accepted: 26, ignored: 9 },
  { t: 'SAT', accepted: 31, ignored: 12 },
  { t: 'SUN', accepted: 24, ignored: 7 },
];

export default function Recommendations() {
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const [applied, setApplied] = useState<string[]>([]);

  const list =
    filter === 'all' ? RECOMMENDATIONS : RECOMMENDATIONS.filter((r) => r.priority === filter);

  const counts = {
    critical: RECOMMENDATIONS.filter((r) => r.priority === 'critical').length,
    high: RECOMMENDATIONS.filter((r) => r.priority === 'high').length,
    medium: RECOMMENDATIONS.filter((r) => r.priority === 'medium').length,
    low: RECOMMENDATIONS.filter((r) => r.priority === 'low').length,
  };

  const acceptanceRate = Math.round(
    (IMPACT_SERIES.reduce((s, d) => s + d.accepted, 0) /
      IMPACT_SERIES.reduce((s, d) => s + d.accepted + d.ignored, 0)) *
      100,
  );

  return (
    <Page
      index="ACTIONS"
      eyebrow="OPERATIONAL DECISION QUEUE"
      title="WHAT SHOULD STAFF DO?"
      description="Every recommendation carries the reason the system reached it, the exact action to take, the owner, and the expected operational impact. Nothing here is a black box."
      tone="lime"
      actions={
        <>
          <AIBadge label="DECISION ENGINE" />
          <StatusBadge tone="lime" size="lg" dot pulse>
            {RECOMMENDATIONS.length} OPEN
          </StatusBadge>
        </>
      }
    >
      <Stack gap="lg">
        {/* Summary */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(['critical', 'high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilter(filter === p ? 'all' : p)}
              aria-pressed={filter === p}
              className={cn(
                'relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 text-left transition-transform hover:-translate-y-[2px]',
                filter === p ? 'shadow-brutal' : 'shadow-brutal-xs',
              )}
            >
              <span
                className={cn(
                  'absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink',
                  TONE_SOLID[PRIORITY_TONE[p]],
                )}
              />
              <p className="pt-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
                {p} PRIORITY
              </p>
              <p className="mt-2 text-4xl font-bold leading-none tracking-tightest tnum">
                {counts[p]}
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                {filter === p ? 'FILTER ACTIVE — TAP TO CLEAR' : 'TAP TO FILTER'}
              </p>
            </button>
          ))}
        </section>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
            FILTER
          </span>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'press-sm rounded-brutal border-3 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega',
                filter === f ? 'bg-ink text-paper' : 'bg-surface text-muted',
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-mega text-muted">
            SHOWING {list.length} OF {RECOMMENDATIONS.length}
          </span>
        </div>

        {/* Cards */}
        <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {list.map((r) => (
            <RecommendationCard
              key={r.id}
              recommendation={r}
              onApply={(id) => setApplied((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            />
          ))}
        </section>

        {applied.length > 0 && (
          <BrutalCard tone="lime" padding="md" shadow="md">
            <div className="flex flex-wrap items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={3} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-mega">
                {applied.length} ACTION{applied.length === 1 ? '' : 'S'} DISPATCHED TO STAFF
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted">
                LOGGED TO THE AI RECOMMENDATION REPORT
              </span>
            </div>
          </BrutalCard>
        )}

        {/* Impact + engine */}
        <Grid cols={2}>
          <ChartCard
            title="RECOMMENDATION OUTCOMES"
            subtitle="ACCEPTED VS IGNORED · LAST 7 DAYS"
            right={<StatusBadge tone="lime" size="sm">{acceptanceRate}% ACCEPTED</StatusBadge>}
            footer={
              <ChartLegend
                items={[
                  { label: 'ACTIONED BY STAFF', tone: 'lime' },
                  { label: 'IGNORED / EXPIRED', tone: 'coral' },
                ]}
              />
            }
          >
            <BrutalChart
              data={IMPACT_SERIES as unknown as Record<string, unknown>[]}
              height={280}
              series={[
                { key: 'accepted', name: 'actioned', tone: 'lime', type: 'bar', barSize: 22 },
                { key: 'ignored', name: 'ignored', tone: 'coral', type: 'bar', barSize: 22 },
              ]}
            />
          </ChartCard>

          <BrutalCard title="HOW AN ACTION IS CHOSEN" subtitle="DETERMINISTIC POLICY, NOT A CHATBOT">
            <ol className="flex flex-col gap-3">
              {[
                {
                  icon: Database,
                  title: 'EVENT STREAM',
                  body: 'Anonymous counts, dwell, shelf fill and queue depth, already computed on the edge.',
                },
                {
                  icon: Cpu,
                  title: 'PREDICTION LAYER',
                  body: `${PREDICTIONS.length} active forecasts with explicit confidence scores.`,
                },
                {
                  icon: Gauge,
                  title: 'POLICY RULES',
                  body: 'Store thresholds, SLA targets and staffing constraints from your configuration.',
                },
                {
                  icon: Users,
                  title: 'OWNERSHIP',
                  body: 'Each action is assigned to a role with a deadline window.',
                },
                {
                  icon: Sparkles,
                  title: 'MEASUREMENT',
                  body: 'Impact is verified after the fact and fed back into the recommendation report.',
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border-3 border-ink bg-ink text-paper">
                    <step.icon className="h-4 w-4" strokeWidth={2.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
                        {String(i + 1).padStart(2, '0')} · {step.title}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12px] leading-snug text-muted">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 border-t-3 border-dashed border-ink/25 pt-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-mega text-muted">
                POLICY SENSITIVITY
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  { label: 'QUEUE SLA PRESSURE WEIGHT', value: 82 },
                  { label: 'SHELF THRESHOLD WEIGHT', value: 76 },
                  { label: 'STAFF AVAILABILITY WEIGHT', value: 64 },
                  { label: 'FOOTFALL FORECAST WEIGHT', value: 58 },
                ].map((s) => (
                  <li key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[10px] uppercase tracking-wider">
                        {s.label}
                      </span>
                      <span className="font-mono text-[10px] tnum">{s.value}</span>
                    </div>
                    <SegmentBar value={s.value} segments={18} height="xs" tone="blue" />
                  </li>
                ))}
              </ul>
            </div>
          </BrutalCard>
        </Grid>

        <SectionHeading
          index="LINK"
          eyebrow="TRACEABILITY"
          title="WHICH PREDICTION RAISED WHICH ACTION"
          description="Every recommendation points back to the forecast and the camera that produced it, so a manager can audit the chain."
          size="md"
          tone="purple"
        />

        <BrutalCard padding="none" shadow="md">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b-3 border-ink bg-ink/[0.04]">
                  {['ACTION', 'PRIORITY', 'SOURCE FORECAST', 'CAMERA', 'WINDOW', 'OWNER'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-mega text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECOMMENDATIONS.map((r, i) => {
                  const p = PREDICTIONS[i % PREDICTIONS.length];
                  const cam = CAMERAS[i % CAMERAS.length];
                  return (
                    <tr key={r.id} className="border-b-3 border-ink/15 last:border-b-0 hover:bg-lime/15">
                      <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide">
                        {r.title}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={PRIORITY_TONE[r.priority]} size="sm">
                          {r.priority.toUpperCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase text-muted">
                        {p.kind}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase text-muted">
                        {cam.id} · {cam.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase">{r.window}</td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase text-muted">
                        {r.owner}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BrutalCard>

        <div className="flex flex-wrap items-center gap-3">
          <BrutalLink to="/predictions" variant="secondary" iconRight={<ArrowRight strokeWidth={3} />}>
            BACK TO FORECASTS
          </BrutalLink>
          <BrutalLink to="/reports" variant="primary">
            EXPORT RECOMMENDATION REPORT
          </BrutalLink>
        </div>
      </Stack>
    </Page>
  );
}
