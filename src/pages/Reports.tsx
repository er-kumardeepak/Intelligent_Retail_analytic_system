import { useState } from 'react';
import { CalendarClock, Check, Download, FileSpreadsheet, FileText, Printer, Sparkles } from 'lucide-react';
import { cn, clock, relativeTime } from '@/lib/utils';
import { TONE_SOLID } from '@/lib/tone';
import { REPORTS } from '@/lib/mock-data';
import {
  AIBadge,
  BrutalButton,
  BrutalCard,
  ChartCard,
  ChartLegend,
  SectionHeading,
  StatusBadge,
} from '@/components/brutal';
import { BrutalChart } from '@/components/charts/BrutalChart';
import { DateFilterBar, Grid, Page, Stack } from '@/components/layout/Page';

const MODULES = [
  'FOOTFALL & DWELL',
  'QUEUE & WAIT TIME',
  'SHELF AVAILABILITY',
  'STOCK-OUT EVENTS',
  'AI PREDICTIONS',
  'AI RECOMMENDATIONS',
  'CAMERA HEALTH',
  'ANONYMOUS TRACKING AUDIT',
];

const SCHEDULES = [
  { name: 'DAILY STORE REPORT', when: 'EVERY DAY · 22:45', to: 'store-manager@retail.ai', tone: 'blue' as const, active: true },
  { name: 'WEEKLY PERFORMANCE', when: 'MONDAY · 07:00', to: 'ops-lead@retail.ai', tone: 'purple' as const, active: true },
  { name: 'STOCK-OUT ALERT DIGEST', when: 'EVERY 6 HOURS', to: 'floor-team@retail.ai', tone: 'coral' as const, active: true },
  { name: 'PRIVACY & COMPLIANCE', when: 'MONTHLY · 1ST', to: 'compliance@retail.ai', tone: 'ink' as const, active: false },
];

const EXPORTS = [
  { name: 'DAILY_STORE_REPORT_18SEP.pdf', type: 'PDF', size: '2.4 MB', at: clock(new Date(Date.now() - 24 * 60_000)) },
  { name: 'stockout_events_7d.csv', type: 'CSV', size: '418 KB', at: clock(new Date(Date.now() - 62 * 60_000)) },
  { name: 'queue_sla_last30.csv', type: 'CSV', size: '1.1 MB', at: clock(new Date(Date.now() - 190 * 60_000)) },
  { name: 'weekly_performance_w38.pdf', type: 'PDF', size: '5.8 MB', at: clock(new Date(Date.now() - 620 * 60_000)) },
  { name: 'recommendation_impact_30d.pdf', type: 'PDF', size: '3.2 MB', at: clock(new Date(Date.now() - 1400 * 60_000)) },
];

const GENERATION_VOLUME = [
  { t: 'W34', generated: 42, exported: 31 },
  { t: 'W35', generated: 48, exported: 37 },
  { t: 'W36', generated: 51, exported: 44 },
  { t: 'W37', generated: 58, exported: 49 },
  { t: 'W38', generated: 64, exported: 52 },
];

