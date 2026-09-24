/* ============================================================
   RETAIL//AI — domain types
   Everything the edge pipeline emits, typed.
   Camera → Stream Manager → CV → Tracking → Event Engine →
   Prediction → Recommendation → Dashboard & Alerts
   ============================================================ */

export type Tone = 'ink' | 'blue' | 'lime' | 'yellow' | 'coral' | 'purple';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface Trend {
  /** percentage change, e.g. +12.4 / -40 */
  value: number;
  direction: TrendDirection;
  /** whether the movement is operationally good */
  good: boolean;
  label: string;
}

export interface Metric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  display?: string;
  precision?: number;
  /** Omitted when the backend has no comparable previous period. */
  trend?: Trend;
  tone: Tone;
  footnote: string;
}

export type AlertLevel = 'critical' | 'warning' | 'info' | 'resolved';

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  location: string;
  detail: string;
  /** ISO timestamp */
  at: string;
  camera: string;
  /** confidence of the underlying CV detection, 0–1 */
  confidence: number;
  acknowledged: boolean;
  isNew?: boolean;
}

export type ShelfStatus = 'healthy' | 'low' | 'critical' | 'empty';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Shelf {
  id: string;
  name: string;
  category: string;
  aisle: string;
  fill: number;
  units: number;
  capacity: number;
  threshold: number;
  status: ShelfStatus;
  risk: RiskLevel;
  /** minutes until predicted stock-out; null = stable */
  hoursToStockOut: number | null;
  restockPriority: number;
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  aisle: string;
  onShelf: number;
  facings: number;
  unitsPerHour: number;
  hoursOfCover: number;
  risk: RiskLevel;
}

export type CameraStatus = 'online' | 'warning' | 'offline';

export interface Camera {
  id: string;
  name: string;
  zone: string;
  status: CameraStatus;
  fps: number;
  latencyMs: number;
  resolution: string;
  uptime: string;
  model: string;
  /** point on the floor plan, percent of viewbox */
  mapX: number;
  mapY: number;
  lastFrame?: string;
}

export interface Prediction {
  id: string;
  kind: string;
  level: RiskLevel;
  subject: string;
  detail: string;
  eta: string;
  confidence: number;
  tone: Tone;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  reason: string;
  action: string;
  impact: string;
  owner: string;
  window: string;
  tone: Tone;
}

export type ZoneKind = 'entrance' | 'aisle' | 'checkout' | 'queue' | 'exit' | 'backroom';

export interface StoreZone {
  id: string;
  label: string;
  short: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ZoneKind;
  tone: Tone;
  /** 0–100 footfall intensity, drives the hard-edged heat layer */
  heat: number;
  dwell: string;
}

export interface PersonDot {
  id: string;
  x: number;
  y: number;
  zone: string;
  tone: Tone;
  stationary: boolean;
}

export interface SeriesPoint {
  t: string;
  footfall: number;
  queue: number;
  dwell: number;
  shelf: number;
  wait: number;
}

export interface RetailEvent {
  id: string;
  type: string;
  zone: string;
  camera: string;
  at: string;
  confidence: number;
  tone: Tone;
}

export interface CategoryPerf {
  category: string;
  footfall: number;
  transactions: number;
  conversion: number;
  fill: number;
  tone: Tone;
}

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  period: string;
  pages: number;
  tone: Tone;
  updatedAt: string;
}

export interface SystemRow {
  label: string;
  value: string;
  detail: string;
  state: 'ok' | 'warn' | 'bad' | 'idle';
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  at: string;
  level: AlertLevel;
  read: boolean;
}

/* ---------- honest little helpers ------------------------------ */

export function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

export function hoursAgo(hrs: number): string {
  return minutesAgo(hrs * 60);
}
