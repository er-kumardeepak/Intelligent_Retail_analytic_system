import { useMemo, useState } from 'react';
import { BellRing, Filter, ShieldAlert, TriangleAlert } from 'lucide-react';
import { AlertCard, BrutalCard, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { LEVEL_LABEL, LEVEL_TONE, TONE_SOLID } from '@/lib/tone';
import { cn } from '@/lib/utils';
import type { AlertLevel } from '@/lib/types';

type FilterId = AlertLevel | 'all';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'critical', label: 'CRITICAL' },
  { id: 'warning', label: 'WARNING' },
  { id: 'info', label: 'INFO' },
  { id: 'resolved', label: 'RESOLVED' },
];

const SEVERITY_BANDS: { level: AlertLevel; rules: string[] }[] = [
  {
    level: 'critical',
    rules: ['EMPTY SHELF DETECTED', 'QUEUE ABOVE THRESHOLD', 'CONGESTION PREDICTED'],
  },
  {
    level: 'warning',
    rules: ['SHELF BELOW REORDER POINT', 'PREDICTED QUEUE ABOVE THRESHOLD'],
  },
  { level: 'info', rules: ['INFORMATIONAL DETECTIONS'] },
];

export default function Alerts() {
  const { alertItems, acknowledgeAlert, resolveAlert, store } = useData();
  const [filter, setFilter] = useState<FilterId>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<FilterId, number> = { all: alertItems.length, critical: 0, warning: 0, info: 0, resolved: 0 };
    alertItems.forEach((alert) => {
      base[alert.level] += 1;
    });
    return base;
  }, [alertItems]);

  const list = filter === 'all' ? alertItems : alertItems.filter((alert) => alert.level === filter);

  /** Acknowledge / resolve both go straight to the REST endpoints. */
  async function run(action: (id: string) => Promise<void>, id: string) {
    setActionError(null);
    try {
      await action(id);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Action failed.');
    }
  }

  const tiles = [
    { icon: TriangleAlert, label: 'TOTAL', value: counts.all, tone: 'blue' as const },
    { icon: BellRing, label: 'CRITICAL', value: counts.critical, tone: 'coral' as const },
    { icon: TriangleAlert, label: 'WARNING', value: counts.warning, tone: 'yellow' as const },
    { icon: ShieldAlert, label: 'RESOLVED', value: counts.resolved, tone: 'lime' as const },
  ];

  return (
    <Page
      index="04"
      eyebrow={store ? `${store.store_id} · ESCALATIONS` : 'ESCALATIONS'}
      title="Alerts"
      description="Detections that crossed an operational threshold. Acknowledge to claim ownership, resolve once the floor is back to normal — both write back to the backend."
      tone="coral"
      actions={
        <StatusBadge tone={counts.critical > 0 ? 'coral' : 'lime'} size="lg" dot pulse={counts.critical > 0}>
          {counts.all - counts.resolved} OPEN
        </StatusBadge>
      }
    >
      <Stack gap="lg">
        <Grid cols={4}>
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink', TONE_SOLID[tile.tone])}
                aria-hidden="true"
              />
              <tile.icon className="h-5 w-5 pt-1.5" strokeWidth={2.8} />
              <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                {tile.label}
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tracking-tightest tnum">{tile.value}</p>
            </div>
          ))}
        </Grid>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
            <Filter className="h-3.5 w-3.5" strokeWidth={3} />
            FILTER
          </span>
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                'press-sm inline-flex items-center gap-2 rounded-brutal border-3 border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega',
                filter === option.id ? 'bg-ink text-paper' : 'bg-surface text-muted',
              )}
            >
              {option.label}
              <span
                className={cn(
                  'border-2 border-ink px-1 font-mono text-[9px] tnum',
                  filter === option.id ? 'bg-lime text-ink' : 'bg-ink/[0.07]',
                )}
              >
                {counts[option.id]}
              </span>
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-mega text-muted">
            SHOWING {list.length}
          </span>
        </div>

        {actionError && (
          <p className="border-3 border-ink bg-coral px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
            {actionError}
          </p>
        )}

        {/* List */}
        <Stack gap="sm">
          <BlockHeading>Alert timeline</BlockHeading>

          {list.length === 0 ? (
            <BrutalCard padding="lg" tone="lime">
              <p className="text-center font-mono text-[11px] uppercase tracking-mega text-muted">
                Nothing in this band. The floor is clear.
              </p>
            </BrutalCard>
          ) : (
            <ul className="grid gap-3">
              {list.map((alert) => (
                <li key={alert.id}>
                  <AlertCard
                    alert={alert}
                    onAcknowledge={(id) => void run(acknowledgeAlert, id)}
                    onResolve={(id) => void run(resolveAlert, id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Stack>

        <Disclosure summary="What each severity means" hint="ESCALATION RULES">
          <ul className="grid gap-3 sm:grid-cols-3">
            {SEVERITY_BANDS.map((band) => (
              <li key={band.level} className="rounded-brutal border-3 border-ink p-3">
                <StatusBadge tone={LEVEL_TONE[band.level]} size="sm" dot pulse={band.level === 'critical'}>
                  {LEVEL_LABEL[band.level]}
                </StatusBadge>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {band.rules.map((rule) => (
                    <li
                      key={rule}
                      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted"
                    >
                      <span
                        className={cn('h-2 w-2 shrink-0 border-2 border-ink', TONE_SOLID[LEVEL_TONE[band.level]])}
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Disclosure>
      </Stack>
    </Page>
  );
}