export default function Reports() {
  const [selected, setSelected] = useState<string[]>(MODULES.slice(0, 5));

  const toggle = (m: string) =>
    setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <Page
      index="REPORTS"
      eyebrow="EXPORTS & SCHEDULES"
      title="REPORTS"
      description="Everything the platform observes can leave the system as a document your team already knows how to read. PDF for management, CSV for the analysts."
      tone="blue"
      actions={
        <>
          <StatusBadge tone="blue" size="lg">
            {REPORTS.length} TEMPLATES
          </StatusBadge>
          <BrutalButton variant="primary" icon={<Sparkles strokeWidth={3} />}>
            GENERATE REPORT
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        {/* Builder */}
        <Grid cols={2}>
          <BrutalCard title="REPORT BUILDER" subtitle="PICK MODULES AND A WINDOW" tone="blue" padding="md">
            <div className="mb-4">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
                DATE RANGE
              </p>
              <DateFilterBar />
            </div>

            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
              MODULES ({selected.length}/{MODULES.length})
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {MODULES.map((m) => {
                const on = selected.includes(m);
                return (
                  <li key={m}>
                    <button
                      type="button"
                      onClick={() => toggle(m)}
                      aria-pressed={on}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-brutal border-3 border-ink px-2.5 py-2 text-left transition-transform hover:-translate-y-[1px]',
                        on ? 'bg-lime text-ink' : 'bg-surface text-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center border-3 border-ink',
                          on ? 'bg-ink' : 'bg-surface',
                        )}
                      >
                        {on && <Check className="h-2.5 w-2.5 text-lime" strokeWidth={4} />}
                      </span>
                      <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                        {m}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t-3 border-dashed border-ink/25 pt-4">
              <BrutalButton variant="primary" icon={<Sparkles strokeWidth={3} />}>
                GENERATE REPORT
              </BrutalButton>
              <BrutalButton variant="secondary" icon={<FileText strokeWidth={3} />}>
                EXPORT PDF
              </BrutalButton>
              <BrutalButton variant="secondary" icon={<FileSpreadsheet strokeWidth={3} />}>
                EXPORT CSV
              </BrutalButton>
              <BrutalButton variant="ghost" icon={<Printer strokeWidth={3} />}>
                PRINT
              </BrutalButton>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
              GENERATION RUNS ON THE EDGE AND TYPICALLY COMPLETES IN UNDER 8 SECONDS. NO CUSTOMER
              IMAGERY IS INCLUDED IN ANY EXPORT.
            </p>
          </BrutalCard>

          <ChartCard
            title="REPORT VOLUME"
            subtitle="GENERATED VS EXPORTED · LAST 5 WEEKS"
            footer={
              <ChartLegend
                items={[
                  { label: 'GENERATED', tone: 'blue' },
                  { label: 'EXPORTED', tone: 'lime' },
                ]}
              />
            }
          >
            <BrutalChart
              data={GENERATION_VOLUME as unknown as Record<string, unknown>[]}
              height={320}
              series={[
                { key: 'generated', name: 'generated', tone: 'blue', type: 'bar', barSize: 24 },
                { key: 'exported', name: 'exported', tone: 'lime', type: 'bar', barSize: 24 },
              ]}
            />
          </ChartCard>
        </Grid>

        {/* Templates */}
        <SectionHeading
          index="TPL"
          eyebrow="REPORT LIBRARY"
          title="AVAILABLE REPORTS"
          description="Each template maps to a set of modules, a schedule and an audience. Export in the format the reader actually uses."
          size="md"
          tone="blue"
        />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((r) => (
            <BrutalCard
              key={r.id}
              tone={r.tone}
              padding="none"
              interactive
              shadow="sm"
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="h-6 w-6 shrink-0" strokeWidth={2.6} />
                  <StatusBadge tone={r.tone} size="sm">
                    {r.pages} PAGES
                  </StatusBadge>
                </div>

                <h3 className="text-lg font-bold uppercase leading-none tracking-tightest">
                  {r.title}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {r.period}
                </p>
                <p className="text-[12px] leading-snug text-muted">{r.description}</p>

                <p className="mt-auto border-t-3 border-dashed border-ink/25 pt-2.5 font-mono text-[9px] uppercase tracking-wider text-muted">
                  UPDATED {relativeTime(r.updatedAt)}
                </p>

                <div className="flex flex-wrap gap-2">
                  <BrutalButton variant="primary" size="sm">
                    GENERATE
                  </BrutalButton>
                  <BrutalButton variant="secondary" size="sm" icon={<Download strokeWidth={3} />}>
                    PDF
                  </BrutalButton>
                  <BrutalButton variant="secondary" size="sm" icon={<FileSpreadsheet strokeWidth={3} />}>
                    CSV
                  </BrutalButton>
                </div>
              </div>
            </BrutalCard>
          ))}
        </section>

        {/* Schedules + history */}
        <Grid cols={2}>
          <BrutalCard title="SCHEDULED REPORTS" subtitle="DELIVERED AUTOMATICALLY" padding="none">
            <ul>
              {SCHEDULES.map((s) => (
                <li
                  key={s.name}
                  className="flex flex-wrap items-center gap-3 border-b-3 border-ink/15 px-4 py-3.5 last:border-b-0"
                >
                  <span className={cn('h-3.5 w-3.5 shrink-0 border-2 border-ink', TONE_SOLID[s.tone])} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
                      {s.name}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted">
                      <CalendarClock className="h-3 w-3" strokeWidth={3} />
                      {s.when} · {s.to}
                    </span>
                  </span>
                  <StatusBadge tone={s.active ? 'lime' : 'ink'} size="sm" outline={!s.active}>
                    {s.active ? 'ACTIVE' : 'PAUSED'}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </BrutalCard>

          <BrutalCard title="RECENT EXPORTS" subtitle="LAST 24 HOURS" padding="none">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[460px] border-collapse">
                <thead>
                  <tr className="border-b-3 border-ink bg-ink/[0.04]">
                    {['FILE', 'TYPE', 'SIZE', 'TIME'].map((h) => (
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
                  {EXPORTS.map((e) => (
                    <tr key={e.name} className="border-b-3 border-ink/15 last:border-b-0 hover:bg-blue/10">
                      <td className="max-w-[220px] truncate px-4 py-2.5 font-mono text-[10px]">
                        {e.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={e.type === 'PDF' ? 'coral' : 'lime'} size="sm">
                          {e.type}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted tnum">{e.size}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted tnum">{e.at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BrutalCard>
        </Grid>

        <BrutalCard tone="purple" padding="lg">
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[240px] flex-1">
              <AIBadge label="AUTO INSIGHT" />
              <h3 className="mt-3 text-2xl font-bold uppercase leading-none tracking-tightest">
                THIS WEEK IN ONE PARAGRAPH
              </h3>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">
                Footfall rose 8.4% week-over-week, driven by the Saturday evening peak. Shelf fill
                slipped 2.2 points, concentrated in DAIRY and PRODUCE, and stock-out events reached
                12 on Saturday. Queue SLA held at 96% compliance after CHECKOUT 03 was activated
                automatically at 17:42.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
              {[
                { k: 'FOOTFALL', v: '+8.4%' },
                { k: 'SHELF FILL', v: '−2.2%' },
                { k: 'SLA MET', v: '96%' },
              ].map((s) => (
                <div key={s.k} className="rounded-brutal border-3 border-ink bg-surface p-3 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-mega text-muted">{s.k}</p>
                  <p className="mt-1 text-2xl font-bold leading-none tracking-tightest tnum">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </BrutalCard>
      </Stack>
    </Page>
  );
}
