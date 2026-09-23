import type { Metric } from '@/lib/types';
import { AlertCard, BrutalCard, CameraFeed, MetricCard, StatusBadge } from '@/components/brutal';
import { Stack } from '@/components/layout/Page';
import { ALERTS, CAMERAS } from '@/lib/mock-data';

const overviewMetrics: Metric[] = [
  {
    id: 'current-customers',
    label: 'Current Customers',
    value: 128,
    trend: { value: 12, direction: 'up', good: true, label: 'vs 15 min ago' },
    tone: 'blue',
    footnote: 'Across all tracked entrances',
  },
  {
    id: 'footfall',
    label: "Today's Footfall",
    value: 2140,
    trend: { value: 18, direction: 'up', good: true, label: 'vs yesterday' },
    tone: 'lime',
    footnote: 'Daily store traffic so far',
  },
  {
    id: 'alerts',
    label: 'Active Alerts',
    value: 4,
    trend: { value: -25, direction: 'down', good: true, label: 'vs last hour' },
    tone: 'coral',
    footnote: '2 critical, 2 warnings',
  },
  {
    id: 'queue',
    label: 'Average Queue',
    value: 6,
    trend: { value: 9, direction: 'up', good: false, label: 'vs 15 min ago' },
    tone: 'yellow',
    footnote: 'Customers waiting at checkout',
  },
];

const cameraCards = [
  { label: 'Entrance Camera', camera: CAMERAS[0] },
  { label: 'Store Camera', camera: CAMERAS[1] },
  { label: 'Checkout Camera', camera: CAMERAS[2] },
  { label: 'Shelf Camera', camera: CAMERAS[3] },
];

export default function Overview() {
  const recentAlerts = ALERTS.filter((alert) => alert.level !== 'resolved').slice(0, 4);

  return (
    <Stack gap="lg">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={String(index + 1).padStart(2, '0')} emphasis />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase tracking-tightest md:text-2xl">Store Cameras</h2>
          <StatusBadge tone="lime" size="sm" dot>
            4 cameras online
          </StatusBadge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cameraCards.map(({ label, camera }) => (
            <BrutalCard key={label} className="overflow-hidden p-3" interactive>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-mega text-muted">Camera</p>
                  <p className="mt-1 text-base font-bold uppercase tracking-wide">{label}</p>
                </div>
                <StatusBadge tone={camera.status === 'online' ? 'lime' : 'yellow'} size="sm" dot>
                  {camera.status === 'online' ? 'Live' : 'Online'}
                </StatusBadge>
              </div>
              <CameraFeed
                camera={camera}
                queue={camera.id === 'CAM-03' ? 6 : 3}
                shelfFill={camera.id === 'CAM-04' ? 42 : 89}
                persons={12}
                compact
                className="border-0"
              />
            </BrutalCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase tracking-tightest md:text-2xl">Recent Alerts</h2>
          <span className="font-mono text-[10px] uppercase tracking-mega text-muted">Latest 4</span>
        </div>

        <div className="grid gap-3">
          {recentAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} compact />
          ))}
        </div>
      </section>
    </Stack>
  );
}
