import { useEffect, useState } from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { cn, clock } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { TONE_SOLID } from '@/lib/tone';
import { CAMERAS, INFERENCE_LOAD, QUEUE_SERIES, ZONE_HEAT } from '@/lib/mock-data';
import {
  AIBadge,
  BrutalButton,
  BrutalCard,
  CameraFeed,
  ChartCard,
  ChartLegend,
  MetricCard,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Page, Stack } from '@/components/layout/Page';

export default function LiveAnalytics() {
  const live = useLive();
  const {
    metrics,
    secondaryMetrics,
    peopleInStore,
    queueLength,
    avgDwell,
    shelfFill,
    events,
    cameras,
    lanes,
    live: streaming,
    setLive,
    tick,
  } = live;

  const [series, setSeries] = useState(() =>
    QUEUE_SERIES.map((p) => ({
      t: p.t,
      footfall: p.footfall,
      queue: p.queue,
      dwell: p.dwell,
    })),
  );
  useEffect(() => {
    if (tick === 0) return;
    setSeries((prev) => [
      ...prev.slice(-11),
      { t: clock(new Date()), footfall: peopleInStore, queue: queueLength, dwell: avgDwell },
    ]);
    // Intentionally keyed on the engine tick only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const camera = cameras.find((c) => c.id === 'CAM-01') ?? CAMERAS[0];

  return (
    <Page
      index="LIVE"
      eyebrow="REAL-TIME PIPELINE OUTPUT"
      title="LIVE ANALYTICS"
      description="The same stream the store manager sees on the wall display. Every number below is recomputed on the edge device as the store trades."
      tone="lime"
      actions={
        <>
          <StatusBadge tone={streaming ? 'lime' : 'coral'} size="lg" dot pulse={streaming}>
            {streaming ? 'STREAMING' : 'PAUSED'}
          </StatusBadge>
          <BrutalButton
            variant={streaming ? 'secondary' : 'success'}
            icon={<RefreshCw strokeWidth={3} />}
            onClick={() => setLive(!streaming)}
          >
            {streaming ? 'PAUSE FEED' : 'RESUME FEED'}
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        {/* Live KPI strip */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={`L${i + 1}`} emphasis />
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {secondaryMetrics.map((m) => (
            <div
              key={m.id}
              className="rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <p className="font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                {m.label}
              </p>
              <p className="mt-2 text-3xl font-bold leading-none tracking-tightest tnum">
                {m.value.toFixed(m.precision ?? 0)}
                <span className="ml-1 text-base">{m.unit}</span>
              </p>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{m.footnote}</p>
            </div>
          ))}
        </section>

        {/* Vision + rolling telemetry */}
        <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <BrutalCard
            title="CAM-01 · MAIN ENTRANCE"
            subtitle="COMPUTER VISION · EDGE INFERENCE"
            tone="coral"
            padding="none"
            right={
              <span className="flex items-center gap-2">
                <AIBadge label="YOLO v8n" />
                <StatusBadge tone={streaming ? 'lime' : 'yellow'} size="sm" dot pulse={streaming}>
                  {streaming ? 'LIVE' : 'PAUSED'}
                </StatusBadge>
              </span>
            }
          >
            <CameraFeed
              camera={camera}
              queue={queueLength}
              shelfFill={shelfFill}
              persons={peopleInStore}
              framed={false}
            />
          </BrutalCard>

          <Stack gap="sm">
            <ChartCard
              title="FOOTFALL · ROLLING 12 SAMPLES"
              subtitle="UPDATED EVERY 2.6s"
              right={<StatusBadge tone="coral" size="sm" dot pulse>LIVE</StatusBadge>}
            >
              <BrutalChart
                data={series}
                height={190}
                series={[{ key: 'footfall', name: 'people in store', tone: 'blue', type: 'area' }]}
              />
            </ChartCard>

            <ChartCard title="QUEUE DEPTH · LIVE" subtitle="QUEUE EVENT ENGINE">
              <BrutalChart
                data={series}
                height={170}
                unit=" people"
                series={[
                  { key: 'queue', name: 'queue depth', tone: 'yellow', type: 'bar', barSize: 16 },
                ]}
              />
            </ChartCard>
          </Stack>
        </section>

        {/* Engine telemetry */}
        <section className="grid gap-5 xl:grid-cols-3">
          <ChartCard
            title="INFERENCE LOAD"
            subtitle="FRAMES PER MINUTE VS GPU UTILISATION"
            right={<AIBadge label="40 MS TARGET" />}
            footer={
              <ChartLegend
                items={[
                  { label: 'FRAMES / MIN', tone: 'purple' },
                  { label: 'GPU %', tone: 'yellow' },
                ]}
              />
            }
          >
            <BrutalChart
              data={INFERENCE_LOAD as unknown as Record<string, unknown>[]}
              height={220}
              rightYAxis
              rightUnit="%"
              series={[
                { key: 'fps', name: 'frames / min', tone: 'purple' },
                { key: 'gpu', name: 'gpu %', tone: 'yellow', type: 'bar', barSize: 18, yAxisId: 'right' },
              ]}
            />
          </ChartCard>

          <BrutalCard title="ZONE ACTIVITY" subtitle="FOOTFALL LOAD PER ZONE" padding="md">
            <ul className="flex flex-col gap-3.5">
              {ZONE_HEAT.slice(0, 7).map((z) => (
                <li key={z.zone}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                      {z.zone}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted tnum">
                      {z.dwell}
                    </span>
                  </div>
                  <SegmentBar value={z.heat} segments={18} height="xs" tone={z.tone} showValue />
                </li>
              ))}
            </ul>
          </BrutalCard>

          <BrutalCard title="STREAM HEALTH" subtitle="PER-CAMERA TELEMETRY" padding="none">
            <ul className="brutal-scroll max-h-[318px] overflow-y-auto">
              {cameras.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 border-b-3 border-ink/15 px-3.5 py-2.5 last:border-b-0"
                >
                  <span
                    className={cn(
                      'h-3 w-3 shrink-0 border-2 border-ink',
                      c.status === 'online' ? 'bg-lime' : c.status === 'warning' ? 'bg-yellow' : 'bg-coral',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                      {c.id} · {c.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-muted">
                      {c.resolution} · {c.uptime}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-[10px] font-bold tnum">{c.fps} FPS</span>
                    <span className="block font-mono text-[10px] text-muted tnum">
                      {c.latencyMs} MS
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </BrutalCard>
        </section>

        {/* Lane + event stream */}
        <section className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          <BrutalCard title="CHECKOUT LANES" subtitle="LIVE OCCUPANCY & UTILISATION" padding="md">
            <div className="grid gap-3 sm:grid-cols-2">
              {lanes.map((lane) => (
                <div
                  key={lane.id}
                  className={cn(
                    'rounded-brutal border-3 border-ink p-3',
                    lane.active ? 'bg-surface shadow-brutal-xs' : 'bg-ink/[0.04]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      {lane.lane}
                    </span>
                    <StatusBadge tone={lane.active ? 'lime' : 'ink'} size="sm" outline={!lane.active}>
                      {lane.active ? 'OPEN' : 'IDLE'}
                    </StatusBadge>
                  </div>
                  <p className="mt-2.5 text-3xl font-bold leading-none tracking-tightest tnum">
                    {lane.people}
                    <span className="ml-1 text-xs text-muted">WAITING</span>
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] text-muted tnum">
                    WAIT {lane.waitSec > 0 ? `${Math.floor(lane.waitSec / 60)}M ${lane.waitSec % 60}S` : '—'} · UTIL{' '}
                    {lane.utilisation}%
                  </p>
                  <SegmentBar value={lane.utilisation} segments={12} height="xs" className="mt-2.5" tone={lane.tone} />
                </div>
              ))}
            </div>
          </BrutalCard>

          <BrutalCard
            title="EVENT STREAM"
            subtitle="RAW EVENT ENGINE OUTPUT"
            right={
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-mega text-muted">
                <Radio className="h-3.5 w-3.5 animate-blink text-coral" strokeWidth={3} />
                {events.length} BUFFERED
              </span>
            }
            padding="none"
          >
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b-3 border-ink bg-ink/[0.04]">
                    {['TIME', 'EVENT', 'ZONE', 'CAMERA', 'CONF'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-mega text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 12).map((e) => (
                    <tr key={e.id + e.at} className="border-b-3 border-ink/15 last:border-b-0">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted tnum">{clock(e.at)}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className={cn('h-3 w-3 shrink-0 border-2 border-ink', TONE_SOLID[e.tone])} />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                            {e.type}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] uppercase text-muted">{e.zone}</td>
                      <td className="px-3 py-2 font-mono text-[10px] uppercase text-muted">{e.camera}</td>
                      <td className="px-3 py-2 font-mono text-[10px] font-bold tnum">
                        {e.confidence.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BrutalCard>
        </section>

      </Stack>
    </Page>
  );
}
