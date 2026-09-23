import { useMemo, useState } from 'react';
import { AlarmClock, BellRing, Check, Filter, ShieldAlert, TriangleAlert } from 'lucide-react';
import { cn, clock, relativeTime } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { LEVEL_LABEL, LEVEL_TONE, TONE_SOLID } from '@/lib/tone';
import type { AlertLevel } from '@/lib/types';
import {
  AlertCard,
  BrutalButton,
  BrutalCard,
  MetricRow,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { Page, Stack } from '@/components/layout/Page';

type FilterId = AlertLevel | 'all';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'critical', label: 'CRITICAL' },
  { id: 'warning', label: 'WARNING' },
  { id: 'info', label: 'INFO' },
  { id: 'resolved', label: 'RESOLVED' },
];

const ESCALATION = [
  {
    level: 'critical' as AlertLevel,
    title: 'CRITICAL',
    rules: ['EMPTY SHELF > 5 MIN', 'QUEUE WAIT > 5 MIN', 'CAMERA OFFLINE > 10 MIN'],
    sla: 'ACK 2 MIN · RESOLVE 15 MIN',
  },
  {
    level: 'warning' as AlertLevel,
    title: 'WARNING',
    rules: ['SHELF FILL < THRESHOLD', 'QUEUE DEPTH > 4', 'CAMERA LATENCY > 250 MS'],
    sla: 'ACK 10 MIN · RESOLVE 60 MIN',
  },
  {
    level: 'info' as AlertLevel,
    title: 'INFO',
    rules: ['FOOTFALL SPIKE > 20%', 'DWELL ANOMALY', 'POS BRIDGE RECONCILE'],
    sla: 'NO ACK REQUIRED',
  },
];

