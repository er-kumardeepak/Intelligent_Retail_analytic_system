/* ============================================================
   RETAIL//AI — REST data layer
   Polls the FastAPI backend and adapts its documents into the
   view models the components already consume.

   Deliberately no WebSockets and no invented fields: if the
   backend does not send it, the UI does not show it.
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  type ApiAlert,
  type ApiAlertType,
  type ApiCamera,
  type ApiOverview,
  type ApiRecommendation,
  type ApiStore,
} from './api';
import { PRIORITY_TONE } from './tone';
import type { AlertItem, AlertLevel, Metric, Priority, Recommendation } from './types';

/** How often the dashboard re-reads the REST endpoints. */
export const POLL_MS = 5000;

/* ------------------------------------------------------------
   Adapters: backend document -> component view model
   ------------------------------------------------------------ */

const ALERT_TITLES: Record<ApiAlertType, string> = {
  shelf_empty: 'EMPTY SHELF',
  shelf_low: 'LOW STOCK',
  queue_threshold_exceeded: 'QUEUE BUILDUP',
  predicted_queue_threshold_exceeded: 'QUEUE CONGESTION FORECAST',
  congestion: 'CONGESTION PREDICTED',
  camera_offline: 'CAMERA OFFLINE',
};

const RECOMMENDATION_COPY: Record<string, { title: string; action: string; owner: string }> = {
  open_counter: { title: 'OPEN ANOTHER COUNTER', action: 'ACTIVATE LANE + ASSIGN CASHIER', owner: 'FRONT-END LEAD' },
  assign_staff: { title: 'ASSIGN ADDITIONAL STAFF', action: 'REASSIGN AN ASSOCIATE', owner: 'STORE MANAGER' },
  replenish_shelf: { title: 'REPLENISH SHELF', action: 'PULL STOCK FROM STOCKROOM', owner: 'FLOOR ASSOCIATE' },
  check_shelf: { title: 'CHECK SHELF', action: 'ROTATE STOCK + FACE UP', owner: 'FLOOR ASSOCIATE' },
  monitor_congestion: { title: 'MONITOR CONGESTION', action: 'PRE-EMPT THE BUILDUP', owner: 'STORE MANAGER' },
  balance_counters: { title: 'BALANCE CHECKOUT LANES', action: 'ROUTE CUSTOMERS TO SHORTEST LANE', owner: 'FRONT-END LEAD' },
  camera_maintenance: { title: 'RESTORE CAMERA', action: 'DISPATCH MAINTENANCE', owner: 'IT / FACILITIES' },
};

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Alert level collapses the backend's severity + lifecycle into one label. */
export function alertLevel(alert: ApiAlert): AlertLevel {
  if (alert.status === 'resolved') return 'resolved';
  return alert.severity;
}

export function toAlertItem(alert: ApiAlert): AlertItem {
  const context = alert.context ?? {};
  const confidence = asNumber(context.confidence);
  const zone = typeof context.zone === 'string' ? context.zone : null;

  return {
    id: alert.alert_id,
    level: alertLevel(alert),
    title: ALERT_TITLES[alert.type] ?? alert.type.replace(/_/g, ' ').toUpperCase(),
    location: zone ?? alert.camera_id ?? alert.shelf_id ?? alert.store_id,
    detail: alert.message,
    at: alert.timestamp,
    camera: alert.camera_id ?? '—',
    confidence: confidence ?? 1,
    acknowledged: alert.status !== 'active',
  };
}

/** Pull the numbers the rule actually reacted to, for the impact cell. */
function recommendationImpact(recommendation: ApiRecommendation): string {
  const context = recommendation.context ?? {};
  const wait = asNumber(context.estimated_wait_minutes);
  if (wait !== null) return `WAIT ~${wait} MIN`;

  const queue = asNumber(context.queue_length);
  const predicted = asNumber(context.predicted_queue);
  if (queue !== null && predicted !== null) return `QUEUE ${queue} → ${predicted}`;

  const level = context.predicted_level;
  if (typeof level === 'string') return `LEVEL ${level.toUpperCase()}`;

  const confidence = asNumber(context.confidence);
  if (confidence !== null) return `CONF ${Math.round(confidence * 100)}%`;

  const zone = context.zone;
  if (typeof zone === 'string') return `ZONE ${zone}`;

  const shelfId = context.shelf_id;
  if (typeof shelfId === 'string') return `SHELF ${shelfId.toUpperCase()}`;

  return 'REVIEW';
}

export function toRecommendation(recommendation: ApiRecommendation): Recommendation {
  const priority = recommendation.priority as Priority;
  const copy = RECOMMENDATION_COPY[recommendation.type] ?? {
    title: recommendation.type.replace(/_/g, ' ').toUpperCase(),
    action: 'REVIEW WITH FLOOR TEAM',
    owner: 'STORE MANAGER',
  };
  const horizon = asNumber(recommendation.context?.horizon_minutes);

  return {
    id: recommendation.recommendation_id,
    priority,
    title: copy.title,
    reason: recommendation.message,
    action: copy.action,
    impact: recommendationImpact(recommendation),
    owner: copy.owner,
    window: horizon !== null ? `NEXT ${horizon} MIN` : 'NOW',
    tone: PRIORITY_TONE[priority] ?? 'ink',
  };
}

