import type { Metric } from '@/lib/types';
import { BrutalCard, MetricCard, StatusBadge } from '@/components/brutal';
import { Stack } from '@/components/layout/Page';
import { CAMERAS, SHELVES } from '@/lib/mock-data';

const inventoryMetrics: Metric[] = [
  {
    id: 'shelves-monitored',
    label: 'Shelves Monitored',
    value: 9,
    trend: { value: 6, direction: 'up', good: true, label: 'vs last shift' },
    tone: 'blue',
    footnote: 'Across all monitored aisles',
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    value: 3,
    trend: { value: 12, direction: 'up', good: false, label: 'vs last hour' },
    tone: 'yellow',
    footnote: 'Below replenishment threshold',
  },
  {
    id: 'empty-shelves',
    label: 'Empty Shelves',
    value: 1,
    trend: { value: 4, direction: 'up', good: false, label: 'vs last hour' },
    tone: 'coral',
    footnote: 'Restock required immediately',
  },
  {
    id: 'replenishment-required',
    label: 'Replenishment Required',
    value: 5,
    trend: { value: 10, direction: 'up', good: true, label: 'due today' },
    tone: 'lime',
    footnote: 'Teams assigned to restock',
  },
];

const statusToneMap = {
  healthy: 'lime',
  low: 'yellow',
  critical: 'yellow',
  empty: 'coral',
} as const;

const statusLabelMap = {
  healthy: 'Normal',
  low: 'Low Stock',
  critical: 'Low Stock',
  empty: 'Empty',
} as const;

const actionLabelMap = {
  healthy: 'Monitor',
  low: 'Replenish',
  critical: 'Urgent',
  empty: 'Immediate',
} as const;

const distribution = [
  { label: 'Normal', count: 5, tone: 'lime' },
  { label: 'Low', count: 3, tone: 'yellow' },
  { label: 'Empty', count: 1, tone: 'coral' },
];

export default function InventoryAnalytics() {
  const maxDistribution = Math.max(...distribution.map((item) => item.count));

  return (
    <Stack gap="lg">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {inventoryMetrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={String(index + 1).padStart(2, '0')} emphasis />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <BrutalCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold uppercase tracking-tightest">Shelf Status Distribution</h2>
            <StatusBadge tone="ink" outline size="sm">
              Today
            </StatusBadge>
          </div>

          <div className="space-y-5">
            {distribution.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-mega text-muted">{item.label}</span>
                  <span className="font-bold uppercase tracking-wide">{item.count}</span>
                </div>
                <div className="h-3 overflow-hidden border-3 border-ink bg-paper">
                  <div
                    className={`h-full border-r-3 border-ink ${
                      item.tone === 'lime'
                        ? 'bg-lime'
                        : item.tone === 'yellow'
                          ? 'bg-yellow'
                          : 'bg-coral'
                    }`}
                    style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BrutalCard>

        <BrutalCard className="p-0">
          <div className="border-b-3 border-ink px-4 py-3">
            <h2 className="text-xl font-bold uppercase tracking-tightest">Inventory Table</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-paper">
                <tr className="border-b-3 border-ink font-mono text-[10px] uppercase tracking-mega text-muted">
                  <th className="px-4 py-3">Shelf</th>
                  <th className="px-4 py-3">Camera</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {SHELVES.slice(0, 6).map((shelf, index) => {
                  const color = statusToneMap[shelf.status];
                  const cameraLabel = CAMERAS[index % CAMERAS.length]?.name ?? 'Shelf Camera';
                  const confidence = Math.min(99, Math.max(68, Math.round((shelf.fill * 0.9) + 10)));

                  return (
                    <tr key={shelf.id} className="border-b-3 border-ink/20 last:border-b-0">
                      <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide">{shelf.name}</td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-mega text-muted">
                        {cameraLabel}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={color} size="sm">
                          {statusLabelMap[shelf.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
                        {confidence}%
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-mega text-muted">
                        {['2m ago', '5m ago', '9m ago', '12m ago', '18m ago', '24m ago'][index]}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide">{actionLabelMap[shelf.status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BrutalCard>
      </section>
    </Stack>
  );
}