export default function Alerts() {
  const { alerts, acknowledge, resolve, clearNew, live } = useLive();
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<FilterId, number> = {
      all: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      resolved: 0,
    };
    alerts.forEach((a) => {
      base[a.level] += 1;
    });
    return base;
  }, [alerts]);

  const list = filter === 'all' ? alerts : alerts.filter((a) => a.level === filter);
  const selected = alerts.find((a) => a.id === selectedId) ?? list[0] ?? null;

  const resolutionRate = Math.round(
    (alerts.filter((a) => a.level === 'resolved' || a.acknowledged).length /
      Math.max(1, alerts.length)) *
      100,
  );

  return (
    <Page
      index="ALERTS"
      eyebrow="ESCALATED DETECTIONS"
      title="ALERT CENTER"
      description="Alerts are the events that crossed an operational threshold. Acknowledge to claim ownership, resolve once the floor is back to normal."
      tone="coral"
      actions={
        <>
          <StatusBadge tone={live ? 'coral' : 'yellow'} size="lg" dot pulse={live}>
            {live ? 'STREAMING' : 'PAUSED'}
          </StatusBadge>
          <BrutalButton variant="secondary" icon={<Check strokeWidth={3} />} onClick={clearNew}>
            CLEAR “NEW” FLAGS
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
            <Filter className="h-3.5 w-3.5" strokeWidth={3} />
            FILTER
          </span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'press-sm inline-flex items-center gap-2 rounded-brutal border-3 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega',
                filter === f.id ? 'bg-ink text-paper' : 'bg-surface text-muted',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'border-2 border-ink px-1 font-mono text-[9px] tnum',
                  filter === f.id ? 'bg-lime text-ink' : 'bg-ink/[0.07]',
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-mega text-muted">
            SHOWING {list.length} · ENGINE TICK {alerts.length}
          </span>
        </div>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: TriangleAlert, label: 'UNACKNOWLEDGED', value: alerts.filter((a) => !a.acknowledged).length, tone: 'coral' as const },
            { icon: BellRing, label: 'CRITICAL OPEN', value: counts.critical, tone: 'coral' as const },
            { icon: AlarmClock, label: 'WARNING OPEN', value: counts.warning, tone: 'yellow' as const },
            { icon: ShieldAlert, label: 'ACK / RESOLVE RATE', value: `${resolutionRate}%`, tone: 'lime' as const },
          ].map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <span className={cn('absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink', TONE_SOLID[s.tone])} />
              <s.icon className="h-5 w-5 pt-1.5" strokeWidth={2.8} />
              <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                {s.label}
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tracking-tightest tnum">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Timeline + detail */}
        <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Stack gap="sm">
            <SectionHeading
              index="TL"
              eyebrow="ALERT TIMELINE"
              title="LATEST FIRST"
              size="md"
              tone="coral"
            />
            <ol className="relative flex flex-col gap-4 border-l-3 border-ink pl-5">
              {list.map((a) => (
                <li key={a.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[30px] top-3 h-4 w-4 border-3 border-ink',
                      TONE_SOLID[LEVEL_TONE[a.level]],
                    )}
                    aria-hidden="true"
                  />
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-mega text-muted tnum">
                      {clock(a.at)} · {relativeTime(a.at)}
                    </span>
                    {a.isNew && (
                      <span className="-rotate-2 border-3 border-ink bg-ink px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-mega text-paper">
                        NEW
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      'w-full rounded-brutal border-3 border-ink bg-surface p-3 text-left transition-transform hover:-translate-y-[2px]',
                      selected?.id === a.id ? 'shadow-brutal' : 'shadow-brutal-xs',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={LEVEL_TONE[a.level]} size="sm">
                        {LEVEL_LABEL[a.level]}
                      </StatusBadge>
                      <span
                        className={cn(
                          'text-[13px] font-bold uppercase tracking-tightest',
                          a.level === 'resolved' && 'text-muted line-through decoration-2',
                        )}
                      >
                        {a.title}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {a.location} · {a.camera} · CONF {Math.round(a.confidence * 100)}%
                    </p>
                  </button>
                </li>
              ))}
              {list.length === 0 && (
                <li className="rounded-brutal border-3 border-dashed border-ink/40 p-6 text-center font-mono text-[11px] uppercase tracking-mega text-muted">
                  NO ALERTS IN THIS BAND
                </li>
              )}
            </ol>
          </Stack>

          <Stack gap="sm">
            {selected && (
              <BrutalCard
                title="ALERT DETAIL"
                subtitle={`${selected.camera} · ${clock(selected.at)}`}
                tone={LEVEL_TONE[selected.level]}
                padding="none"
                shadow="md"
              >
                <div className="p-4">
                  <AlertCard alert={selected} onAcknowledge={acknowledge} onResolve={resolve} />
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { k: 'DETECTION', v: selected.camera },
                      { k: 'LOCATION', v: selected.location },
                      { k: 'CONFIDENCE', v: `${Math.round(selected.confidence * 100)}%` },
                      { k: 'STATE', v: selected.acknowledged ? 'ACKNOWLEDGED' : 'UNACKNOWLEDGED' },
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
                </div>
              </BrutalCard>
            )}

            <BrutalCard title="ESCALATION RULES" subtitle="THRESHOLDS THAT CREATE ALERTS" padding="md">
              <ul className="flex flex-col gap-4">
                {ESCALATION.map((band) => (
                  <li key={band.level} className="rounded-brutal border-3 border-ink p-3">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone={LEVEL_TONE[band.level]} size="sm" dot pulse={band.level === 'critical'}>
                        {band.title}
                      </StatusBadge>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
                        {band.sla}
                      </span>
                    </div>
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {band.rules.map((rule) => (
                        <li
                          key={rule}
                          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted"
                        >
                          <span className={cn('h-2 w-2 shrink-0 border-2 border-ink', TONE_SOLID[LEVEL_TONE[band.level]])} />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </BrutalCard>

            <BrutalCard title="ALERT VOLUME BY BAND" subtitle="CURRENT SESSION" padding="md">
              <ul className="flex flex-col gap-3.5">
                {(['critical', 'warning', 'info', 'resolved'] as AlertLevel[]).map((lv) => (
                  <li key={lv}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        {LEVEL_LABEL[lv]}
                      </span>
                      <span className="font-mono text-[10px] tnum">{counts[lv]}</span>
                    </div>
                    <SegmentBar
                      value={(counts[lv] / Math.max(1, alerts.length)) * 100}
                      segments={18}
                      height="xs"
                      tone={LEVEL_TONE[lv]}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t-3 border-ink pt-3">
                <MetricRow
                  metric={{
                    id: 'ack',
                    label: 'MEDIAN ACK TIME',
                    value: 1.8,
                    unit: 'min',
                    precision: 1,
                    trend: { value: 12, direction: 'down', good: true, label: 'vs yesterday' },
                    tone: 'lime',
                    footnote: 'Target 2 min for critical alerts',
                  }}
                />
                <MetricRow
                  metric={{
                    id: 'res',
                    label: 'MEDIAN RESOLVE TIME',
                    value: 9.4,
                    unit: 'min',
                    precision: 1,
                    trend: { value: 4, direction: 'up', good: false, label: 'vs yesterday' },
                    tone: 'yellow',
                    footnote: 'Target 15 min for critical alerts',
                  }}
                />
              </div>
            </BrutalCard>
          </Stack>
        </section>
      </Stack>
    </Page>
  );
}
