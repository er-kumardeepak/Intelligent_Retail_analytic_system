import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AIBadge, BrutalCard, RecommendationCard, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { PRIORITY_TONE, TONE_SOLID } from '@/lib/tone';
import { cn } from '@/lib/utils';
import type { Priority } from '@/lib/types';

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

export default function Recommendations() {
  const { recommendations, store } = useData();
  const [filter, setFilter] = useState<Priority | 'all'>('all');

  const counts = useMemo(() => {
    const base: Record<Priority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    recommendations.forEach((item) => {
      base[item.priority] += 1;
    });
    return base;
  }, [recommendations]);

  const list =
    filter === 'all' ? recommendations : recommendations.filter((item) => item.priority === filter);

  return (
    <Page
      index="05"
      eyebrow={store ? `${store.store_id} · DECISION ENGINE` : 'DECISION ENGINE'}
      title="Recommendations"
      description="Actions the rules engine suggests, each carrying the numbers that triggered it. Nothing here is a black box — the reason quotes the same thresholds the backend evaluated."
      tone="lime"
      actions={
        <>
          <AIBadge label="RULE ENGINE" />
          <StatusBadge tone="lime" size="lg" dot pulse={recommendations.length > 0}>
            {recommendations.length} OPEN
          </StatusBadge>
        </>
      }
    >
      <Stack gap="lg">
        {/* Priority tiles double as filters */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRIORITIES.map((priority) => {
            const active = filter === priority;
            return (
              <button
                key={priority}
                type="button"
                onClick={() => setFilter(active ? 'all' : priority)}
                aria-pressed={active}
                className={cn(
                  'relative overflow-hidden rounded-brutal border-3 border-ink bg-surface p-4 text-left transition-transform hover:-translate-y-[2px]',
                  active ? 'shadow-brutal' : 'shadow-brutal-xs',
                )}
              >
                <span
                  className={cn(
                    'absolute inset-x-0 top-0 h-1.5 border-b-3 border-ink',
                    TONE_SOLID[PRIORITY_TONE[priority]],
                  )}
                  aria-hidden="true"
                />
                <p className="pt-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
                  {priority} PRIORITY
                </p>
                <p className="mt-2 text-4xl font-bold leading-none tracking-tightest tnum">
                  {counts[priority]}
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {active ? 'FILTER ACTIVE — TAP TO CLEAR' : 'TAP TO FILTER'}
                </p>
              </button>
            );
          })}
        </div>

        <BlockHeading
          right={
            <span className="font-mono text-[10px] uppercase tracking-mega text-muted">
              SHOWING {list.length} OF {recommendations.length}
            </span>
          }
        >
          Action queue
        </BlockHeading>

        {list.length === 0 ? (
          <BrutalCard padding="lg" tone="lime">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-7 w-7" strokeWidth={2.8} />
              <p className="font-bold uppercase tracking-tightest">
                {recommendations.length === 0 ? 'Nothing to action' : 'No items in this band'}
              </p>
              <p className="max-w-lg font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                {recommendations.length === 0
                  ? 'The rules engine has not fired for this store yet. Post a queue_update or shelf event to the REST API to generate recommendations.'
                  : 'Clear the filter to see the rest of the queue.'}
              </p>
            </div>
          </BrutalCard>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {list.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        )}

        <Disclosure summary="Where these come from" hint="API NOTE">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
            Recommendations are produced by the backend's rule engine and returned inside the
            composite store overview payload, so this screen reads the same request the dashboard
            already polls. They are generated when an event crosses a threshold — queue depth,
            predicted congestion, shelf availability or a camera going offline.
          </p>
        </Disclosure>
      </Stack>
    </Page>
  );
}