/* ------------------------------------------------------------
   Provider
   ------------------------------------------------------------ */

export interface DataState {
  /** True until the first successful load for the active store. */
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  polling: boolean;
  setPolling: (value: boolean) => void;
  refresh: () => void;

  stores: ApiStore[];
  storeId: string;
  setStoreId: (id: string) => void;
  store: ApiStore | null;

  overview: ApiOverview | null;
  cameras: ApiCamera[];
  alerts: ApiAlert[];
  alertItems: AlertItem[];
  recommendations: Recommendation[];
  kpis: Metric[];
  activeAlertCount: number;
  unacknowledgedCount: number;

  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [storeId, setStoreId] = useState('');
  const [overview, setOverview] = useState<ApiOverview | null>(null);
  const [cameras, setCameras] = useState<ApiCamera[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  /* Discover the registered stores once on mount. */
  useEffect(() => {
    let cancelled = false;

    api
      .stores()
      .then((result) => {
        if (cancelled) return;
        setStores(result);
        setStoreId((current) => current || result[0]?.store_id || '');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Could not load stores.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Poll the active store's REST endpoints. */
  useEffect(() => {
    if (!storeId) return;

    let cancelled = false;

    async function load() {
      try {
        const [nextOverview, nextAlerts, nextCameras] = await Promise.all([
          api.overview(storeId),
          api.alerts(storeId),
          api.cameras(storeId),
        ]);
        if (cancelled) return;

        setOverview(nextOverview);
        setAlerts(nextAlerts.items);
        setCameras(nextCameras.items);
        setError(null);
        setLastUpdated(new Date().toISOString());
      } catch (cause: unknown) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Request failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    if (!polling) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [storeId, polling, nonce]);

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      await api.acknowledgeAlert(alertId);
      refresh();
    },
    [refresh],
  );

  const resolveAlert = useCallback(
    async (alertId: string) => {
      await api.resolveAlert(alertId);
      refresh();
    },
    [refresh],
  );

  const store = useMemo(
    () => stores.find((item) => item.store_id === storeId) ?? null,
    [stores, storeId],
  );

  const alertItems = useMemo(() => alerts.map(toAlertItem), [alerts]);
  const recommendations = useMemo(
    () => (overview?.recommendations ?? []).map(toRecommendation),
    [overview],
  );

  const activeAlertCount = useMemo(
    () => alerts.filter((alert) => alert.status !== 'resolved').length,
    [alerts],
  );
  const unacknowledgedCount = useMemo(
    () => alerts.filter((alert) => alert.status === 'active').length,
    [alerts],
  );

  /* Real KPIs only. A metric without a backend trend simply has no chip. */
  const kpis = useMemo<Metric[]>(() => {
    if (!overview) return [];
    const { footfall, queues } = overview;

    return [
      {
        id: 'occupancy',
        label: 'PEOPLE IN STORE',
        value: overview.current_occupancy,
        tone: 'blue',
        footnote: `${footfall.total_entries} entries · ${footfall.total_exits} exits today`,
      },
      {
        id: 'entries',
        label: "TODAY'S ENTRIES",
        value: footfall.total_entries,
        tone: 'lime',
        footnote: footfall.peak_hour_label
          ? `Peak ${footfall.peak_hour_label} · ${footfall.peak_hour_entries} entries`
          : 'No peak recorded yet',
        trend:
          footfall.trend_percentage === null
            ? undefined
            : {
                value: Math.round(footfall.trend_percentage),
                direction: footfall.trend_percentage >= 0 ? 'up' : 'down',
                good: footfall.trend_percentage >= 0,
                label: 'vs previous period',
              },
      },
      {
        id: 'alerts',
        label: 'ACTIVE ALERTS',
        value: activeAlertCount,
        tone: 'coral',
        footnote: `${unacknowledgedCount} awaiting acknowledgement`,
      },
      {
        id: 'queue',
        label: 'QUEUE LENGTH',
        value: queues.current_queue,
        tone: 'yellow',
        footnote: `${queues.open_counters} counter${queues.open_counters === 1 ? '' : 's'} open · ~${queues.estimated_wait_minutes} min wait`,
      },
    ];
  }, [overview, activeAlertCount, unacknowledgedCount]);

  const value = useMemo<DataState>(
    () => ({
      loading,
      error,
      lastUpdated,
      polling,
      setPolling,
      refresh,
      stores,
      storeId,
      setStoreId,
      store,
      overview,
      cameras,
      alerts,
      alertItems,
      recommendations,
      kpis,
      activeAlertCount,
      unacknowledgedCount,
      acknowledgeAlert,
      resolveAlert,
    }),
    [
      loading,
      error,
      lastUpdated,
      polling,
      refresh,
      stores,
      storeId,
      store,
      overview,
      cameras,
      alerts,
      alertItems,
      recommendations,
      kpis,
      activeAlertCount,
      unacknowledgedCount,
      acknowledgeAlert,
      resolveAlert,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used inside <DataProvider>');
  }
  return context;
}
