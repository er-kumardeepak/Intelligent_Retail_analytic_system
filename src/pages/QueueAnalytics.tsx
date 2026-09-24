import { useEffect, useState } from 'react';
import { ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { BrutalCard, SegmentBar, StatusBadge } from '@/components/brutal';
import { BlockHeading, DateFilterBar, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { useWindow } from '@/lib/app-state';
import { api, type ApiQueuePoint, type ApiQueueSummary } from '@/lib/api';
import { cn, clock } from '@/lib/utils';
import type { Tone } from '@/lib/types';

const CONGESTION_TONE: Record<string, Tone> = {
  critical: 'coral',
  warning: 'yellow',
  watch: 'blue',
  normal: 'lime',
};

/** Hard-edged queue trend. Hand-rolled so there is no chart dependency here. */
function QueueChart({ points }: { points: ApiQueuePoint[] }) {
  const width = 760;
  const height = 220;
  const pad = 18;

  if (points.length < 2) {
    return (
      <p className="border-3 border-dashed border-ink/40 p-6 text-center font-mono text-[10px] uppercase tracking-mega text-muted">
        Not enough queue snapshots in this window to draw a trend.
      </p>
    );
  }

  const max = Math.max(...points.map((point) => point.queue_length), 1);
  const stepX = width / (points.length - 1);
  const yFor = (value: number) => height - pad - (value / max) * (height - pad * 2);
  const polyline = points
    .map((point, index) => `${index * stepX},${yFor(point.queue_length)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-56 w-full"
      role="img"
      aria-label="Queue length over time"
    >
      {[0, 1, 2, 3].map((line) => (
        <line
          key={line}
          x1="0"
          x2={width}
          y1={pad + line * ((height - pad * 2) / 3)}
          y2={pad + line * ((height - pad * 2) / 3)}
          stroke="#111111"
          strokeOpacity="0.12"
          strokeDasharray="6 6"
        />
      ))}
      <polyline
        fill="none"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polyline}
      />
      {points.map((point, index) => (
        <circle
          key={`${point.timestamp}-${index}`}
          cx={index * stepX}
          cy={yFor(point.queue_length)}
          r="4"
          fill="#111111"
        />
      ))}
    </svg>
  );
}

export default function QueueAnalytics() {
  const { storeId, overview, lastUpdated, store } = useData();
  const window = useWindow();
  const [summary, setSummary] = useState<ApiQueueSummary | null>(null);

  /* The window selector is real: it re-queries the REST endpoint. */
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    api
      .queues(storeId, window)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [storeId, window, lastUpdated]);

  if (!summary) {
    return (
      <div className="py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-mega text-muted">
          Loading queue data…
        </p>
      </div>
    );
  }

  const prediction = overview?.queue_prediction ?? null;
  const isToday = window === 'today';

  const tiles = [
    { label: 'CURRENT QUEUE', value: `${summary.current_queue}`, unit: 'people', tone: 'blue' as Tone },
    { label: 'ESTIMATED WAIT', value: summary.estimated_wait_minutes.toFixed(1), unit: 'min', tone: 'yellow' as Tone },
    { label: 'ARRIVAL RATE', value: summary.arrival_rate.toFixed(1), unit: '/min', tone: 'lime' as Tone },
    { label: 'SERVICE RATE', value: summary.service_rate.toFixed(1), unit: '/min', tone: 'coral' as Tone },
  ];

  const TrendIcon =
    prediction?.trend === 'growing'
      ? TrendingUp
      : prediction?.trend === 'clearing'
        ? TrendingDown
        : Minus;

  return (
    <Page
      index="03"
      eyebrow={store ? `${store.store_id} · CHECKOUT` : 'CHECKOUT'}
      title="Queue Analytics"
      description="Checkout pressure and a forward projection. The projection is plain arithmetic, not a black box — the exact formula the backend used is shown below it."
      tone="yellow"
      actions={
        <>
          <DateFilterBar />
          <StatusBadge tone="blue" size="lg" outline>
            {summary.samples} SAMPLES
          </StatusBadge>
        </>
      }
    >
      <Stack gap="lg">
        {summary.samples === 0 ? (
          <BrutalCard padding="lg" tone="yellow">
            <p className="text-center font-mono text-[11px] uppercase tracking-mega text-muted">
              No queue snapshots recorded in this window. The edge device posts a queue_update event
              to start the series.
            </p>
          </BrutalCard>
        ) : (
          <>
            <Grid cols={4}>
              {tiles.map((tile) => (
                <BrutalCard key={tile.label} tone={tile.tone} padding="none" interactive>
                  <div className="p-4">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
                      {tile.label}
                    </p>
                    <p className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-5xl font-bold leading-none tracking-tightest tnum">
                        {tile.value}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        {tile.unit}
                      </span>
                    </p>
                  </div>
                </BrutalCard>
              ))}
            </Grid>

            {/* Prediction — the headline of this page */}
            {isToday && prediction && (
              <BrutalCard
                tone={CONGESTION_TONE[prediction.congestion_level] ?? 'blue'}
                title="Queue projection"
                subtitle={`${prediction.horizon_minutes} MIN HORIZON · ${prediction.open_counters} COUNTERS OPEN`}
                right={
                  <StatusBadge
                    tone={CONGESTION_TONE[prediction.congestion_level] ?? 'blue'}
                    size="md"
                    dot
                    pulse={prediction.congestion_level === 'critical'}
                  >
                    {prediction.congestion_level.toUpperCase()}
                  </StatusBadge>
                }
                padding="md"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-brutal border-3 border-ink bg-surface px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-mega text-muted">NOW</p>
                    <p className="text-4xl font-bold leading-none tracking-tightest tnum">
                      {prediction.current_queue}
                    </p>
                  </div>

                  <ArrowRight className="h-7 w-7 shrink-0" strokeWidth={3} />

                  <div className="rounded-brutal border-3 border-ink bg-ink px-4 py-3 text-paper">
                    <p className="font-mono text-[9px] uppercase tracking-mega text-paper/60">
                      IN {prediction.horizon_minutes} MIN
                    </p>
                    <p className="text-4xl font-bold leading-none tracking-tightest tnum">
                      {prediction.predicted_queue}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendIcon className="h-5 w-5" strokeWidth={3} />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
                      {prediction.trend}
                    </span>
                  </div>
                </div>

                <p className="mt-4 border-l-4 border-ink/30 pl-3 text-[13px] leading-snug text-muted">
                  {prediction.explanation}
                </p>

                {/* The arithmetic itself, collapsed by default. */}
                <Disclosure
                  className="mt-4 shadow-none"
                  summary="How this was calculated"
                  hint="FORMULA"
                >
                  <code className="block overflow-x-auto whitespace-pre rounded-brutal border-3 border-ink bg-ink/[0.04] p-3 font-mono text-[11px]">
                    {prediction.formula}
                  </code>
                  <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { k: 'NET GROWTH', v: `${prediction.net_growth_per_minute}/min` },
                      { k: 'BREACH AT', v: `${prediction.breach_threshold} people` },
                      {
                        k: 'TIME TO BREACH',
                        v:
                          prediction.minutes_until_breach === null
                            ? 'not projected'
                            : `${prediction.minutes_until_breach} min`,
                      },
                      { k: 'EST. WAIT', v: `${prediction.estimated_wait_minutes} min` },
                    ].map((item) => (
                      <div key={item.k} className="rounded-brutal border-3 border-ink/20 p-2.5">
                        <dt className="font-mono text-[9px] uppercase tracking-mega text-muted">
                          {item.k}
                        </dt>
                        <dd className="mt-1 text-[11px] font-bold uppercase tracking-wide">
                          {item.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Disclosure>
              </BrutalCard>
            )}

            {/* Trend */}
            <Stack gap="sm">
              <BlockHeading
                right={
                  <span className="font-mono text-[10px] uppercase tracking-mega text-muted">
                    PEAK {summary.peak_queue} · AVG {summary.average_queue}
                  </span>
                }
              >
                Queue length over time
              </BlockHeading>
              <BrutalCard padding="md">
                <QueueChart points={summary.series} />
                {summary.series.length > 0 && (
                  <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted">
                    <span>FIRST {clock(summary.series[0].timestamp)}</span>
                    <span>
                      {summary.last_updated
                        ? `LAST SNAPSHOT ${clock(summary.last_updated)}`
                        : 'NO TIMESTAMP'}
                    </span>
                  </div>
                )}
              </BrutalCard>
            </Stack>

            {/* Counters */}
            <BrutalCard title="Counter utilisation" padding="md">
              <SegmentBar
                value={Math.min(100, summary.open_counters * 25)}
                segments={16}
                height="sm"
                tone={summary.open_counters >= 3 ? 'lime' : 'yellow'}
              />
              <p className={cn('mt-3 font-mono text-[10px] uppercase tracking-wider text-muted')}>
                {summary.open_counters} of 4 checkout lanes open
              </p>
            </BrutalCard>
          </>
        )}
      </Stack>
    </Page>
  );
}
