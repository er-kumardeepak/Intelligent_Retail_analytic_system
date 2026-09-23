import { ArrowDownRight, ArrowRight, ArrowUpRight, Footprints, LogIn, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { DWELL_DISTRIBUTION, TODAY_SERIES, ZONE_HEAT } from '@/lib/mock-data';
import type { Metric } from '@/lib/types';
import {
  AIBadge,
  BrutalCard,
  BrutalLink,
  ChartCard,
  ChartLegend,
  Heatmap,
  HeatStrip,
  MetricCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

/* Zone × hour footfall matrix, derived from the hourly footfall curve. */
const FLOW_ROWS = ['ENTRANCE', 'AISLE 01 · BEV', 'AISLE 02 · SNK', 'AISLE 03 · DAI', 'AISLE 04 · HHD', 'QUEUE ZONE', 'CHECKOUT'];
const FLOW_COLS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
const WEIGHT: Record<string, number> = {
  ENTRANCE: 1.0,
  'AISLE 01 · BEV': 0.92,
  'AISLE 02 · SNK': 0.78,
  'AISLE 03 · DAI': 0.5,
  'AISLE 04 · HHD': 0.38,
  'QUEUE ZONE': 0.82,
  CHECKOUT: 0.74,
};

const FLOW_MATRIX: number[][] = FLOW_ROWS.map((row, ri) => {
  const curve = TODAY_SERIES.map((p) => p.footfall);
  const max = Math.max(...curve);
  return curve.map((v, ci) => {
    const ripple = 1 + 0.16 * Math.sin((ci + ri * 2) * 0.9);
    const late = ci > 8 ? 1.12 : 1;
    return Math.round(Math.min(100, Math.max(3, (v / max) * 100 * WEIGHT[row] * ripple * late)));
  });
});

const FUNNEL = [
  { label: 'STORE ENTRY', value: 1284, pct: 100, tone: 'lime' as const },
  { label: 'REACHED AN AISLE', value: 1102, pct: 86, tone: 'blue' as const },
  { label: 'PICKED A BASKET', value: 764, pct: 60, tone: 'purple' as const },
  { label: 'JOINED CHECKOUT', value: 486, pct: 38, tone: 'yellow' as const },
  { label: 'COMPLETED PURCHASE', value: 412, pct: 32, tone: 'coral' as const },
];

export default function CustomerFlow() {
  const { peopleInStore, avgDwell, dots, shelfFill } = useLive();

  const entrance = TODAY_SERIES.reduce((s, p) => s + Math.round(p.footfall * 1.08), 0);
  const exit = TODAY_SERIES.reduce((s, p) => s + Math.round(p.footfall * 0.96), 0);
  const topZone = [...ZONE_HEAT].sort((a, b) => b.heat - a.heat)[0];

  const kpis: Metric[] = [
    {
      id: 'footfall',
      label: 'FOOTFALL TODAY',
      value: entrance,
      trend: { value: 8.4, direction: 'up', good: true, label: 'vs last week' },
      tone: 'blue',
      footnote: 'Anonymous entries counted at CAM-01',
    },
    {
      id: 'dwell',
      label: 'AVG DWELL TIME',
      value: avgDwell,
      unit: 'min',
      precision: 1,
      trend: { value: 4.2, direction: 'up', good: true, label: 'vs last week' },
      tone: 'purple',
      footnote: `Dwell computed from track presence, not POS`,
    },
    {
      id: 'entrance',
      label: 'ENTRANCE TRAFFIC',
      value: 46,
      unit: '/min',
      trend: { value: 23, direction: 'up', good: true, label: 'vs baseline' },
      tone: 'lime',
      footnote: 'Live throughput at MAIN ENTRANCE',
    },
    {
      id: 'exit',
      label: 'EXIT TRAFFIC',
      value: 31,
      unit: '/min',
      trend: { value: 6, direction: 'up', good: true, label: 'vs baseline' },
      tone: 'yellow',
      footnote: `${exit.toLocaleString()} exits today · funnel conversion 32%`,
    },
  ];

  const trafficSeries = TODAY_SERIES.map((p) => ({
    t: p.t,
    entrance: Math.round(p.footfall * 1.08),
    exit: Math.round(p.footfall * 0.96),
    dwell: p.dwell,
  }));

  return (
    <Page
      index="FLOW"
      eyebrow="ANONYMOUS MOVEMENT ANALYTICS"
      title="HOW PEOPLE MOVE"
      description="Tracks are numeric IDs with no identity attached. We can tell you that 43 people spent six minutes in front of the beverages bay without ever knowing who they were."
      tone="purple"
      actions={
        <>
          <StatusBadge tone="purple" size="lg" dot pulse>
            {dots.length} LIVE TRACKS
          </StatusBadge>
          <AIBadge label="TRACK IDs RECYCLE IN 20 MIN" />
        </>
      }
    >
      <Stack gap="lg">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={`F${i + 1}`} emphasis />
          ))}
        </section>

        <Grid cols={2}>
          <ChartCard
            title="ENTRANCE VS EXIT TRAFFIC"
            subtitle="PEOPLE PER MINUTE · TODAY"
            right={<StatusBadge tone="blue" size="sm">BALANCE +17%</StatusBadge>}
            footer={
              <ChartLegend
                items={[
                  { label: 'ENTRANCE', tone: 'lime' },
                  { label: 'EXIT', tone: 'yellow' },
                  { label: 'DWELL (MIN)', tone: 'purple' },
                ]}
              />
            }
          >
            <BrutalChart
              data={trafficSeries as unknown as Record<string, unknown>[]}
              height={290}
              referenceX="19:00"
              referenceLabel="NOW"
              rightYAxis
              rightUnit=" min"
              series={[
                { key: 'entrance', name: 'entrance', tone: 'lime', type: 'area', fillOpacity: 0.26 },
                { key: 'exit', name: 'exit', tone: 'yellow' },
                { key: 'dwell', name: 'dwell (min)', tone: 'purple', yAxisId: 'right', dashed: true, hideDot: true },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="DWELL TIME DISTRIBUTION"
            subtitle="MINUTES SPENT IN STORE · TODAY"
            tone="purple"
            footer={
              <ChartLegend
                items={[
                  { label: 'VISITORS', tone: 'purple' },
                  { label: 'MEDIAN BAND 5–10 MIN', tone: 'lime' },
                ]}
              />
            }
          >
            <BrutalChart
              data={DWELL_DISTRIBUTION as unknown as Record<string, unknown>[]}
              xKey="bucket"
              height={290}
              unit=" people"
              series={[{ key: 'count', name: 'visitors', tone: 'purple', type: 'bar', barSize: 40 }]}
            />
          </ChartCard>
        </Grid>

        <SectionHeading
          index="HM"
          eyebrow="FOOTFALL HEATMAP"
          title="WHERE THE CROWD ACTUALLY IS"
          description="Hard blocks in five discrete steps. This is deliberately not a gradient — you should be able to compare two cells exactly."
          size="md"
          tone="coral"
          right={<StatusBadge tone={topZone.tone} size="sm">PEAK ZONE · {topZone.zone}</StatusBadge>}
        />
        <BrutalCard padding="lg" shadow="md">
          <Heatmap rows={FLOW_ROWS} cols={FLOW_COLS} values={FLOW_MATRIX} />
        </BrutalCard>

        <Grid cols={2}>
          <BrutalCard title="ZONE POPULARITY" subtitle="FOOTFALL LOAD AND AVERAGE DWELL">
            <ul className="flex flex-col gap-4">
              {[...ZONE_HEAT]
                .sort((a, b) => b.heat - a.heat)
                .map((z) => (
                  <li key={z.zone}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={cn('h-3 w-3 shrink-0 border-2 border-ink', TONE_SOLID[z.tone])} />
                        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                          {z.zone}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted">
                        DWELL <span className="font-bold text-ink">{z.dwell}</span>
                      </span>
                    </div>
                    <HeatStrip value={z.heat} segments={20} />
                  </li>
                ))}
            </ul>
          </BrutalCard>

          <Stack gap="sm">
            <BrutalCard title="CONVERSION FUNNEL" subtitle="ENTRY TO PURCHASE · TODAY" padding="md">
              <ul className="flex flex-col gap-3">
                {FUNNEL.map((step) => (
                  <li key={step.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        {step.label}
                      </span>
                      <span className="font-mono text-[10px] font-bold tnum">
                        {step.value.toLocaleString()}
                        <span className="ml-1.5 text-muted">{step.pct}%</span>
                      </span>
                    </div>
                    <div className="h-6 w-full border-3 border-ink bg-ink/[0.05]">
                      <div
                        className={cn('h-full border-r-3 border-ink', TONE_SOLID[step.tone])}
                        style={{ width: `${step.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t-3 border-dashed border-ink/25 pt-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                FUNNEL IS BUILT FROM TRACK IDS CROSSING ZONE POLYGONS, THEN RECONCILED WITH THE POS
                BRIDGE.
              </p>
            </BrutalCard>

            <BrutalCard title="FLOW SIGNALS" subtitle="OBSERVED RIGHT NOW" padding="md">
              <ul className="flex flex-col gap-3">
                {[
                  { icon: LogIn, label: 'ENTRANCE RATE', value: '46 / MIN', tone: 'lime' as const },
                  { icon: LogOut, label: 'EXIT RATE', value: '31 / MIN', tone: 'yellow' as const },
                  { icon: Users, label: 'IN STORE NOW', value: `${peopleInStore} PEOPLE`, tone: 'blue' as const },
                  { icon: Footprints, label: 'SHELF FILL', value: `${shelfFill}%`, tone: 'purple' as const },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-3">
                    <row.icon className={cn('h-4 w-4 shrink-0', TONE_TEXT[row.tone])} strokeWidth={2.8} />
                    <span className="flex-1 font-mono text-[10px] uppercase tracking-mega text-muted">
                      {row.label}
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase tnum">{row.value}</span>
                    {row.label === 'ENTRANCE RATE' ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-lime" strokeWidth={3} />
                    ) : row.label === 'EXIT RATE' ? (
                      <ArrowDownRight className="h-3.5 w-3.5 text-yellow" strokeWidth={3} />
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t-3 border-ink pt-3">
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-mega text-muted">
                  ENTRANCE DWELL PRESSURE
                </p>
                <SegmentBar value={96} segments={20} height="sm" tone="coral" showValue />
              </div>
            </BrutalCard>

            <BrutalLink to="/recommendations" variant="secondary" iconRight={<ArrowRight strokeWidth={3} />}>
              SEE FLOW-BASED RECOMMENDATIONS
            </BrutalLink>
          </Stack>
        </Grid>
      </Stack>
    </Page>
  );
}
