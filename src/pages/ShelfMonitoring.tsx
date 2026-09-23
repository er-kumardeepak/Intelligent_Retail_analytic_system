import { useState, type ReactNode } from 'react';
import { AlertOctagon, ArrowRight, Boxes, PackageCheck, PackageX, RefreshCw, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { SHELF_TONE, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { LOW_STOCK_PRODUCTS, PREDICTIONS, SHELVES } from '@/lib/mock-data';
import type { Metric, ShelfStatus, Tone } from '@/lib/types';
import {
  AIBadge,
  BrutalButton,
  BrutalCard,
  BrutalLink,
  ChartCard,
  ChartLegend,
  HeatStrip,
  MetricCard,
  PredictionCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
  Sticker,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

/** A rack of bays drawn as hard blocks — the shelf equivalent of a floor plan. */
function ShelfRack({
  bays,
  onSelect,
  selected,
}: {
  bays: { id: string; name: string; fill: number; aisle: string }[];
  onSelect: (id: string) => void;
  selected: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {bays.map((bay) => {
        const status: ShelfStatus =
          bay.fill <= 8 ? 'empty' : bay.fill < 55 ? 'critical' : bay.fill < 75 ? 'low' : 'healthy';
        const tone = SHELF_TONE[status];
        const rows = 5;
        const filledRows = Math.round((bay.fill / 100) * rows);
        return (
          <button
            key={bay.id}
            type="button"
            onClick={() => onSelect(bay.id)}
            aria-pressed={selected === bay.id}
            className={cn(
              'rounded-brutal border-3 border-ink bg-surface p-2.5 text-left transition-transform hover:-translate-y-[2px]',
              selected === bay.id ? 'shadow-brutal-sm' : 'shadow-brutal-xs',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wide">
                  {bay.name}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-muted">
                  {bay.aisle}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] font-bold tnum">{bay.fill}%</span>
            </div>

            <div className="mt-2.5 flex flex-col gap-[3px] border-3 border-ink bg-ink/[0.05] p-1.5">
              {Array.from({ length: rows }).map((_, r) => (
                <span
                  key={r}
                  className={cn(
                    'h-2.5 border-2 border-ink',
                    r < filledRows ? TONE_SOLID[tone] : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function ShelfMonitoring() {
  const { shelfFill } = useLive();
  const [selectedBay, setSelectedBay] = useState(SHELVES[0].id);

  const bay = SHELVES.find((s) => s.id === selectedBay) ?? SHELVES[0];
  const empty = SHELVES.filter((s) => s.status === 'empty' || s.fill < 20);
  const low = SHELVES.filter((s) => s.status === 'low' || s.status === 'critical');
  const belowThreshold = SHELVES.filter((s) => s.fill < s.threshold);
  const avg = Math.round(SHELVES.reduce((sum, s) => sum + s.fill, 0) / SHELVES.length);

  const kpis: Metric[] = [
    {
      id: 'availability',
      label: 'SHELF AVAILABILITY',
      value: avg,
      unit: '%',
      trend: { value: 2.4, direction: 'down', good: false, label: 'vs 1 hour ago' },
      tone: 'blue',
      footnote: 'Average across 9 camera-monitored bays',
    },
    {
      id: 'lowstock',
      label: 'LOW-STOCK BAYS',
      value: low.length,
      trend: { value: -14, direction: 'down', good: true, label: 'vs 1 hour ago' },
      tone: 'yellow',
      footnote: `${belowThreshold.length} below configured threshold`,
    },
    {
      id: 'empty',
      label: 'EMPTY SHELVES',
      value: empty.length,
      trend: { value: 100, direction: 'up', good: false, label: 'vs 1 hour ago' },
      tone: 'coral',
      footnote: 'AISLE 04 bay 04-B reported zero facings',
    },
    {
      id: 'priority',
      label: 'RESTOCK PRIORITY',
      value: LOW_STOCK_PRODUCTS.filter((p) => p.risk === 'high').length,
      trend: { value: 0, direction: 'flat', good: true, label: 'stable' },
      tone: 'purple',
      footnote: 'Ranked by hours of cover remaining',
    },
  ];

  const fillSeries = [
    { t: '14:00', fill: 92, risk: 18 },
    { t: '15:00', fill: 90, risk: 22 },
    { t: '16:00', fill: 89, risk: 26 },
    { t: '17:00', fill: 86, risk: 34 },
    { t: '18:00', fill: 82, risk: 41 },
    { t: '19:00', fill: shelfFill, risk: 47 },
  ];

  return (
    <Page
      index="SHELVES"
      eyebrow="COMPUTER VISION SHELF AUDIT"
      title="SHELF INTELLIGENCE"
      description="Shelf fill is measured continuously from the camera — no manual audit, no shelf-scanning robot. Empty and low bays escalate to restock priorities automatically."
      tone="yellow"
      actions={
        <>
          <AIBadge label="SHELF MODEL v3.4" />
          <BrutalButton variant="primary" icon={<RefreshCw strokeWidth={3} />}>
            RE-RUN AUDIT
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={`S${i + 1}`} emphasis />
          ))}
        </section>

        {/* Reported alerts strip */}
        <div className="grid gap-3 md:grid-cols-3">
          <ReportTile
            tone="coral"
            icon={<PackageX strokeWidth={2.8} />}
            label="EMPTY SHELF DETECTED"
            value="AISLE 04 · BEVERAGES"
            detail="0 facings across 3 SKUs for 6 minutes · CAM-04"
            sticker="CRITICAL"
          />
          <ReportTile
            tone="yellow"
            icon={<AlertOctagon strokeWidth={2.8} />}
            label="LOW STOCK"
            value="AISLE 03 · DAIRY"
            detail="Fill rate 53% · 3 SKUs approaching depletion"
            sticker="WARNING"
          />
          <ReportTile
            tone="lime"
            icon={<PackageCheck strokeWidth={2.8} />}
            label="RESTOCK VERIFIED"
            value="AISLE 02 · SNACKS"
            detail="Fill recovered 58% → 88% after staff action"
            sticker="RESOLVED"
          />
        </div>

        <SectionHeading
          index="RACK"
          eyebrow="AISLE VISUALISATION"
          title="HORIZONTAL SHELF VIEW"
          description="Each bay is drawn as five shelf levels. Tap a bay to inspect it — fill is measured, not estimated."
          size="md"
          tone="blue"
          right={<Sticker tone="blue">CAMERA MEASURED</Sticker>}
        />

        <ShelfRack bays={SHELVES} selected={selectedBay} onSelect={setSelectedBay} />

        <Grid cols={2}>
          <BrutalCard
            title={`BAY DETAIL · ${bay.name}`}
            subtitle={`${bay.aisle} · ${bay.units} / ${bay.capacity} UNITS ON SHELF`}
            tone={SHELF_TONE[bay.status]}
            right={
              <StatusBadge tone={SHELF_TONE[bay.status]} size="sm" dot pulse={bay.status === 'critical'}>
                {bay.status.toUpperCase()}
              </StatusBadge>
            }
          >
            <SegmentBar value={bay.fill} segments={26} height="lg" showValue tone={SHELF_TONE[bay.status]} />
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: 'FILL RATE', v: `${bay.fill}%` },
                { k: 'THRESHOLD', v: `${bay.threshold}%` },
                {
                  k: 'TIME TO EMPTY',
                  v: bay.hoursToStockOut === null ? 'STABLE' : `${bay.hoursToStockOut}H`,
                },
                { k: 'PRIORITY', v: `#${bay.restockPriority}` },
              ].map((item) => (
                <div key={item.k} className="rounded-brutal border-3 border-ink bg-ink/[0.03] p-2.5">
                  <dt className="font-mono text-[9px] uppercase tracking-mega text-muted">{item.k}</dt>
                  <dd className="mt-1 text-lg font-bold uppercase leading-none tracking-tightest tnum">
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t-3 border-dashed border-ink/25 pt-4">
              <BrutalButton variant="primary" icon={<Boxes strokeWidth={3} />}>
                RAISE RESTOCK TASK
              </BrutalButton>
              <BrutalButton variant="secondary" icon={<Scan strokeWidth={3} />}>
                TRIGGER RE-SCAN
              </BrutalButton>
            </div>
          </BrutalCard>

          <ChartCard
            title="FILL TREND VS STOCK-OUT RISK"
            subtitle="LAST 6 HOURS"
            footer={
              <ChartLegend
                items={[
                  { label: 'SHELF FILL %', tone: 'lime' },
                  { label: 'STOCK-OUT RISK %', tone: 'coral' },
                ]}
              />
            }
          >
            <BrutalChart
              data={fillSeries as unknown as Record<string, unknown>[]}
              height={252}
              unit="%"
              series={[
                { key: 'fill', name: 'shelf fill %', tone: 'lime', type: 'area', fillOpacity: 0.3 },
                { key: 'risk', name: 'stock-out risk %', tone: 'coral', dashed: true },
              ]}
            />
          </ChartCard>
        </Grid>

        <BrutalCard title="AISLE FILL RATE" subtitle="ALL MONITORED BAYS" padding="none">
          <ul>
            {SHELVES.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 border-b-3 border-ink/15 px-4 py-3 last:border-b-0"
              >
                <span className="w-[150px] shrink-0">
                  <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
                    {s.name}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted">
                    {s.aisle} · {s.units}/{s.capacity} UNITS
                  </span>
                </span>
                <SegmentBar
                  value={s.fill}
                  segments={24}
                  height="sm"
                  showValue
                  className="min-w-[200px] flex-1"
                  tone={SHELF_TONE[s.status]}
                />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-mega text-muted">
                  {s.hoursToStockOut === null ? 'STABLE' : `${s.hoursToStockOut}H COVER`}
                </span>
                <StatusBadge tone={SHELF_TONE[s.status]} size="sm" className="w-[80px] justify-center">
                  {s.status.toUpperCase()}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </BrutalCard>

        <SectionHeading
          index="STOCK"
          eyebrow="PRODUCT-LEVEL MONITORING"
          title="LOW-STOCK PRODUCTS"
          description="Facings counted per SKU. Hours of cover is computed from live sell-through, not from a nightly report."
          size="md"
          tone="coral"
        />

        <BrutalCard padding="none" shadow="md">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b-3 border-ink bg-ink/[0.04]">
                  {['SKU', 'PRODUCT', 'AISLE', 'FACINGS', 'ON SHELF', 'SELL-THROUGH', 'COVER', 'RISK'].map((h) => (
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
                {LOW_STOCK_PRODUCTS.map((p) => (
                  <tr key={p.sku} className="border-b-3 border-ink/15 last:border-b-0 hover:bg-yellow/15">
                    <td className="px-4 py-3 font-mono text-[10px] text-muted">{p.sku}</td>
                    <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-[10px] uppercase text-muted">{p.aisle}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'h-3 w-1.5 border-2 border-ink',
                              i < p.facings ? TONE_SOLID.blue : 'bg-transparent',
                            )}
                          />
                        ))}
                        <span className="ml-1 font-mono text-[10px] tnum">{p.facings}/8</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold tnum">{p.onShelf}</td>
                    <td className="px-4 py-3 font-mono text-[11px] tnum">{p.unitsPerHour}/hr</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'font-mono text-[11px] font-bold tnum',
                          p.hoursOfCover < 1 ? TONE_TEXT.coral : p.hoursOfCover < 3 ? TONE_TEXT.yellow : TONE_TEXT.lime,
                        )}
                      >
                        {p.hoursOfCover.toFixed(1)}H
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={p.risk === 'high' ? 'coral' : p.risk === 'medium' ? 'yellow' : 'lime'} size="sm">
                        {p.risk.toUpperCase()}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BrutalCard>

        <Grid cols={2}>
          <BrutalCard title="ZONE HEAT · SHELF PRESSURE" subtitle="HARD-STEPPED INTENSITY">
            <ul className="flex flex-col gap-4">
              {SHELVES.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      {s.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold tnum">{s.fill}%</span>
                  </div>
                  <HeatStrip value={s.fill} segments={18} />
                </li>
              ))}
            </ul>
          </BrutalCard>

          <Stack gap="sm">
            <SectionHeading
              index="RISK"
              eyebrow="PREDICTED"
              title="STOCK-OUT RISK"
              size="md"
              tone="coral"
              right={<AIBadge label="60 MIN HORIZON" />}
            />
            {PREDICTIONS.filter((p) => p.kind.includes('STOCK') || p.kind.includes('SHELF')).map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
            <BrutalLink to="/predictions" variant="secondary" iconRight={<ArrowRight strokeWidth={3} />}>
              ALL RISK FORECASTS
            </BrutalLink>
          </Stack>
        </Grid>
      </Stack>
    </Page>
  );
}

function ReportTile({
  tone,
  icon,
  label,
  value,
  detail,
  sticker,
}: {
  tone: Tone;
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  sticker: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-sm">
      <span className={cn('absolute inset-y-0 left-0 w-1.5 border-r-3 border-ink', TONE_SOLID[tone])} />
      <div className="pl-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className={cn('shrink-0', TONE_TEXT[tone])}>{icon}</span>
          <Sticker tone={tone}>{sticker}</Sticker>
        </div>
        <p className="mt-2.5 font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold uppercase leading-tight tracking-wide">{value}</p>
        <p className="mt-2 text-[11px] leading-snug text-muted">{detail}</p>
      </div>
    </div>
  );
}
