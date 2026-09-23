import { Brain, Cpu, Database, GitBranch, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOOTFALL_FORECAST, PREDICTIONS } from '@/lib/mock-data';
import { RISK_TONE, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { RiskLevel } from '@/lib/types';
import {
  AIBadge,
  BrutalCard,
  ChartCard,
  ChartLegend,
  PredictionCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { Grid, Page, Stack } from '@/components/layout/Page';

/* Likelihood × impact matrix. Rows = impact, columns = likelihood. */
const MATRIX_ROWS: { impact: RiskLevel; label: string }[] = [
  { impact: 'high', label: 'HIGH IMPACT' },
  { impact: 'medium', label: 'MEDIUM IMPACT' },
  { impact: 'low', label: 'LOW IMPACT' },
];
const MATRIX_COLS: { likelihood: RiskLevel; label: string }[] = [
  { likelihood: 'low', label: 'UNLIKELY' },
  { likelihood: 'medium', label: 'POSSIBLE' },
  { likelihood: 'high', label: 'LIKELY' },
];

function cellTone(impact: RiskLevel, likelihood: RiskLevel) {
  const score =
    (impact === 'high' ? 3 : impact === 'medium' ? 2 : 1) *
    (likelihood === 'high' ? 3 : likelihood === 'medium' ? 2 : 1);
  if (score >= 6) return 'coral' as const;
  if (score >= 3) return 'yellow' as const;
  return 'lime' as const;
}

function predictionsFor(impact: RiskLevel, likelihood: RiskLevel) {
  return PREDICTIONS.filter((p) => {
    const imp: RiskLevel = p.level === 'high' ? 'high' : p.level === 'medium' ? 'medium' : 'low';
    const lik: RiskLevel =
      p.confidence >= 0.85 ? 'high' : p.confidence >= 0.7 ? 'medium' : 'low';
    return imp === impact && lik === likelihood;
  });
}

export default function Predictions() {
  const highRisk = PREDICTIONS.filter((p) => p.level === 'high').length;
  const avgConfidence =
    PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / PREDICTIONS.length;

  const forecastData = [
    { t: '18:30', actual: 124, forecast: 122, band: 128, low: 116 },
    ...FOOTFALL_FORECAST.map((f) => ({
      t: f.t,
      actual: f.actual,
      forecast: f.forecast,
      band: f.upper,
      low: f.lower,
    })),
  ] as unknown as Record<string, unknown>[];

  return (
    <Page
      index="PREDICT"
      eyebrow="FORECAST & RISK ENGINE"
      title="THE SYSTEM SEES WHAT'S NEXT."
      description="Forecasts are produced on the edge from the live event stream: shelf depletion curves, queue pressure, footfall shape and restock windows. Every forecast publishes its own confidence."
      tone="purple"
      actions={
        <>
          <AIBadge label="60 MIN HORIZON" />
          <StatusBadge tone="purple" size="lg" dot pulse>
            {highRisk} HIGH-RISK ITEMS
          </StatusBadge>
        </>
      }
    >
      <Stack gap="lg">
        {/* Summary strip */}
        <BrutalCard tone="purple" padding="lg" shadow="md">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <AIBadge label="EDGE INFERENCE · YOLO v8n" />
                <StatusBadge tone="blue" size="sm">
                  AVG CONFIDENCE {Math.round(avgConfidence * 100)}%
                </StatusBadge>
              </div>
              <h2 className="mt-4 text-3xl font-bold uppercase leading-[0.9] tracking-tightest md:text-4xl">
                PREDICTION, NOT
                <br />
                <span className="text-stroke-ink">HINDSIGHT.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                Shelf depletion is extrapolated from measured facings over time. Queue pressure uses
                the observed arrival rate and lane throughput. Footfall shape is learned from the
                store's own history — no cloud dependency, no third-party model.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Brain, label: 'MODEL', value: 'RETAIL-SHELF v3.4' },
                { icon: Cpu, label: 'INFERENCE', value: 'JETSON · 41 MS' },
                { icon: Database, label: 'TRAINING DATA', value: '90 DAYS · 2.1M EVENTS' },
                { icon: Target, label: 'HORIZON', value: '15 / 30 / 60 MIN' },
              ].map((item) => (
                <div key={item.label} className="rounded-brutal border-3 border-ink bg-surface p-3">
                  <item.icon className="h-4 w-4" strokeWidth={2.8} />
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-mega text-muted">
                    {item.label}
                  </p>
                  <p className="text-[11px] font-bold uppercase leading-tight tracking-wide">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </BrutalCard>

        {/* All predictions */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PREDICTIONS.map((p) => (
            <PredictionCard key={p.id} prediction={p} />
          ))}
        </section>

        {/* Forecast chart + matrix */}
        <Grid cols={2}>
          <ChartCard
            title="FOOTFALL FORECAST"
            subtitle="ACTUAL VS PREDICTED · 95% CONFIDENCE BAND"
            tone="purple"
            footer={
              <ChartLegend
                items={[
                  { label: 'ACTUAL', tone: 'blue' },
                  { label: 'FORECAST', tone: 'purple' },
                  { label: 'UPPER BAND', tone: 'ink' },
                ]}
              />
            }
          >
            <BrutalChart
              data={forecastData}
              height={300}
              referenceX="19:00"
              referenceLabel="NOW"
              series={[
                { key: 'band', name: 'upper band', tone: 'ink', type: 'area', fillOpacity: 0.09 },
                { key: 'forecast', name: 'forecast', tone: 'purple', dashed: true },
                { key: 'actual', name: 'actual', tone: 'blue' },
              ]}
            />
          </ChartCard>

          <BrutalCard
            title="RISK MATRIX"
            subtitle="LIKELIHOOD × OPERATIONAL IMPACT"
            right={<StatusBadge tone="purple" size="sm">6 OPEN FORECASTS</StatusBadge>}
          >
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[440px] border-collapse">
                <thead>
                  <tr>
                    <th />
                    {MATRIX_COLS.map((c) => (
                      <th
                        key={c.likelihood}
                        className="border-b-3 border-ink pb-2 font-mono text-[9px] font-bold uppercase tracking-mega text-muted"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((r) => (
                    <tr key={r.impact}>
                      <th className="border-r-3 border-ink pr-2 text-right font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                        {r.label}
                      </th>
                      {MATRIX_COLS.map((c) => {
                        const tone = cellTone(r.impact, c.likelihood);
                        const items = predictionsFor(r.impact, c.likelihood);
                        return (
                          <td key={c.likelihood} className="p-1 align-top">
                            <div
                              className={cn(
                                'min-h-[84px] rounded-brutal border-3 border-ink p-2',
                                TONE_SOLID[tone],
                              )}
                              style={{ opacity: tone === 'lime' ? 0.55 : 0.95 }}
                            >
                              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink">
                                {tone === 'coral' ? 'ACT NOW' : tone === 'yellow' ? 'MONITOR' : 'LOW'}
                              </p>
                              <ul className="mt-1.5 flex flex-col gap-1">
                                {items.map((p) => (
                                  <li
                                    key={p.id}
                                    className="truncate rounded-[3px] border-2 border-ink bg-surface px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink"
                                    title={p.subject}
                                  >
                                    {p.kind}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BrutalCard>
        </Grid>

        {/* Confidence + drivers */}
        <Grid cols={2}>
          <BrutalCard title="CONFIDENCE BY FORECAST" subtitle="MODEL OUTPUT · CURRENT TICK" padding="none">
            <ul>
              {[...PREDICTIONS]
                .sort((a, b) => b.confidence - a.confidence)
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 border-b-3 border-ink/15 px-4 py-3 last:border-b-0"
                  >
                    <span className="min-w-[160px] flex-1">
                      <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
                        {p.kind}
                      </span>
                      <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted">
                        {p.subject} · {p.eta}
                      </span>
                    </span>
                    <SegmentBar
                      value={Math.round(p.confidence * 100)}
                      segments={16}
                      height="xs"
                      tone={RISK_TONE[p.level]}
                      className="min-w-[140px] flex-1"
                    />
                    <span className="shrink-0 font-mono text-[11px] font-bold tnum">
                      {Math.round(p.confidence * 100)}%
                    </span>
                    <StatusBadge tone={RISK_TONE[p.level]} size="sm" className="w-[70px] justify-center">
                      {p.level.toUpperCase()}
                    </StatusBadge>
                  </li>
                ))}
            </ul>
          </BrutalCard>

          <BrutalCard title="WHAT DRIVES THE FORECAST" subtitle="FEATURE IMPORTANCE · LAST RETRAIN">
            <ul className="flex flex-col gap-4">
              {[
                { label: 'SHELF FACINGS OVER TIME', value: 94 },
                { label: 'HOUR-OF-DAY FOOTFALL SHAPE', value: 87 },
                { label: 'POS SELL-THROUGH RATE', value: 82 },
                { label: 'QUEUE ARRIVAL RATE', value: 74 },
                { label: 'ZONE DWELL DISTRIBUTION', value: 61 },
                { label: 'DAY-OF-WEEK PATTERN', value: 58 },
                { label: 'BASKET SIZE TREND', value: 44 },
              ].map((f) => (
                <li key={f.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                      {f.label}
                    </span>
                    <span className="font-mono text-[10px] tnum">{f.value}</span>
                  </div>
                  <SegmentBar value={f.value} segments={20} height="xs" tone="purple" />
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-3 border-t-3 border-dashed border-ink/25 pt-4">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-purple" strokeWidth={2.8} />
              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                MODELS RETRAIN NIGHTLY ON THE EDGE DEVICE USING THE STORE'S OWN EVENT HISTORY. NO
                CUSTOMER IMAGERY EVER ENTERS TRAINING.
              </p>
            </div>
          </BrutalCard>
        </Grid>

        <SectionHeading
          index="NEXT"
          eyebrow="OPERATIONAL TRANSLATION"
          title="FROM FORECAST TO INSTRUCTION"
          description="A forecast nobody acts on is a dashboard toy. Each prediction above converts into a written action with an owner and a deadline."
          size="md"
          tone="lime"
        />

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              tone: 'coral' as const,
              icon: TrendingUp,
              title: 'STOCK-OUT RISK HIGH',
              body: 'Beverages bay empties in ~45 min. Restock now, before the 19:00 peak.',
            },
            {
              tone: 'yellow' as const,
              icon: Target,
              title: 'CONGESTION RISK MEDIUM',
              body: 'Three lanes saturate in ~15 min. Open CHECKOUT 03 pre-emptively.',
            },
            {
              tone: 'blue' as const,
              icon: Cpu,
              title: 'FOOTFALL +18% AT 18:00',
              body: 'Move one associate to the entrance for trolley handling.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <c.icon className={cn('h-5 w-5', TONE_TEXT[c.tone])} strokeWidth={2.8} />
              <p className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
                {c.title}
              </p>
              <p className="mt-1.5 text-[12px] leading-snug">{c.body}</p>
            </div>
          ))}
        </div>
      </Stack>
    </Page>
  );
}
