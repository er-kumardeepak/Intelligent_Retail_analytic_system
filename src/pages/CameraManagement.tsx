import { useState } from 'react';
import { Camera as CameraIcon, Cpu, HardDrive, RefreshCw, Settings2, Wifi, WifiOff, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { CAMERA_TONE, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { CAMERAS } from '@/lib/mock-data';
import type { Camera } from '@/lib/types';
import {
  BrutalButton,
  BrutalCard,
  CameraFeed,
  ChartCard,
  ChartLegend,
  SectionHeading,
  SegmentBar,
  StatusBadge,
  StoreMap,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

const UPTIME_SERIES = [
  { t: 'MON', uptime: 100, drops: 0 },
  { t: 'TUE', uptime: 99.8, drops: 1 },
  { t: 'WED', uptime: 98.4, drops: 3 },
  { t: 'THU', uptime: 100, drops: 0 },
  { t: 'FRI', uptime: 96.2, drops: 5 },
  { t: 'SAT', uptime: 94.8, drops: 7 },
  { t: 'SUN', uptime: 91.6, drops: 9 },
];

export default function CameraManagement() {
  const { cameras, queueLength, shelfFill, peopleInStore } = useLive();
  const [selectedId, setSelectedId] = useState('CAM-01');

  const selected: Camera = cameras.find((c) => c.id === selectedId) ?? cameras[0];
  const online = cameras.filter((c) => c.status === 'online');
  const degraded = cameras.filter((c) => c.status === 'warning');
  const offline = cameras.filter((c) => c.status === 'offline');
  const coverage = Math.round((online.length / cameras.length) * 100);

  return (
    <Page
      index="CAMERAS"
      eyebrow="FLEET & STREAM HEALTH"
      title="CAMERA MANAGEMENT"
      description="The platform reuses the store's existing cameras. This panel shows what the edge device can actually see — frame rate, latency, uptime and the last frame received."
      tone="blue"
      actions={
        <>
          <StatusBadge tone={offline.length ? 'coral' : 'lime'} size="lg" dot pulse={!!offline.length}>
            {online.length} / {cameras.length} STREAMING
          </StatusBadge>
          <BrutalButton variant="primary" icon={<RefreshCw strokeWidth={3} />}>
            RE-DISCOVER CAMERAS
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        {/* Health summary */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: CameraIcon, label: 'TOTAL CAMERAS', value: cameras.length, tone: 'blue' as const, detail: 'Reused existing CCTV' },
            { icon: Wifi, label: 'STREAMING', value: online.length, tone: 'lime' as const, detail: `Coverage ${coverage}%` },
            { icon: Wrench, label: 'DEGRADED', value: degraded.length, tone: 'yellow' as const, detail: degraded[0] ? `${degraded[0].id} · ${degraded[0].fps} FPS` : 'None' },
            { icon: WifiOff, label: 'OFFLINE', value: offline.length, tone: 'coral' as const, detail: offline[0] ? `${offline[0].id} · LAST FRAME 42M AGO` : 'None' },
          ].map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <span className={cn('absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink', TONE_SOLID[s.tone])} />
              <div className="flex items-center gap-2 pt-1.5">
                <s.icon className={cn('h-4 w-4', TONE_TEXT[s.tone])} strokeWidth={2.8} />
                <span className="font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                  {s.label}
                </span>
              </div>
              <p className="mt-2 text-4xl font-bold leading-none tracking-tightest tnum">{s.value}</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                {s.detail}
              </p>
            </div>
          ))}
        </section>

        {/* Selected camera */}
        <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <BrutalCard
            title={`${selected.id} · ${selected.name}`}
            subtitle={`${selected.zone} · ${selected.resolution} · ${selected.model}`}
            tone={CAMERA_TONE[selected.status]}
            padding="none"
            shadow="md"
            right={
              <StatusBadge tone={CAMERA_TONE[selected.status]} size="sm" dot pulse={selected.status !== 'online'}>
                {selected.status.toUpperCase()}
              </StatusBadge>
            }
          >
            <CameraFeed
              camera={selected}
              queue={queueLength}
              shelfFill={shelfFill}
              persons={peopleInStore}
              framed={false}
            />
          </BrutalCard>

          <Stack gap="sm">
            <BrutalCard title="DEVICE DETAIL" subtitle="STREAM TELEMETRY" padding="md">
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { k: 'FRAME RATE', v: `${selected.fps} FPS` },
                  { k: 'LATENCY', v: `${selected.latencyMs} MS` },
                  { k: 'RESOLUTION', v: selected.resolution },
                  { k: 'UPTIME', v: selected.uptime },
                  { k: 'MODEL', v: selected.model },
                  { k: 'STATUS', v: selected.status.toUpperCase() },
                ].map((item) => (
                  <div key={item.k} className="rounded-brutal border-3 border-ink bg-ink/[0.03] p-2.5">
                    <dt className="font-mono text-[9px] uppercase tracking-mega text-muted">
                      {item.k}
                    </dt>
                    <dd className="mt-1 text-[11px] font-bold uppercase leading-tight tracking-wide">
                      {item.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 border-t-3 border-dashed border-ink/25 pt-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-mega text-muted">
                  STREAM INTEGRITY
                </p>
                <SegmentBar
                  value={selected.status === 'online' ? 98 : selected.status === 'warning' ? 61 : 0}
                  segments={20}
                  height="sm"
                  tone={CAMERA_TONE[selected.status]}
                  showValue
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <BrutalButton variant="primary" size="sm" icon={<RefreshCw strokeWidth={3} />}>
                  RESTART STREAM
                </BrutalButton>
                <BrutalButton variant="secondary" size="sm" icon={<Settings2 strokeWidth={3} />}>
                  CONFIGURE
                </BrutalButton>
              </div>

              {selected.status === 'offline' && (
                <p className="mt-4 rounded-brutal border-3 border-ink bg-coral px-3 py-2.5 font-mono text-[10px] font-bold uppercase leading-relaxed tracking-wider text-ink">
                  NO FRAMES RECEIVED FOR 42 MINUTES. SHELF ZONE IS CURRENTLY UNWATCHED — DISPATCH
                  MAINTENANCE.
                </p>
              )}
            </BrutalCard>

            <BrutalCard title="FLEET COVERAGE" subtitle="WHERE EACH CAMERA POINTS" padding="md">
              <StoreMap cameras={cameras} dots={[]} />
            </BrutalCard>
          </Stack>
        </section>

        {/* Camera grid */}
        <SectionHeading
          index="FLEET"
          eyebrow="ALL CAMERAS"
          title="CAMERA BOARD"
          description="Select a camera to preview its live inference overlay and device telemetry."
          size="md"
          tone="blue"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cameras.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              aria-pressed={c.id === selectedId}
              className={cn(
                'relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-3.5 text-left transition-transform hover:-translate-y-[2px]',
                c.id === selectedId ? 'shadow-brutal' : 'shadow-brutal-xs',
              )}
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink', TONE_SOLID[CAMERA_TONE[c.status]])}
              />
              <div className="flex items-start justify-between gap-2 pt-1.5">
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider">
                    {c.id}
                  </span>
                  <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
                    {c.name}
                  </span>
                </span>
                <StatusBadge tone={CAMERA_TONE[c.status]} size="sm">
                  {c.status.toUpperCase()}
                </StatusBadge>
              </div>
              <p className="mt-2.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                {c.zone}
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t-3 border-dashed border-ink/25 pt-2.5">
                <span className="font-mono text-[10px] tnum">{c.fps} FPS</span>
                <span className="font-mono text-[10px] text-muted tnum">{c.latencyMs} MS</span>
              </div>
            </button>
          ))}
        </div>

        {/* Diagnostics */}
        <Grid cols={2}>
          <ChartCard
            title="FLEET UPTIME"
            subtitle="PERCENTAGE OF EXPECTED FRAMES RECEIVED"
            tone="yellow"
            footer={
              <ChartLegend
                items={[
                  { label: 'UPTIME %', tone: 'lime' },
                  { label: 'STREAM DROPS', tone: 'coral' },
                ]}
              />
            }
          >
            <BrutalChart
              data={UPTIME_SERIES as unknown as Record<string, unknown>[]}
              height={270}
              rightYAxis
              series={[
                { key: 'uptime', name: 'uptime %', tone: 'lime', type: 'area', fillOpacity: 0.28 },
                { key: 'drops', name: 'drops', tone: 'coral', type: 'bar', barSize: 18, yAxisId: 'right' },
              ]}
            />
          </ChartCard>

          <BrutalCard title="FLEET DIAGNOSTICS" subtitle="FULL CAMERA TABLE" padding="none">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="border-b-3 border-ink bg-ink/[0.04]">
                    {['CAM', 'ZONE', 'STATE', 'FPS', 'LATENCY', 'UPTIME'].map((h) => (
                      <th
                        key={h}
                        className="px-3.5 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-mega text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAMERAS.map((c) => (
                    <tr key={c.id} className="border-b-3 border-ink/15 last:border-b-0 hover:bg-blue/10">
                      <td className="px-3.5 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className={cn('h-3 w-3 border-2 border-ink', TONE_SOLID[CAMERA_TONE[c.status]])} />
                          <span className="font-mono text-[10px] font-bold uppercase">{c.id}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[10px] uppercase text-muted">
                        {c.zone}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <StatusBadge tone={CAMERA_TONE[c.status]} size="sm">
                          {c.status.toUpperCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[10px] tnum">{c.fps}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[10px] tnum">{c.latencyMs} MS</td>
                      <td className="px-3.5 py-2.5 font-mono text-[10px] tnum">{c.uptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t-3 border-ink px-3.5 py-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-mega text-muted">
                <Cpu className="h-3.5 w-3.5" strokeWidth={3} />
                EDGE-01 DECODES {cameras.filter((c) => c.status !== 'offline').length} STREAMS
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-mega text-muted">
                <HardDrive className="h-3.5 w-3.5" strokeWidth={3} />
EVENT BUFFER 7 DAYS · FRAMES 0 SEC
              </span>
            </div>
          </BrutalCard>
        </Grid>
      </Stack>
    </Page>
  );
}
