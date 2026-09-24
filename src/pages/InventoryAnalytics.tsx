import { Boxes, PackageX, TriangleAlert } from 'lucide-react';
import { BrutalCard, SegmentBar, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { useAppState } from '@/lib/app-state';
import { TONE_SOLID } from '@/lib/tone';
import type { ApiShelfStatus } from '@/lib/api';
import { cn, clock, relativeTime } from '@/lib/utils';
import type { Tone } from '@/lib/types';

const STATUS_TONE: Record<ApiShelfStatus, Tone> = {
  normal: 'lime',
  low: 'yellow',
  empty: 'coral',
  unknown: 'blue',
};

const STATUS_LABEL: Record<ApiShelfStatus, string> = {
  normal: 'NORMAL',
  low: 'LOW',
  empty: 'EMPTY',
  unknown: 'UNKNOWN',
};

const ACTION_LABEL: Record<ApiShelfStatus, string> = {
  normal: 'Monitor',
  low: 'Replenish',
  empty: 'Restock now',
  unknown: 'Recalibrate',
};

export default function InventoryAnalytics() {
  const { overview, store } = useData();
  const { dateFilter } = useAppState();
  const shelves = overview?.shelves;

  if (!shelves) {
    return null;
  }

  const needingAttention = shelves.low + shelves.empty;
  const bays = shelves.items ?? [];

  const tiles = [
    { label: 'MONITORED BAYS', value: shelves.total_shelves, tone: 'blue' as Tone, icon: Boxes },
    { label: 'NORMAL', value: shelves.normal, tone: 'lime' as Tone, icon: Boxes },
    { label: 'LOW STOCK', value: shelves.low, tone: 'yellow' as Tone, icon: TriangleAlert },
    { label: 'EMPTY', value: shelves.empty, tone: 'coral' as Tone, icon: PackageX },
  ];

  return (
    <Page
      index="02"
      eyebrow={store ? `${store.store_id} · SHELF VISION` : 'SHELF VISION'}
      title="Inventory Analytics"
      description="Availability per shelf bay, as reported by the vision pipeline. Confidence is the model's certainty for the latest detection on that bay."
      tone="yellow"
      actions={
        <StatusBadge tone={needingAttention > 0 ? 'coral' : 'lime'} size="lg" dot>
          {needingAttention} NEED ATTENTION
        </StatusBadge>
      }
    >
      <Stack gap="lg">
        {/* Status tiles */}
        <Grid cols={4}>
          {tiles.map((tile) => (
            <BrutalCard key={tile.label} tone={tile.tone} padding="none" interactive>
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-mega text-muted">
                    {tile.label}
                  </p>
                  <p className="mt-2 text-5xl font-bold leading-none tracking-tightest tnum">
                    {tile.value}
                  </p>
                </div>
                <tile.icon className="h-5 w-5 shrink-0" strokeWidth={2.8} />
              </div>
            </BrutalCard>
          ))}
        </Grid>

        {/* Availability */}
        <BrutalCard
          title="Shelf availability"
          subtitle={`${dateFilter} · share of bays at normal stock`}
          right={
            <span className="text-3xl font-bold leading-none tracking-tightest tnum">
              {shelves.availability_percentage.toFixed(1)}%
            </span>
          }
          padding="md"
        >
          <SegmentBar
            value={shelves.availability_percentage}
            segments={28}
            height="md"
            tone={shelves.availability_percentage >= 80 ? 'lime' : shelves.availability_percentage >= 60 ? 'yellow' : 'coral'}
          />
          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
            {shelves.shelves_needing_attention} of {shelves.total_shelves} bays need attention
            {shelves.unknown > 0 && ` · ${shelves.unknown} bay(s) awaiting a detection`}
          </p>
        </BrutalCard>

        {/* Bay table */}
        <Stack gap="sm">
          <BlockHeading right={<span className="font-mono text-[10px] uppercase tracking-mega text-muted">{bays.length} BAYS</span>}>
            Bay-by-bay status
          </BlockHeading>

          {bays.length === 0 ? (
            <BrutalCard padding="lg">
              <p className="text-center font-mono text-[11px] uppercase tracking-mega text-muted">
                No shelf bays have reported for this store yet.
              </p>
            </BrutalCard>
          ) : (
            <BrutalCard padding="none">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-paper">
                    <tr className="border-b-3 border-ink font-mono text-[10px] uppercase tracking-mega text-muted">
                      <th className="px-4 py-3">Bay</th>
                      <th className="px-4 py-3">Camera</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Last detection</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bays.map((bay) => (
                      <tr key={bay.shelf_id} className="border-b-3 border-ink/15 last:border-b-0">
                        <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide">
                          {bay.shelf_id}
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-mega text-muted">
                          {bay.camera_id}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={STATUS_TONE[bay.status]} size="sm">
                            {STATUS_LABEL[bay.status]}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-14 border-2 border-ink">
                              <span
                                className={cn('h-full', TONE_SOLID[STATUS_TONE[bay.status]])}
                                style={{ width: `${Math.round(bay.confidence * 100)}%` }}
                              />
                            </span>
                            <span className="font-mono text-[10px] font-bold tnum">
                              {Math.round(bay.confidence * 100)}%
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted"
                          title={clock(bay.last_detected)}
                        >
                          {relativeTime(bay.last_detected)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide">
                          {ACTION_LABEL[bay.status]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BrutalCard>
          )}
          <Disclosure summary="How to read these rows" hint="STATUS BANDS">
            <ul className="flex flex-col gap-2 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
              <li>NORMAL — stock on the bay is above the store threshold.</li>
              <li>LOW — below threshold, replenish soon. EMPTY needs an immediate restock.</li>
              <li>UNKNOWN — the pipeline has not reported a state for this bay yet.</li>
              <li>CONFIDENCE — the vision model's certainty for that bay's latest detection.</li>
            </ul>
          </Disclosure>
        </Stack>
      </Stack>
    </Page>
  );
}
