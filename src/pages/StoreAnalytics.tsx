import { CalendarRange, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/app-state';
import { TONE_SOLID } from '@/lib/tone';
import {
  CATEGORY_PERF,
  MONTH_SERIES,
  STOCKOUT_EVENTS,
  TODAY_SERIES,
  WEEK_SERIES,
} from '@/lib/mock-data';
import type { Metric } from '@/lib/types';
import {
  BrutalButton,
  BrutalCard,
  ChartCard,
  ChartLegend,
  Heatmap,
  MetricCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart, HorizontalBars } from '@/components/charts/BrutalChart';
import { DateFilterBar, Grid, Page, Stack } from '@/components/layout/Page';

/* Deterministic activity matrix: zone × hour. */
const ACTIVITY_ROWS = ['ENTRANCE', 'AISLE 01', 'AISLE 02', 'AISLE 03', 'AISLE 04', 'QUEUE', 'CHECKOUT'];
const ACTIVITY_COLS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
const ZONE_WEIGHT: Record<string, number> = {
  ENTRANCE: 1,
  'AISLE 01': 0.9,
  'AISLE 02': 0.74,
  'AISLE 03': 0.46,
  'AISLE 04': 0.36,
  QUEUE: 0.8,
  CHECKOUT: 0.72,
};

function buildActivity(): number[][] {
  const hourPeak = TODAY_SERIES.map((p) => p.footfall);
  const max = Math.max(...hourPeak);
  return ACTIVITY_ROWS.map((row) =>
    hourPeak.map((f, i) => {
      const base = (f / max) * 100;
      // Midday and evening lulls differ per zone, giving the grid real texture.
      const ripple = 1 + 0.14 * Math.sin((i + ACTIVITY_ROWS.indexOf(row)) * 1.1);
      return Math.round(Math.min(100, Math.max(4, base * ZONE_WEIGHT[row] * ripple)));
    }),
  );
}

const ACTIVITY = buildActivity();

export default function StoreAnalytics() {
  const { dateFilter } = useAppState();

  const series =
    dateFilter === '7 DAYS' ? WEEK_SERIES : dateFilter === '30 DAYS' ? MONTH_SERIES : TODAY_SERIES;

  const totalFootfall = series.reduce((s, p) => s + p.footfall, 0);
  const avgDwell = series.reduce((s, p) => s + p.dwell, 0) / series.length;
  const peakQueue = Math.max(...series.map((p) => p.queue));
  const avgWait = series.reduce((s, p) => s + p.wait, 0) / series.length;
  const avgFill = series.reduce((s, p) => s + p.shelf, 0) / series.length;

  const kpis: Metric[] = [
    {
      id: 'footfall',
      label: 'TOTAL FOOTFALL',
      value: totalFootfall,
      trend: { value: 8.4, direction: 'up', good: true, label: 'vs previous period' },
      tone: 'blue',
      footnote: `${series.length} intervals · anonymous track counting`,
    },
    {
      id: 'dwell',
      label: 'AVG DWELL TIME',
      value: avgDwell,
      unit: 'min',
      precision: 1,
      trend: { value: 3.1, direction: 'up', good: true, label: 'vs previous period' },
      tone: 'purple',
      footnote: 'Median 6.9 min · p90 21.2 min',
    },
    {
      id: 'wait',
      label: 'AVG WAIT TIME',
      value: avgWait,
      unit: 'min',
      precision: 1,
      trend: { value: 12.6, direction: 'down', good: true, label: 'vs previous period' },
      tone: 'lime',
      footnote: `Peak queue ${peakQueue} · SLA target under 5 min`,
    },
    {
      id: 'shelf',
      label: 'AVG SHELF FILL',
      value: avgFill,
      unit: '%',
      precision: 1,
      trend: { value: 2.2, direction: 'down', good: false, label: 'vs previous period' },
      tone: 'yellow',
      footnote: 'Camera-measured across 9 shelf bays',
    },
  ];

  const chartData = series as unknown as Record<string, unknown>[];

  return (
    <Page
      index="ANALYTICS"
      eyebrow="HISTORICAL PERFORMANCE"
      title="STORE ANALYTICS"
      description="Footfall, dwell, queue behaviour, shelf availability and category conversion over the selected window — all derived from the same anonymous event stream."
      tone="blue"
      actions={
        <>
          <DateFilterBar />
          <BrutalButton variant="secondary" icon={<Download strokeWidth={3} />}>
            CSV
          </BrutalButton>
          <BrutalButton variant="primary" icon={<Printer strokeWidth={3} />}>
            PDF
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={`D${i + 1}`} emphasis />
          ))}
        </section>

        <Grid cols={2}>
          <ChartCard
            title="FOOTFALL TREND"
            subtitle={`${dateFilter} · PEOPLE IN STORE`}
            right={<StatusBadge tone="blue" size="sm">ANONYMOUS COUNT</StatusBadge>}
            footer={<ChartLegend items={[{ label: 'FOOTFALL', tone: 'blue' }, { label: 'SHELF FILL %', tone: 'yellow' }]} />}
          >
            <BrutalChart
              data={chartData}
              height={280}
              rightYAxis
              rightUnit="%"
              series={[
                { key: 'footfall', name: 'footfall', tone: 'blue', type: 'area', fillOpacity: 0.28 },
                { key: 'shelf', name: 'shelf fill', tone: 'yellow', yAxisId: 'right', hideDot: true },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="DWELL VS QUEUE DEPTH"
            subtitle="BEHAVIOURAL CORRELATION"
            footer={
              <ChartLegend
                items={[
                  { label: 'DWELL (MIN)', tone: 'purple' },
                  { label: 'QUEUE DEPTH', tone: 'coral' },
                ]}
              />
            }
          >
            <BrutalChart
              data={chartData}
              height={280}
              series={[
                { key: 'dwell', name: 'dwell (min)', tone: 'purple' },
                { key: 'queue', name: 'queue depth', tone: 'coral', type: 'bar', barSize: 16 },
              ]}
            />
          </ChartCard>
        </Grid>

        <Grid cols={2}>
          <ChartCard
            title="STOCK-OUT EVENTS"
            subtitle="SHELF-EMPTY DETECTIONS PER DAY"
            tone="coral"
            footer={<ChartLegend items={[{ label: 'EVENTS', tone: 'coral' }]} />}
          >
            <BrutalChart
              data={STOCKOUT_EVENTS as unknown as Record<string, unknown>[]}
              height={246}
              unit=" events"
              series={[{ key: 'events', name: 'stock-out events', tone: 'coral', type: 'bar', barSize: 34 }]}
            />
          </ChartCard>

          <ChartCard
            title="CATEGORY PERFORMANCE"
            subtitle="TRANSACTIONS BY CATEGORY · SELECTED WINDOW"
            footer={
              <ChartLegend
                items={[
                  { label: 'GREEN FILL > 85%', tone: 'lime' },
                  { label: 'AMBER 65–85%', tone: 'yellow' },
                  { label: 'RED < 65%', tone: 'coral' },
                ]}
              />
            }
          >
            <HorizontalBars
              data={CATEGORY_PERF.map((c) => ({
                label: c.category,
                value: c.transactions,
                tone: c.tone,
              }))}
              height={246}
              labelWidth={130}
              name="transactions"
            />
          </ChartCard>
        </Grid>

        <SectionHeading
          index="HM"
          eyebrow="STORE ACTIVITY"
          title="WHERE THE LOAD ACTUALLY SITS"
          description="Hard-edged heat blocks, not a smooth gradient — every square is a measured value so you can compare two hours at a glance."
          size="md"
          tone="yellow"
          right={
            <StatusBadge tone="yellow" size="sm">
              <CalendarRange className="mr-1.5 h-3 w-3 align-middle" strokeWidth={3} />
              09:00 — 21:00
            </StatusBadge>
          }
        />
        <BrutalCard padding="lg">
          <Heatmap rows={ACTIVITY_ROWS} cols={ACTIVITY_COLS} values={ACTIVITY} />
        </BrutalCard>

        <BrutalCard title="CATEGORY BREAKDOWN" subtitle="CONVERSION AND FILL HEALTH" padding="none">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b-3 border-ink bg-ink/[0.04]">
                  {['CATEGORY', 'FOOTFALL', 'TRANSACTIONS', 'CONVERSION', 'SHELF FILL', 'STATE'].map((h) => (
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
                {CATEGORY_PERF.map((c) => (
                  <tr key={c.category} className="border-b-3 border-ink/15 last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className={cn('h-3.5 w-3.5 border-2 border-ink', TONE_SOLID[c.tone])} />
                        <span className="text-[11px] font-bold uppercase tracking-wide">
                          {c.category}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] tnum">{c.footfall}</td>
                    <td className="px-4 py-3 font-mono text-[11px] tnum">{c.transactions}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold tnum">{c.conversion}%</td>
                    <td className="px-4 py-3">
                      <SegmentBar value={c.fill} segments={14} height="xs" showValue className="w-[160px]" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={c.tone} size="sm">
                        {c.fill >= 85 ? 'HEALTHY' : c.fill >= 65 ? 'WATCH' : 'AT RISK'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BrutalCard>
      </Stack>
    </Page>
  );
}
