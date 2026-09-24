/* ============================================================
   RETAIL//AI — backend REST client
   The only module that talks to FastAPI. Every request goes
   through apiRequest so auth headers, error unwrapping and the
   base URL stay in one place.
   No WebSockets: the dashboard polls these endpoints.
   ============================================================ */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/* ------------------------------------------------------------
   Backend response shapes (mirror the Pydantic models)
   ------------------------------------------------------------ */

export type TimeWindow = 'today' | 'last_7_days' | 'last_30_days' | 'custom';

export type ApiAlertSeverity = 'info' | 'warning' | 'critical';
export type ApiAlertStatus = 'active' | 'acknowledged' | 'resolved';
export type ApiAlertType =
  | 'shelf_empty'
  | 'shelf_low'
  | 'queue_threshold_exceeded'
  | 'predicted_queue_threshold_exceeded'
  | 'congestion'
  | 'camera_offline';

export type ApiShelfStatus = 'normal' | 'low' | 'empty' | 'unknown';
export type ApiCameraStatus = 'online' | 'warning' | 'offline';
export type ApiPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ApiStore {
  store_id: string;
  name: string;
  city: string;
  area_sqft: number;
  timezone: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAlert {
  alert_id: string;
  store_id: string;
  type: ApiAlertType;
  severity: ApiAlertSeverity;
  message: string;
  timestamp: string;
  status: ApiAlertStatus;
  camera_id: string | null;
  shelf_id: string | null;
  related_event_id: string | null;
  context: Record<string, unknown>;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface ApiShelfState {
  shelf_id: string;
  store_id: string;
  camera_id: string;
  status: ApiShelfStatus;
  confidence: number;
  last_detected: string;
  alert_status: ApiAlertStatus | null;
  low_events: number;
  empty_events: number;
}

export interface ApiShelfSummary {
  store_id: string;
  total_shelves: number;
  normal: number;
  low: number;
  empty: number;
  unknown: number;
  availability_percentage: number;
  shelves_needing_attention: number;
  items: ApiShelfState[];
}

export interface ApiFootfallPoint {
  bucket_start: string;
  label: string;
  entries: number;
  exits: number;
  net: number;
}

export interface ApiFootfallSummary {
  store_id: string;
  window: TimeWindow;
  start: string;
  end: string;
  total_entries: number;
  total_exits: number;
  current_occupancy: number;
  peak_hour_label: string | null;
  peak_hour_entries: number;
  trend_percentage: number | null;
  hourly: ApiFootfallPoint[];
  daily: ApiFootfallPoint[];
}

export interface ApiQueuePoint {
  timestamp: string;
  queue_length: number;
  arrival_rate: number;
  service_rate: number;
  open_counters: number;
}

export interface ApiQueueSummary {
  store_id: string;
  current_queue: number;
  open_counters: number;
  arrival_rate: number;
  service_rate: number;
  estimated_wait_minutes: number;
  peak_queue: number;
  average_queue: number;
  samples: number;
  last_updated: string | null;
  series: ApiQueuePoint[];
}

export interface ApiQueuePrediction {
  store_id: string;
  camera_id: string | null;
  timestamp: string;
  current_queue: number;
  arrival_rate: number;
  service_rate: number;
  open_counters: number;
  horizon_minutes: number;
  predicted_queue: number;
  net_growth_per_minute: number;
  trend: string;
  congestion_level: string;
  minutes_until_breach: number | null;
  breach_threshold: number;
  estimated_wait_minutes: number;
  formula: string;
  explanation: string;
}

export interface ApiCamera {
  camera_id: string;
  store_id: string;
  name: string;
  zone: string;
  status: ApiCameraStatus;
  updated_at?: string;
  enrolled_at?: string;
}

export interface ApiRecommendation {
  recommendation_id: string;
  store_id: string;
  type: string;
  message: string;
  priority: ApiPriority;
  timestamp: string;
  related_event: string | null;
  context: Record<string, unknown>;
}

export interface ApiOverview {
  store_id: string;
  generated_at: string;
  footfall: ApiFootfallSummary;
  current_occupancy: number;
  queues: ApiQueueSummary;
  queue_prediction: ApiQueuePrediction | null;
  shelves: ApiShelfSummary;
  alerts: ApiAlert[];
  recommendations: ApiRecommendation[];
  cameras_online: number;
  cameras_total: number;
}

export interface ApiPaged<T> {
  total: number;
  count: number;
  limit: number;
  offset: number;
  items: T[];
}

export interface ApiHealth {
  ok: boolean;
  mongodb: { connected: boolean; last_error: string | null };
}

/* ------------------------------------------------------------
   Transport
   ------------------------------------------------------------ */

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...init, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : Array.isArray(payload?.detail)
          ? payload.detail.map((item: { msg?: string }) => item.msg).join(', ')
          : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/* ------------------------------------------------------------
   Endpoints
   ------------------------------------------------------------ */

export const api = {
  health: () => apiRequest<ApiHealth>('/health'),

  stores: () => apiRequest<ApiStore[]>('/stores'),

  /** Composite payload — everything the Overview screen needs in one call. */
  overview: (storeId: string) =>
    apiRequest<ApiOverview>(`/stores/${encodeURIComponent(storeId)}/overview`),

  footfall: (storeId: string, window: TimeWindow = 'today') =>
    apiRequest<ApiFootfallSummary>(
      `/stores/${encodeURIComponent(storeId)}/footfall?window=${window}`,
    ),

  queues: (storeId: string, window: TimeWindow = 'today') =>
    apiRequest<ApiQueueSummary>(
      `/stores/${encodeURIComponent(storeId)}/queues?window=${window}`,
    ),

  queuePrediction: (storeId: string) =>
    apiRequest<ApiQueuePrediction>(
      `/stores/${encodeURIComponent(storeId)}/queues/prediction`,
    ),

  shelves: (storeId: string) =>
    apiRequest<ApiShelfSummary>(`/stores/${encodeURIComponent(storeId)}/shelves`),

  cameras: (storeId?: string) =>
    apiRequest<ApiPaged<ApiCamera>>(
      storeId ? `/cameras?store_id=${encodeURIComponent(storeId)}` : '/cameras',
    ),

  alerts: (storeId?: string, limit = 100) =>
    apiRequest<ApiPaged<ApiAlert>>(
      `/alerts?limit=${limit}${storeId ? `&store_id=${encodeURIComponent(storeId)}` : ''}`,
    ),

  acknowledgeAlert: (alertId: string, note?: string) =>
    apiRequest<ApiAlert>(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ note: note ?? null }),
    }),

  resolveAlert: (alertId: string, note?: string) =>
    apiRequest<ApiAlert>(`/alerts/${encodeURIComponent(alertId)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note: note ?? null }),
    }),
};
