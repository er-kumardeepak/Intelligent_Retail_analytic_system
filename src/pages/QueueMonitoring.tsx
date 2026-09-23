import { AlarmClock, ArrowRight, Gauge, Timer, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { PREDICTIONS, QUEUE_SERIES } from '@/lib/mock-data';
import type { Metric } from '@/lib/types';
import {
  AIBadge,
  BrutalCard,
  BrutalLink,
  ChartCard,
  ChartLegend,
  MetricCard,
  PredictionCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

const WAIT_PERCENTILES = [
  { p: 'p50', label: 'MEDIAN', value: 96 },
  { p: 'p75', label: 'THREE-QUARTER', value: 168 },
  { p: 'p90', label: 'NINETIETH', value: 264 },
  { p: 'p95', label: 'NINETY-FIFTH', value: 372 },
  { p: 'MAX', label: 'WORST TODAY', value: 425 },
];

const SLA_TARGET = 300; // 5 minutes

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
}

export default function QueueMonitoring() {
  const { queueLength, avgWait, lanes, tick, peopleInStore } = useLive();

  const activeLanes = lanes.filter((l) => l.active).length;
  const utilisation = Math.round(
    lanes.reduce((s, l) => s + l.utilisation, 0) / Math.max(1, activeLanes),
  );
  const peak = Math.max(...QUEUE_SERIES.map((p) => p.queue));
  const breaches = WAIT_PERCENTILES.filter((w) => w.value > SLA_TARGET).length;

  const kpis: Metric[] = [
    {
      id: 'current',
      label: 'CURRENT QUEUE',
      value: queueLength,
      trend: { value: -40, direction: 'down', good: true, label: 'vs 15 min ago' },
      tone: 'lime',
      footnote: `${activeLanes} of 4 lanes open · ${peopleInStore} people in store`,
    },
    {
      id: 'wait',
      label: 'AVG WAITING TIME',
      value: avgWait,
      unit: 'min',
      precision: 1,
      trend: { value: -18, direction: 'down', good: true, label: 'vs 15 min ago' },
      tone: 'blue',
      footnote: 'SLA target 5m 00s · under target',
    },
    {
      id: 'peak',
      label: 'PEAK QUEUE TODAY',
      value: peak,
      trend: { value: 16, direction: 'up', good: false, label: 'vs yesterday' },
      tone: 'coral',
      footnote: 'Reached at 17:30 · CAM-03',
    },
    {
      id: 'util',
      label: 'CHECKOUT UTILISATION',
      value: utilisation,
      unit: '%',
      trend: { value: 9, direction: 'up', good: false, label: 'vs 15 min ago' },
      tone: 'yellow',
      footnote: `${breaches} percentile bands breached today`,
    },
  ];

  const series = QUEUE_SERIES.map((p) => ({
    t: p.t,
    queue: p.queue,
    wait: p.wait,
    footfall: p.footfall,
  }));

  return (
    <Page
      index="QUEUE"
      eyebrow="CHECKOUT OPERATIONS"
      title="QUEUE PRESSURE"
      description="Queue depth and wait time are measured from the checkout camera, frame by frame. The service-level target is a five minute maximum wait."
      tone="yellow"
      actions={
        <>
          <StatusBadge tone={queueLength > 4 ? 'coral' : 'lime'} size="lg" dot pulse={queueLength > 4}>
            {queueLength > 4 ? 'PRESSURE HIGH' : 'PRESSURE NORMAL'}
          </StatusBadge>
          <AIBadge label="CONGESTION MODEL" />
        </>
      }
    >
      <Stack gap="lg">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={`Q${i + 1}`} emphasis />
          ))}
        </section>

        <Grid cols={2}>
          <ChartCard
            title="QUEUE DEPTH THROUGH THE DAY"
            subtitle="PEOPLE WAITING · 30 MIN INTERVALS"
            right={<StatusBadge tone="yellow" size="sm">PEAK {peak}</StatusBadge>}
            footer={
              <ChartLegend
                items={[
                  { label: 'QUEUE DEPTH', tone: 'coral' },
                  { label: 'WAIT (MIN)', tone: 'blue' },
                ]}
              />
            }
          >
            <BrutalChart
              data={series as unknown as Record<string, unknown>[]}
              height={290}
              referenceX="19:00"
              referenceLabel="NOW"
              rightYAxis
              rightUnit=" min"
              series={[
                { key: 'wait', name: 'avg wait (min)', tone: 'blue', yAxisId: 'right' },
                { key: 'queue', name: 'queue depth', tone: 'coral', type: 'bar', barSize: 18 },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="FOOTFALL VS QUEUE CORRELATION"
            subtitle="TRAFFIC DRIVES PRESSURE, NOT THE OTHER WAY AROUND"
            footer={
              <ChartLegend
                items={[
                  { label: 'FOOTFALL', tone: 'purple' },
                  { label: 'QUEUE DEPTH', tone: 'yellow' },
                ]}
              />
            }
          >
            <BrutalChart
              data={series as unknown as Record<string, unknown>[]}
              height={290}
              rightYAxis
              series={[
                { key: 'footfall', name: 'footfall', tone: 'purple', type: 'area', fillOpacity: 0.24 },
                { key: 'queue', name: 'queue depth', tone: 'yellow', yAxisId: 'right' },
              ]}
            />
          </ChartCard>
        </Grid>

        <SectionHeading
          index="LANES"
          eyebrow="LANE OCCUPANCY"
          title="CHECKOUT LANE BOARD"
          description="Live occupancy per lane. The system recommends opening a lane before the queue breaches the SLA, not after."
          size="md"
          tone="coral"
          right={
            <span className="font-mono text-[10px] uppercase tracking-mega text-muted">
              ENGINE TICK {tick}
            </span>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {lanes.map((lane) => (
            <div
              key={lane.id}
              className={cn(
                'relative overflow-hidden rounded-brutal border-3 border-ink p-4 shadow-brutal-sm',
                lane.active ? 'bg-surface' : 'bg-ink/[0.05]',
              )}
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink', TONE_SOLID[lane.tone])}
              />
              <div className="flex items-center justify-between gap-2 pt-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  {lane.lane}
                </span>
                <StatusBadge tone={lane.active ? 'lime' : 'ink'} size="sm" outline={!lane.active}>
                  {lane.active ? 'OPEN' : 'IDLE'}
                </StatusBadge>
              </div>

              <p className="mt-3 text-4xl font-bold leading-none tracking-tightest tnum">
                {lane.people}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-mega text-muted">
                PEOPLE WAITING
              </p>

              <dl className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    WAIT
                  </dt>
                  <dd className="font-mono text-[11px] font-bold tnum">
                    {lane.waitSec > 0 ? fmt(lane.waitSec) : '—'}
                  </dd>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      UTILISATION
                    </dt>
                    <dd className="font-mono text-[11px] font-bold tnum">{lane.utilisation}%</dd>
                  </div>
                  <SegmentBar value={lane.utilisation} segments={12} height="xs" tone={lane.tone} />
                </div>
              </dl>

              {lane.utilisation > 85 && (
                <p className={cn('mt-3 font-mono text-[10px] font-bold uppercase tracking-mega', TONE_TEXT.coral)}>
                  SATURATION IMMINENT
                </p>
              )}
            </div>
          ))}
        </div>

        <Grid cols={2}>
          <BrutalCard title="WAIT TIME PERCENTILES" subtitle="TODAY · SECONDS" padding="none">
            <ul>
              {WAIT_PERCENTILES.map((w) => {
                const breach = w.value > SLA_TARGET;
                return (
                  <li
                    key={w.p}
                    className="flex flex-wrap items-center gap-3 border-b-3 border-ink/15 px-4 py-3 last:border-b-0"
                  >
                    <span className="flex w-14 shrink-0 items-center justify-center border-3 border-ink bg-ink font-mono text-[10px] font-bold text-paper">
                      {w.p}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
                        {w.label}
                      </span>
                      <SegmentBar
                        value={Math.min(100, (w.value / 450) * 100)}
                        segments={20}
                        height="xs"
                        tone={breach ? 'coral' : 'lime'}
                        className="mt-1.5"
                      />
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-sm font-bold tnum',
                        breach ? TONE_TEXT.coral : TONE_TEXT.lime,
                      )}
                    >
                      {fmt(w.value)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="border-t-3 border-ink px-4 py-3">
              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                SLA TARGET {fmt(SLA_TARGET)} · {breaches} BAND{breaches === 1 ? '' : 'S'} ABOVE TARGET
              </p>
            </div>
          </BrutalCard>

          <Stack gap="sm">
            <BrutalCard title="WHAT THE QUEUE ENGINE IS WATCHING" subtitle="RULE SET" padding="md">
              <ul className="flex flex-col gap-2.5">
                {[
                  { icon: Users, text: 'Queue depth per lane, sampled every 2.6s' },
                  { icon: Timer, text: 'Dwell inside the queue polygon' },
                  { icon: Gauge, text: 'Lane utilisation from cashier presence' },
                  { icon: TrendingUp, text: 'Basket size trend from POS bridge' },
                  { icon: AlarmClock, text: 'SLA breach prediction at 15 minute horizon' },
                ].map((row) => (
                  <li key={row.text} className="flex items-start gap-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.8} />
                    <span className="text-[12px] leading-snug text-muted">{row.text}</span>
                  </li>
                ))}
              </ul>
            </BrutalCard>

            {PREDICTIONS.filter((p) => p.kind.includes('CONGESTION')).map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}

            <BrutalLink to="/recommendations" variant="primary" iconRight={<ArrowRight strokeWidth={3} />}>
              OPEN THE ACTION QUEUE
            </BrutalLink>
          </Stack>
        </Grid>
      </Stack>
    </Page>
  );
}
