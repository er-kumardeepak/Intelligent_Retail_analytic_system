import type { Metric } from '@/lib/types';
import { BrutalCard, CameraFeed, MetricCard, RecommendationCard, StatusBadge } from '@/components/brutal';
import { Stack } from '@/components/layout/Page';
import { CAMERAS, QUEUE_SERIES, RECOMMENDATIONS } from '@/lib/mock-data';

const queueMetrics: Metric[] = [
  {
    id: 'current-queue',
    label: 'Current Queue',
    value: 6,
    trend: { value: 14, direction: 'up', good: false, label: 'vs 15 min ago' },
    tone: 'blue',
    footnote: 'Customers waiting at checkout',
  },
  {
    id: 'average-wait-time',
    label: 'Average Wait Time',
    value: 5.2,
    unit: 'min',
    precision: 1,
    trend: { value: 7, direction: 'up', good: false, label: 'vs last 15 min' },
    tone: 'yellow',
    footnote: 'Estimated time in line',
  },
  {
    id: 'arrival-rate',
    label: 'Arrival Rate',
    value: 34,
    unit: '/min',
    trend: { value: 11, direction: 'up', good: true, label: 'vs baseline' },
    tone: 'lime',
    footnote: 'Customers entering the queue',
  },
  {
    id: 'service-rate',
    label: 'Service Rate',
    value: 24,
    unit: '/min',
    trend: { value: -6, direction: 'down', good: false, label: 'vs previous period' },
    tone: 'coral',
    footnote: 'Customers processed per minute',
  },
];

const queueChartData = QUEUE_SERIES.slice(0, 11);
const chartWidth = 760;
const chartHeight = 220;
const minQueue = Math.min(...queueChartData.map((point) => point.queue)) - 1;
const maxQueue = Math.max(...queueChartData.map((point) => point.queue)) + 1;
const stepX = chartWidth / (queueChartData.length - 1);

const points = queueChartData
  .map((point, index) => {
    const x = index * stepX;
    const y = chartHeight - ((point.queue - minQueue) / (maxQueue - minQueue || 1)) * (chartHeight - 28) - 16;
    return `${x},${y}`;
  })
  .join(' ');

const checkoutCamera = CAMERAS.find((camera) => camera.id === 'CAM-03') ?? CAMERAS[2];
const recommendation = RECOMMENDATIONS[0];

export default function QueueAnalytics() {
  return (
    <Stack gap="lg">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {queueMetrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={String(index + 1).padStart(2, '0')} emphasis />
        ))}
      </section>

      <BrutalCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase tracking-tightest">Queue Length Over Time</h2>
          <StatusBadge tone="lime" size="sm" dot>
            Live trend
          </StatusBadge>
        </div>

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-64 w-full" role="img" aria-label="Queue length over time chart">
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="0"
              x2={chartWidth}
              y1={22 + line * 48}
              y2={22 + line * 48}
              stroke="#111111"
              strokeOpacity="0.12"
              strokeDasharray="6 6"
            />
          ))}
          <polyline
            fill="none"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          {queueChartData.map((point, index) => {
            const x = index * stepX;
            const y = chartHeight - ((point.queue - minQueue) / (maxQueue - minQueue || 1)) * (chartHeight - 28) - 16;
            return <circle key={`${point.t}-${index}`} cx={x} cy={y} r="4" fill="#111111" />;
          })}
        </svg>
      </BrutalCard>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <BrutalCard className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-mega text-muted">Queue Prediction</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 border-b-3 border-dashed border-ink/25 pb-2">
              <span className="text-sm font-bold uppercase tracking-wide">Current Queue</span>
              <span className="text-3xl font-bold uppercase tracking-tightest">6</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b-3 border-dashed border-ink/25 pb-2">
              <span className="text-sm font-bold uppercase tracking-wide">Predicted Queue in 5 min</span>
              <span className="text-3xl font-bold uppercase tracking-tightest">10</span>
            </div>
            <StatusBadge tone="coral" size="md">
              Queue congestion predicted
            </StatusBadge>
          </div>
        </BrutalCard>

        <div className="space-y-4">
          <RecommendationCard recommendation={recommendation} />
          <p className="font-mono text-[10px] uppercase tracking-mega text-muted">
            Recommended Action: Consider opening another checkout counter.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase tracking-tightest md:text-2xl">Checkout Camera</h2>
          <StatusBadge tone="lime" size="sm" dot>
            Live feed
          </StatusBadge>
        </div>

        <CameraFeed camera={checkoutCamera} queue={6} shelfFill={80} persons={12} className="border-0" />
      </section>
    </Stack>
  );
}
