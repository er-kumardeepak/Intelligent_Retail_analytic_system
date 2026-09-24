import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react';
import { AlertLine, BrutalCard, MetricCard, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { CAMERA_TONE, TONE_SOLID } from '@/lib/tone';
import { cn } from '@/lib/utils';
import type { ApiCameraStatus } from '@/lib/api';

const CAMERA_ORDER: ApiCameraStatus[] = ['online', 'warning', 'offline'];
const CAMERA_LABEL: Record<ApiCameraStatus, string> = {
  online: 'ONLINE',
  warning: 'DEGRADED',
  offline: 'OFFLINE',
};

export default function Overview() {
  const { store, kpis, alertItems, cameras, overview, lastUpdated } = useData();

  const activeAlerts = alertItems.filter((alert) => alert.level !== 'resolved').slice(0, 5);
  const counts = CAMERA_ORDER.map((status) => ({
    status,
    count: cameras.filter((camera) => camera.status === status).length,
  }));
  const attention = counts
    .filter((item) => item.status !== 'online' && item.count > 0)
    .map((item) => `${item.count} ${CAMERA_LABEL[item.status].toLowerCase()}`)
    .join(' · ');

  return (
    <Page
      index="01"
      eyebrow={store ? `${store.store_id} · ${store.city}` : 'STORE PULSE'}
      title="Overview"
      description="A live picture of the active store. Everything here is read from the backend REST API and refreshed on a timer — no simulated data."
      tone="blue"
      actions={
        overview && (
          <StatusBadge tone="blue" size="lg" outline>
            {overview.cameras_online}/{overview.cameras_total} CAMERAS ONLINE
          </StatusBadge>
        )
      }
    >
      <Stack gap="lg">
        {/* Headline numbers */}
        <Grid cols={4}>
          {kpis.map((metric, index) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              index={String(index + 1).padStart(2, '0')}
              emphasis
            />
          ))}
        </Grid>

        {/* Needs attention */}
        <Stack gap="sm">
          <BlockHeading
            right={
              <Link
                to="/alerts"
                className="press-sm flex items-center gap-1.5 rounded-brutal border-3 border-ink bg-surface px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega hover:bg-yellow"
              >
                ALL ALERTS
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
              </Link>
            }
          >
            Needs attention
          </BlockHeading>

          <BrutalCard padding="none" tone={activeAlerts.length > 0 ? 'coral' : 'lime'}>
            {activeAlerts.length > 0 ? (
              <ul className="divide-y-3 divide-ink/15">
                {activeAlerts.map((alert) => (
                  <li key={alert.id}>
                    <AlertLine alert={alert} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 p-5">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-lime" strokeWidth={3} />
                <div>
                  <p className="font-bold uppercase tracking-tightest">All clear</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                    No active alerts in this store
                  </p>
                </div>
              </div>
            )}
          </BrutalCard>
        </Stack>

        {/* Camera fleet */}
        <Stack gap="sm">
          <BlockHeading
            right={
              <span className="font-mono text-[10px] uppercase tracking-mega text-muted">
                {attention || 'FULL COVERAGE'}
              </span>
            }
          >
            Camera fleet
          </BlockHeading>

          <div className="grid gap-3 sm:grid-cols-3">
            {counts.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-3 rounded-brutal border-3 border-ink bg-surface p-3 shadow-brutal-xs"
              >
                <span
                  className={cn(
                    'h-8 w-2 shrink-0 border-2 border-ink',
                    TONE_SOLID[CAMERA_TONE[item.status]],
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                    {CAMERA_LABEL[item.status]}
                  </p>
                  <p className="text-2xl font-bold leading-none tracking-tightest tnum">
                    {item.count}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary detail stays collapsed until asked for. */}
          <Disclosure summary="Camera-by-camera health" hint={`${cameras.length} enrolled`}>
            {cameras.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cameras.map((camera) => (
                  <li
                    key={camera.camera_id}
                    className="flex items-center justify-between gap-3 rounded-brutal border-3 border-ink/20 bg-ink/[0.02] px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold uppercase tracking-wide">
                        {camera.camera_id} · {camera.name}
                      </span>
                      <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted">
                        {camera.zone}
                      </span>
                    </span>
                    <StatusBadge tone={CAMERA_TONE[camera.status]} size="sm">
                      {CAMERA_LABEL[camera.status]}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                No cameras enrolled for this store.
              </p>
            )}
          </Disclosure>
        </Stack>

        {lastUpdated && (
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-mega text-muted">
            <TriangleAlert className="h-3.5 w-3.5" strokeWidth={3} />
            Data polled from the REST API · refreshed every 5 seconds
          </p>
        )}
      </Stack>
    </Page>
  );
}
