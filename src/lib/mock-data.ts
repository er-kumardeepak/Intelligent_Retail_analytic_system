import {
  hoursAgo,
  minutesAgo,
  type AlertItem,
  type AlertLevel,
  type Camera,
  type CategoryPerf,
  type Metric,
  type Notification,
  type PersonDot,
  type Prediction,
  type Product,
  type Recommendation,
  type ReportDef,
  type RetailEvent,
  type SeriesPoint,
  type Shelf,
  type RiskLevel,
  type ShelfStatus,
  type StoreZone,
  type SystemRow,
  type Tone,
} from './types';

/* ============================================================
   STORES  (multi-store selector in the navbar)
   ============================================================ */
export const STORES = [
  { id: 'BLR-014', name: 'BENGALURU · INDIRANAGAR', cameras: 12, area: '4,200 sq ft' },
  { id: 'BLR-021', name: 'BENGALURU · KORAMANGALA', cameras: 9, area: '3,100 sq ft' },
  { id: 'HYD-007', name: 'HYDERABAD · GACHIBOWLI', cameras: 14, area: '5,650 sq ft' },
  { id: 'MUM-032', name: 'MUMBAI · ANDHERI WEST', cameras: 11, area: '3,880 sq ft' },
] as const;

/* ============================================================
   KPI CARDS
   ============================================================ */
export const METRICS: Metric[] = [
  {
    id: 'footfall',
    label: 'PEOPLE IN STORE',
    value: 128,
    trend: { value: 12, direction: 'up', good: true, label: 'vs 15 min ago' },
    tone: 'blue',
    footnote: '12 tracked zones · anonymous',
  },
  {
    id: 'dwell',
    label: 'AVG DWELL TIME',
    value: 8.4,
    unit: 'min',
    precision: 1,
    trend: { value: 4, direction: 'up', good: true, label: 'vs 15 min ago' },
    tone: 'purple',
    footnote: 'Median 6.9 min · p90 21.2 min',
  },
  {
    id: 'queue',
    label: 'QUEUE LENGTH',
    value: 3,
    trend: { value: -40, direction: 'down', good: true, label: 'vs 15 min ago' },
    tone: 'lime',
    footnote: 'Longest wait 4m 12s · CHECKOUT 02',
  },
  {
    id: 'shelf',
    label: 'SHELF FILL RATE',
    value: 92,
    unit: '%',
    trend: { value: 6, direction: 'up', good: true, label: 'vs 15 min ago' },
    tone: 'yellow',
    footnote: '3 aisles below 75% threshold',
  },
];

export const SECONDARY_METRICS: Metric[] = [
  {
    id: 'entrance',
    label: 'ENTRANCE THROUGHPUT',
    value: 46,
    unit: '/min',
    trend: { value: 23, direction: 'up', good: true, label: 'vs baseline' },
    tone: 'lime',
    footnote: 'MAIN ENTRANCE · CAM-01',
  },
  {
    id: 'wait',
    label: 'AVG WAIT TIME',
    value: 2.4,
    unit: 'min',
    precision: 1,
    trend: { value: -18, direction: 'down', good: true, label: 'vs 15 min ago' },
    tone: 'lime',
    footnote: 'Peak today 7m 05s at 18:40',
  },
  {
    id: 'utilisation',
    label: 'CHECKOUT UTILISATION',
    value: 68,
    unit: '%',
    trend: { value: 9, direction: 'up', good: false, label: 'vs 15 min ago' },
    tone: 'yellow',
    footnote: '3 of 4 lanes active',
  },
  {
    id: 'events',
    label: 'EVENTS / MIN',
    value: 214,
    trend: { value: 7, direction: 'up', good: true, label: 'vs 15 min ago' },
    tone: 'purple',
    footnote: 'Event engine · 41ms p95 latency',
  },
];

/* ============================================================
   LIVE STORE MAP — brutalist floor plan (percent of viewbox)
   ============================================================ */
export const STORE_ZONES: StoreZone[] = [
  {
    id: 'backroom',
    label: 'STOCKROOM + COLD STORAGE',
    short: 'STOCKROOM',
    x: 3,
    y: 3,
    w: 94,
    h: 12,
    kind: 'backroom',
    tone: 'ink',
    heat: 12,
    dwell: '2.1 min',
  },
  {
    id: 'a1',
    label: 'AISLE 01 — BEVERAGES',
    short: 'AISLE 01',
    x: 4,
    y: 19,
    w: 19,
    h: 41,
    kind: 'aisle',
    tone: 'lime',
    heat: 88,
    dwell: '6.4 min',
  },
  {
    id: 'a2',
    label: 'AISLE 02 — SNACKS',
    short: 'AISLE 02',
    x: 27,
    y: 19,
    w: 19,
    h: 41,
    kind: 'aisle',
    tone: 'yellow',
    heat: 71,
    dwell: '4.8 min',
  },
  {
    id: 'a3',
    label: 'AISLE 03 — DAIRY',
    short: 'AISLE 03',
    x: 50,
    y: 19,
    w: 19,
    h: 41,
    kind: 'aisle',
    tone: 'coral',
    heat: 43,
    dwell: '3.2 min',
  },
  {
    id: 'a4',
    label: 'AISLE 04 — HOUSEHOLD',
    short: 'AISLE 04',
    x: 73,
    y: 19,
    w: 23,
    h: 41,
    kind: 'aisle',
    tone: 'blue',
    heat: 34,
    dwell: '5.6 min',
  },
  {
    id: 'endcap',
    label: 'END CAP',
    short: 'END CAP',
    x: 4,
    y: 64,
    w: 19,
    h: 11,
    kind: 'aisle',
    tone: 'purple',
    heat: 57,
    dwell: '1.4 min',
  },
  {
    id: 'exit',
    label: 'EXIT CORRIDOR',
    short: 'EXIT',
    x: 27,
    y: 64,
    w: 19,
    h: 11,
    kind: 'exit',
    tone: 'blue',
    heat: 62,
    dwell: '0.4 min',
  },
  {
    id: 'entrance',
    label: 'MAIN ENTRANCE',
    short: 'ENTRANCE',
    x: 4,
    y: 80,
    w: 22,
    h: 16,
    kind: 'entrance',
    tone: 'lime',
    heat: 96,
    dwell: '0.6 min',
  },
  {
    id: 'queue',
    label: 'QUEUE ZONE',
    short: 'QUEUE',
    x: 30,
    y: 80,
    w: 22,
    h: 16,
    kind: 'queue',
    tone: 'yellow',
    heat: 78,
    dwell: '2.9 min',
  },
  {
    id: 'checkout',
    label: 'CHECKOUT 01 — 04',
    short: 'CHECKOUT',
    x: 56,
    y: 78,
    w: 40,
    h: 18,
    kind: 'checkout',
    tone: 'coral',
    heat: 69,
    dwell: '1.8 min',
  },
];

export const ZONE_HEAT: { zone: string; heat: number; dwell: string; tone: Tone }[] = [
  { zone: 'MAIN ENTRANCE', heat: 96, dwell: '0.6 min', tone: 'coral' },
  { zone: 'AISLE 01 · BEVERAGES', heat: 88, dwell: '6.4 min', tone: 'coral' },
  { zone: 'QUEUE ZONE', heat: 78, dwell: '2.9 min', tone: 'yellow' },
  { zone: 'AISLE 02 · SNACKS', heat: 71, dwell: '4.8 min', tone: 'yellow' },
  { zone: 'CHECKOUT 01–04', heat: 69, dwell: '1.8 min', tone: 'yellow' },
  { zone: 'EXIT CORRIDOR', heat: 62, dwell: '0.4 min', tone: 'yellow' },
  { zone: 'END CAP', heat: 57, dwell: '1.4 min', tone: 'lime' },
  { zone: 'AISLE 03 · DAIRY', heat: 43, dwell: '3.2 min', tone: 'lime' },
  { zone: 'AISLE 04 · HOUSEHOLD', heat: 34, dwell: '5.6 min', tone: 'blue' },
  { zone: 'STOCKROOM', heat: 12, dwell: '2.1 min', tone: 'blue' },
];

/** Deterministic-ish dot cloud representing anonymous tracked people. */
export const PEOPLE: PersonDot[] = [
  { id: 'p01', x: 12, y: 88, zone: 'ENTRANCE', tone: 'lime', stationary: false },
  { id: 'p02', x: 15, y: 83, zone: 'ENTRANCE', tone: 'lime', stationary: false },
  { id: 'p03', x: 9, y: 92, zone: 'ENTRANCE', tone: 'lime', stationary: false },
  { id: 'p04', x: 10, y: 30, zone: 'AISLE 01', tone: 'blue', stationary: true },
  { id: 'p05', x: 14, y: 38, zone: 'AISLE 01', tone: 'blue', stationary: true },
  { id: 'p06', x: 18, y: 46, zone: 'AISLE 01', tone: 'coral', stationary: false },
  { id: 'p07', x: 9, y: 52, zone: 'AISLE 01', tone: 'blue', stationary: true },
  { id: 'p08', x: 33, y: 25, zone: 'AISLE 02', tone: 'purple', stationary: false },
  { id: 'p09', x: 40, y: 33, zone: 'AISLE 02', tone: 'blue', stationary: true },
  { id: 'p10', x: 36, y: 48, zone: 'AISLE 02', tone: 'purple', stationary: false },
  { id: 'p11', x: 55, y: 28, zone: 'AISLE 03', tone: 'blue', stationary: true },
  { id: 'p12', x: 63, y: 44, zone: 'AISLE 03', tone: 'blue', stationary: false },
  { id: 'p13', x: 80, y: 30, zone: 'AISLE 04', tone: 'blue', stationary: true },
  { id: 'p14', x: 88, y: 40, zone: 'AISLE 04', tone: 'blue', stationary: false },
  { id: 'p15', x: 34, y: 68, zone: 'EXIT', tone: 'blue', stationary: false },
  { id: 'p16', x: 36, y: 87, zone: 'QUEUE', tone: 'yellow', stationary: true },
  { id: 'p17', x: 38, y: 92, zone: 'QUEUE', tone: 'yellow', stationary: true },
  { id: 'p18', x: 42, y: 86, zone: 'QUEUE', tone: 'yellow', stationary: true },
  { id: 'p19', x: 46, y: 91, zone: 'QUEUE', tone: 'yellow', stationary: true },
  { id: 'p20', x: 60, y: 84, zone: 'CHECKOUT', tone: 'coral', stationary: true },
  { id: 'p21', x: 70, y: 88, zone: 'CHECKOUT', tone: 'coral', stationary: true },
  { id: 'p22', x: 80, y: 84, zone: 'CHECKOUT', tone: 'coral', stationary: true },
  { id: 'p23', x: 12, y: 69, zone: 'END CAP', tone: 'purple', stationary: false },
  { id: 'p24', x: 90, y: 88, zone: 'CHECKOUT', tone: 'coral', stationary: true },
];

/* ============================================================
   ALERTS
   ============================================================ */
export const ALERTS: AlertItem[] = [
  {
    id: 'al-901',
    level: 'critical',
    title: 'EMPTY SHELF DETECTED',
    location: 'AISLE 04 · BEVERAGES',
    detail: 'Shelf bay 04-B reports 0 facings across 3 SKUs for >6 minutes.',
    at: minutesAgo(4),
    camera: 'CAM-04',
    confidence: 0.96,
    acknowledged: false,
    isNew: true,
  },
  {
    id: 'al-900',
    level: 'critical',
    title: 'QUEUE BUILDUP',
    location: 'CHECKOUT 02 · QUEUE ZONE',
    detail: '7 people waiting, projected wait 6m 40s. Breach of 5m SLA.',
    at: minutesAgo(9),
    camera: 'CAM-03',
    confidence: 0.93,
    acknowledged: false,
  },
  {
    id: 'al-899',
    level: 'warning',
    title: 'LOW STOCK — DAIRY',
    location: 'AISLE 03 · DAIRY',
    detail: 'Fill rate 53%, below the 65% threshold. 3 SKUs near depletion.',
    at: minutesAgo(17),
    camera: 'CAM-06',
    confidence: 0.89,
    acknowledged: false,
  },
  {
    id: 'al-898',
    level: 'info',
    title: 'HIGH FOOTFALL',
    location: 'MAIN ENTRANCE · CAM-01',
    detail: 'Entrance throughput +23% against the rolling 15-minute baseline.',
    at: minutesAgo(22),
    camera: 'CAM-01',
    confidence: 0.98,
    acknowledged: true,
  },
  {
    id: 'al-897',
    level: 'warning',
    title: 'CAMERA DEGRADED',
    location: 'CAM-03 · CHECKOUT 01',
    detail: 'Frame rate dropped to 18 fps, inference latency 320 ms.',
    at: minutesAgo(31),
    camera: 'CAM-03',
    confidence: 1,
    acknowledged: false,
  },
  {
    id: 'al-896',
    level: 'critical',
    title: 'CAMERA OFFLINE',
    location: 'CAM-04 · SHELF ZONE',
    detail: 'No frames received for 42 minutes. Shelf zone is currently unwatched.',
    at: minutesAgo(42),
    camera: 'CAM-04',
    confidence: 1,
    acknowledged: true,
  },
  {
    id: 'al-895',
    level: 'info',
    title: 'DWELL ANOMALY',
    location: 'AISLE 01 · BEVERAGES',
    detail: 'Dwell time 6.4 min vs 4.1 min baseline — possible planogram friction.',
    at: minutesAgo(58),
    camera: 'CAM-02',
    confidence: 0.81,
    acknowledged: true,
  },
  {
    id: 'al-894',
    level: 'resolved',
    title: 'QUEUE CLEARED',
    location: 'CHECKOUT 01',
    detail: 'Queue returned to normal levels after lane 03 was opened.',
    at: hoursAgo(2),
    camera: 'CAM-03',
    confidence: 0.94,
    acknowledged: true,
  },
  {
    id: 'al-893',
    level: 'resolved',
    title: 'RESTOCK COMPLETED',
    location: 'AISLE 02 · SNACKS',
    detail: 'Fill rate recovered from 58% to 88% after staff restock.',
    at: hoursAgo(3),
    camera: 'CAM-05',
    confidence: 0.91,
    acknowledged: true,
  },
  {
    id: 'al-892',
    level: 'info',
    title: 'POS SYNC',
    location: 'ERP BRIDGE',
    detail: '1,284 transactions reconciled with edge event stream.',
    at: hoursAgo(4),
    camera: 'EDGE-01',
    confidence: 1,
    acknowledged: true,
  },
];

/** Templates the live engine injects while the dashboard is open. */
export const ALERT_TEMPLATES: Omit<AlertItem, 'id' | 'at' | 'isNew' | 'acknowledged'>[] = [
  {
    level: 'critical',
    title: 'EMPTY SHELF DETECTED',
    location: 'AISLE 03 · DAIRY',
    detail: 'Bay 03-A empty for >4 minutes across 2 SKUs.',
    camera: 'CAM-06',
    confidence: 0.94,
  },
  {
    level: 'warning',
    title: 'QUEUE BUILDUP',
    location: 'CHECKOUT 01 · QUEUE ZONE',
    detail: 'Queue reached 5 people, projected wait 4m 05s.',
    camera: 'CAM-03',
    confidence: 0.9,
  },
  {
    level: 'warning',
    title: 'LOW STOCK — SNACKS',
    location: 'AISLE 02 · SNACKS',
    detail: 'Fill rate dipped to 68%, trending below threshold.',
    camera: 'CAM-05',
    confidence: 0.86,
  },
  {
    level: 'info',
    title: 'HIGH FOOTFALL',
    location: 'MAIN ENTRANCE · CAM-01',
    detail: 'Entrance throughput +18% against baseline.',
    camera: 'CAM-01',
    confidence: 0.97,
  },
  {
    level: 'info',
    title: 'DWELL ANOMALY',
    location: 'AISLE 04 · HOUSEHOLD',
    detail: 'Dwell 5.6 min vs 3.4 min baseline — promotion performing well.',
    camera: 'CAM-07',
    confidence: 0.83,
  },
  {
    level: 'warning',
    title: 'CHECKOUT IMBALANCE',
    location: 'CHECKOUT 04',
    detail: 'Lane idle 12 minutes while CHECKOUT 02 holds a queue.',
    camera: 'CAM-03',
    confidence: 0.88,
  },
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'nt-01',
    title: 'EMPTY SHELF — AISLE 04',
    detail: 'Beverages bay cleared. Restock recommended.',
    at: minutesAgo(4),
    level: 'critical',
    read: false,
  },
  {
    id: 'nt-02',
    title: 'CHECKOUT 03 AVAILABLE',
    detail: 'Recommendation accepted, lane activated.',
    at: minutesAgo(11),
    level: 'info',
    read: false,
  },
  {
    id: 'nt-03',
    title: 'CAM-04 OFFLINE',
    detail: 'Shelf zone unwatched for 42 minutes.',
    at: minutesAgo(42),
    level: 'warning',
    read: true,
  },
];

/* ============================================================
   SHELVES & PRODUCTS
   ============================================================ */
function shelf(
  id: string,
  name: string,
  category: string,
  aisle: string,
  fill: number,
  capacity: number,
  threshold: number,
  hoursToStockOut: number | null,
  restockPriority: number,
): Shelf {
  let status: ShelfStatus = 'healthy';
  if (fill <= 8) status = 'empty';
  else if (fill < threshold) status = 'critical';
  else if (fill < threshold + 12) status = 'low';
  const risk: RiskLevel =
    status === 'empty' || fill < threshold - 12 ? 'high' : fill < threshold + 12 ? 'medium' : 'low';
  return {
    id,
    name,
    category,
    aisle,
    fill,
    capacity,
    units: Math.round((fill / 100) * capacity),
    threshold,
    status,
    risk,
    hoursToStockOut,
    restockPriority,
  };
}

export const SHELVES: Shelf[] = [
  shelf('sh-01', 'BEVERAGES', 'BEVERAGES', 'AISLE 01', 91, 480, 70, null, 3),
  shelf('sh-02', 'SNACKS', 'SNACKS', 'AISLE 02', 72, 520, 68, 6.5, 2),
  shelf('sh-03', 'DAIRY', 'DAIRY', 'AISLE 03', 53, 360, 65, 3.2, 1),
  shelf('sh-04', 'HOUSEHOLD', 'HOUSEHOLD', 'AISLE 04', 88, 410, 70, null, 6),
  shelf('sh-05', 'FROZEN', 'FROZEN', 'AISLE 04', 64, 300, 66, 4.8, 4),
  shelf('sh-06', 'PRODUCE', 'PRODUCE', 'AISLE 03', 36, 280, 60, 1.6, 1),
  shelf('sh-07', 'BAKERY', 'BAKERY', 'AISLE 02', 79, 220, 62, null, 7),
  shelf('sh-08', 'PERSONAL CARE', 'PERSONAL CARE', 'AISLE 04', 94, 340, 68, null, 8),
  shelf('sh-09', 'BEVERAGES · CHILLED', 'BEVERAGES', 'AISLE 01', 8, 260, 68, 0.4, 1),
];

export const LOW_STOCK_PRODUCTS: Product[] = [
  {
    sku: 'BEV-1042',
    name: 'SPARKLING WATER 1L',
    category: 'BEVERAGES',
    aisle: 'AISLE 01',
    onShelf: 2,
    facings: 6,
    unitsPerHour: 9.4,
    hoursOfCover: 0.4,
    risk: 'high',
  },
  {
    sku: 'DRY-2210',
    name: 'FULL CREAM MILK 500ML',
    category: 'DAIRY',
    aisle: 'AISLE 03',
    onShelf: 4,
    facings: 6,
    unitsPerHour: 7.1,
    hoursOfCover: 0.9,
    risk: 'high',
  },
  {
    sku: 'PRD-3311',
    name: 'BANANAS 1KG',
    category: 'PRODUCE',
    aisle: 'AISLE 03',
    onShelf: 5,
    facings: 4,
    unitsPerHour: 5.2,
    hoursOfCover: 1.1,
    risk: 'high',
  },
  {
    sku: 'SNK-5567',
    name: 'SALTED CHIPS 90G',
    category: 'SNACKS',
    aisle: 'AISLE 02',
    onShelf: 9,
    facings: 8,
    unitsPerHour: 4.8,
    hoursOfCover: 1.9,
    risk: 'medium',
  },
  {
    sku: 'FRZ-7781',
    name: 'VEG PATTIES 400G',
    category: 'FROZEN',
    aisle: 'AISLE 04',
    onShelf: 7,
    facings: 5,
    unitsPerHour: 2.4,
    hoursOfCover: 2.9,
    risk: 'medium',
  },
  {
    sku: 'DAI-8802',
    name: 'GREEK YOGHURT 400G',
    category: 'DAIRY',
    aisle: 'AISLE 03',
    onShelf: 3,
    facings: 4,
    unitsPerHour: 3.1,
    hoursOfCover: 1.0,
    risk: 'high',
  },
  {
    sku: 'BEV-1190',
    name: 'COLA 2L',
    category: 'BEVERAGES',
    aisle: 'AISLE 01',
    onShelf: 11,
    facings: 9,
    unitsPerHour: 3.6,
    hoursOfCover: 3.1,
    risk: 'medium',
  },
  {
    sku: 'HHD-9904',
    name: 'DISH SOAP 750ML',
    category: 'HOUSEHOLD',
    aisle: 'AISLE 04',
    onShelf: 14,
    facings: 8,
    unitsPerHour: 1.2,
    hoursOfCover: 11.7,
    risk: 'low',
  },
];

/* ============================================================
   CAMERAS
   ============================================================ */
export const CAMERAS: Camera[] = [
  { id: 'CAM-01', name: 'ENTRANCE', zone: 'MAIN ENTRANCE', status: 'online', fps: 30, latencyMs: 41, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 15, mapY: 88 },
  { id: 'CAM-02', name: 'AISLE 01', zone: 'BEVERAGES', status: 'online', fps: 30, latencyMs: 38, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 13, mapY: 40 },
  { id: 'CAM-03', name: 'CHECKOUT', zone: 'CHECKOUT 01–04', status: 'warning', fps: 18, latencyMs: 320, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 76, mapY: 87, lastFrame: minutesAgo(0.2) },
  { id: 'CAM-04', name: 'SHELF ZONE', zone: 'DAIRY BAYS', status: 'offline', fps: 0, latencyMs: 0, resolution: '1080p', uptime: '—', model: 'yolov8n-edge', mapX: 59, mapY: 40, lastFrame: minutesAgo(42) },
  { id: 'CAM-05', name: 'AISLE 02', zone: 'SNACKS', status: 'online', fps: 30, latencyMs: 44, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 36, mapY: 40 },
  { id: 'CAM-06', name: 'AISLE 03', zone: 'DAIRY', status: 'online', fps: 29, latencyMs: 47, resolution: '1080p', uptime: '41d 22h', model: 'yolov8n-edge', mapX: 59, mapY: 30 },
  { id: 'CAM-07', name: 'AISLE 04', zone: 'HOUSEHOLD', status: 'online', fps: 30, latencyMs: 39, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 84, mapY: 40 },
  { id: 'CAM-08', name: 'QUEUE LANE', zone: 'QUEUE ZONE', status: 'online', fps: 30, latencyMs: 36, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 41, mapY: 88 },
  { id: 'CAM-09', name: 'STOCKROOM', zone: 'BACK OF STORE', status: 'online', fps: 15, latencyMs: 52, resolution: '720p', uptime: '30d 11h', model: 'yolov8n-edge', mapX: 30, mapY: 9 },
  { id: 'CAM-10', name: 'COLD STORAGE', zone: 'BACK OF STORE', status: 'online', fps: 15, latencyMs: 55, resolution: '720p', uptime: '30d 11h', model: 'yolov8n-edge', mapX: 62, mapY: 9 },
  { id: 'CAM-11', name: 'EXIT', zone: 'EXIT CORRIDOR', status: 'online', fps: 30, latencyMs: 40, resolution: '1080p', uptime: '42d 06h', model: 'yolov8n-edge', mapX: 36, mapY: 69 },
  { id: 'CAM-12', name: 'END CAP', zone: 'PROMO BAYS', status: 'online', fps: 24, latencyMs: 46, resolution: '1080p', uptime: '21d 04h', model: 'yolov8n-edge', mapX: 13, mapY: 69 },
];

/* ============================================================
   PREDICTIONS (AI)
   ============================================================ */
export const PREDICTIONS: Prediction[] = [
  {
    id: 'pr-01',
    kind: 'STOCK-OUT RISK',
    level: 'high',
    subject: 'BEVERAGES · AISLE 01',
    detail: 'Sell-through at 9.4 units/hr with 2 units on shelf. Bay 04-A empties first.',
    eta: '~45 MIN',
    confidence: 0.87,
    tone: 'coral',
  },
  {
    id: 'pr-02',
    kind: 'CONGESTION RISK',
    level: 'medium',
    subject: 'CHECKOUT · QUEUE ZONE',
    detail: 'Basket sizes trending up; 3 active lanes will saturate before 19:00.',
    eta: '~15 MIN',
    confidence: 0.74,
    tone: 'yellow',
  },
  {
    id: 'pr-03',
    kind: 'FOOTFALL FORECAST',
    level: 'low',
    subject: '+18% · STORE-WIDE',
    detail: 'Evening peak forming. Entrance throughput will exceed 60/min.',
    eta: '18:00',
    confidence: 0.91,
    tone: 'blue',
  },
  {
    id: 'pr-04',
    kind: 'RESTOCK WINDOW',
    level: 'medium',
    subject: 'AISLE 04 · HOUSEHOLD',
    detail: 'Lowest traffic window for a safe restock without blocking shoppers.',
    eta: '18:30 – 19:10',
    confidence: 0.8,
    tone: 'purple',
  },
  {
    id: 'pr-05',
    kind: 'SPOILAGE RISK',
    level: 'low',
    subject: 'COLD STORAGE · DAIRY',
    detail: 'Ambient drift +1.2°C over 4h. Rotation discipline still holding.',
    eta: '~6 H',
    confidence: 0.62,
    tone: 'lime',
  },
  {
    id: 'pr-06',
    kind: 'SHELF RECOVERY',
    level: 'high',
    subject: 'AISLE 03 · PRODUCE',
    detail: 'Produce fill at 36%. Projected to bottom out before the evening peak.',
    eta: '~25 MIN',
    confidence: 0.83,
    tone: 'coral',
  },
];

/* ============================================================
   RECOMMENDATIONS
   ============================================================ */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rc-01',
    priority: 'critical',
    title: 'OPEN CHECKOUT 03',
    reason:
      'Queue pressure increasing at CHECKOUT 01–02. 7 customers waiting, average wait 4m 20s and rising 0.4s per minute.',
    action: 'ACTIVATE LANE + ASSIGN CASHIER',
    impact: '−38% WAIT TIME',
    owner: 'FRONT-END LEAD',
    window: 'NOW',
    tone: 'coral',
  },
  {
    id: 'rc-02',
    priority: 'high',
    title: 'RESTOCK BEVERAGES',
    reason:
      'Shelf availability dropped below threshold in AISLE 01. Bay 04-A empty; 2 units of SPARKLING WATER 1L remaining.',
    action: 'PULL 4 CASES FROM STOCKROOM',
    impact: '+9% FILL RATE',
    owner: 'FLOOR ASSOCIATE',
    window: 'NEXT 10 MIN',
    tone: 'yellow',
  },
  {
    id: 'rc-03',
    priority: 'high',
    title: 'MOVE STAFF TO ENTRANCE',
    reason:
      'High footfall detected at MAIN ENTRANCE (+23% vs baseline). Trolley pickup queue forming at the door.',
    action: 'REASSIGN 1 ASSOCIATE',
    impact: 'SMOOTHER ENTRY FLOW',
    owner: 'STORE MANAGER',
    window: 'NEXT 15 MIN',
    tone: 'lime',
  },
  {
    id: 'rc-04',
    priority: 'medium',
    title: 'CLEAR DAIRY END CAP',
    reason:
      'DAIRY fill at 53% and falling. Cold storage holds 42 units of the three depleted SKUs.',
    action: 'ROTATE STOCK + FACE UP',
    impact: '−1.9H STOCK-OUT RISK',
    owner: 'FLOOR ASSOCIATE',
    window: 'NEXT 20 MIN',
    tone: 'blue',
  },
  {
    id: 'rc-05',
    priority: 'medium',
    title: 'INSPECT CAM-04',
    reason:
      'Shelf zone camera offline for 42 minutes. Dairy bays are currently unwatched by the event engine.',
    action: 'DISPATCH MAINTENANCE',
    impact: 'RESTORE SHELF COVERAGE',
    owner: 'IT / FACILITIES',
    window: 'NEXT 30 MIN',
    tone: 'purple',
  },
  {
    id: 'rc-06',
    priority: 'low',
    title: 'REBALANCE TILLS',
    reason:
      'CHECKOUT 04 idle for 22 minutes at 31% utilisation while CHECKOUT 02 sustains a queue.',
    action: 'ROTATE CASHIER ROSTER',
    impact: '+7% LANE BALANCE',
    owner: 'FRONT-END LEAD',
    window: 'THIS HOUR',
    tone: 'ink',
  },
];

/* ============================================================
   TIME SERIES (analytics)
   ============================================================ */
export const TODAY_SERIES: SeriesPoint[] = [
  { t: '09:00', footfall: 21, queue: 1, dwell: 5.1, shelf: 96, wait: 0.8 },
  { t: '10:00', footfall: 38, queue: 2, dwell: 6.2, shelf: 94, wait: 1.4 },
  { t: '11:00', footfall: 52, queue: 3, dwell: 7.4, shelf: 92, wait: 2.1 },
  { t: '12:00', footfall: 74, queue: 5, dwell: 8.9, shelf: 88, wait: 3.6 },
  { t: '13:00', footfall: 81, queue: 6, dwell: 9.6, shelf: 84, wait: 4.2 },
  { t: '14:00', footfall: 64, queue: 4, dwell: 8.1, shelf: 86, wait: 2.8 },
  { t: '15:00', footfall: 58, queue: 3, dwell: 7.6, shelf: 89, wait: 2.2 },
  { t: '16:00', footfall: 69, queue: 4, dwell: 8.4, shelf: 91, wait: 2.9 },
  { t: '17:00', footfall: 96, queue: 6, dwell: 9.2, shelf: 87, wait: 4.6 },
  { t: '18:00', footfall: 118, queue: 7, dwell: 8.8, shelf: 83, wait: 5.4 },
  { t: '19:00', footfall: 128, queue: 3, dwell: 8.4, shelf: 92, wait: 2.4 },
  { t: '20:00', footfall: 104, queue: 4, dwell: 7.9, shelf: 90, wait: 3.1 },
  { t: '21:00', footfall: 72, queue: 2, dwell: 6.8, shelf: 93, wait: 1.6 },
];

export const WEEK_SERIES: SeriesPoint[] = [
  { t: 'MON', footfall: 812, queue: 4, dwell: 7.6, shelf: 90, wait: 3.2 },
  { t: 'TUE', footfall: 764, queue: 3, dwell: 7.1, shelf: 92, wait: 2.8 },
  { t: 'WED', footfall: 903, queue: 5, dwell: 8.2, shelf: 88, wait: 3.9 },
  { t: 'THU', footfall: 878, queue: 4, dwell: 8.0, shelf: 91, wait: 3.4 },
  { t: 'FRI', footfall: 1142, queue: 7, dwell: 9.4, shelf: 85, wait: 5.1 },
  { t: 'SAT', footfall: 1486, queue: 9, dwell: 10.2, shelf: 79, wait: 6.4 },
  { t: 'SUN', footfall: 1231, queue: 6, dwell: 9.1, shelf: 84, wait: 4.7 },
];

export const MONTH_SERIES: SeriesPoint[] = [
  { t: 'W1', footfall: 5820, queue: 4, dwell: 7.8, shelf: 89, wait: 3.4 },
  { t: 'W2', footfall: 6310, queue: 5, dwell: 8.1, shelf: 87, wait: 3.9 },
  { t: 'W3', footfall: 5964, queue: 4, dwell: 7.9, shelf: 90, wait: 3.3 },
  { t: 'W4', footfall: 7211, queue: 6, dwell: 8.6, shelf: 85, wait: 4.6 },
];

export const QUEUE_SERIES: SeriesPoint[] = [
  { t: '14:00', footfall: 64, queue: 4, dwell: 8.1, shelf: 86, wait: 2.8 },
  { t: '14:30', footfall: 58, queue: 3, dwell: 7.8, shelf: 87, wait: 2.3 },
  { t: '15:00', footfall: 61, queue: 3, dwell: 7.6, shelf: 88, wait: 2.1 },
  { t: '15:30', footfall: 66, queue: 4, dwell: 8.0, shelf: 89, wait: 2.7 },
  { t: '16:00', footfall: 69, queue: 4, dwell: 8.4, shelf: 90, wait: 2.9 },
  { t: '16:30', footfall: 78, queue: 5, dwell: 8.7, shelf: 89, wait: 3.4 },
  { t: '17:00', footfall: 96, queue: 6, dwell: 9.2, shelf: 88, wait: 4.6 },
  { t: '17:30', footfall: 108, queue: 8, dwell: 9.6, shelf: 86, wait: 5.9 },
  { t: '18:00', footfall: 118, queue: 7, dwell: 8.8, shelf: 84, wait: 5.4 },
  { t: '18:30', footfall: 124, queue: 5, dwell: 8.5, shelf: 88, wait: 3.8 },
  { t: '19:00', footfall: 128, queue: 3, dwell: 8.4, shelf: 92, wait: 2.4 },
];

export const HOURLY_FOOTFALL = TODAY_SERIES.map((p) => ({ t: p.t, value: p.footfall }));

export const FOOTFALL_FORECAST = [
  { t: '19:00', actual: 128, forecast: 126, upper: 138, lower: 114 },
  { t: '19:30', actual: null as number | null, forecast: 134, upper: 149, lower: 119 },
  { t: '20:00', actual: null as number | null, forecast: 121, upper: 141, lower: 101 },
  { t: '20:30', actual: null as number | null, forecast: 96, upper: 118, lower: 74 },
  { t: '21:00', actual: null as number | null, forecast: 72, upper: 94, lower: 50 },
  { t: '21:30', actual: null as number | null, forecast: 41, upper: 62, lower: 20 },
];

export const DWELL_DISTRIBUTION = [
  { bucket: '0–2', count: 42 },
  { bucket: '2–5', count: 96 },
  { bucket: '5–10', count: 138 },
  { bucket: '10–20', count: 74 },
  { bucket: '20–30', count: 31 },
  { bucket: '30+', count: 12 },
];

export const CATEGORY_PERF: CategoryPerf[] = [
  { category: 'BEVERAGES', footfall: 412, transactions: 186, conversion: 45, fill: 91, tone: 'lime' },
  { category: 'SNACKS', footfall: 366, transactions: 158, conversion: 43, fill: 72, tone: 'yellow' },
  { category: 'DAIRY', footfall: 298, transactions: 141, conversion: 47, fill: 53, tone: 'coral' },
  { category: 'HOUSEHOLD', footfall: 214, transactions: 62, conversion: 29, fill: 88, tone: 'blue' },
  { category: 'FROZEN', footfall: 178, transactions: 71, conversion: 40, fill: 64, tone: 'purple' },
  { category: 'PRODUCE', footfall: 302, transactions: 152, conversion: 50, fill: 36, tone: 'coral' },
  { category: 'PERSONAL CARE', footfall: 122, transactions: 38, conversion: 31, fill: 94, tone: 'blue' },
];

export const STOCKOUT_EVENTS = [
  { t: 'MON', events: 4 },
  { t: 'TUE', events: 2 },
  { t: 'WED', events: 6 },
  { t: 'THU', events: 3 },
  { t: 'FRI', events: 9 },
  { t: 'SAT', events: 12 },
  { t: 'SUN', events: 7 },
];

/* ============================================================
   EVENT ENGINE FEED (the ticker)
   ============================================================ */
export const INDEXED_EVENTS: RetailEvent[] = [
  { id: 'ev-1', type: 'PERSON_ENTERED', zone: 'MAIN ENTRANCE', camera: 'CAM-01', at: minutesAgo(1), confidence: 0.98, tone: 'lime' },
  { id: 'ev-2', type: 'DWELL_THRESHOLD', zone: 'AISLE 01', camera: 'CAM-02', at: minutesAgo(2), confidence: 0.84, tone: 'purple' },
  { id: 'ev-3', type: 'SHELF_EMPTY', zone: 'AISLE 04', camera: 'CAM-04', at: minutesAgo(4), confidence: 0.96, tone: 'coral' },
  { id: 'ev-4', type: 'QUEUE_THRESHOLD', zone: 'CHECKOUT 02', camera: 'CAM-03', at: minutesAgo(9), confidence: 0.93, tone: 'yellow' },
  { id: 'ev-5', type: 'FLOW_REVERSED', zone: 'EXIT CORRIDOR', camera: 'CAM-11', at: minutesAgo(12), confidence: 0.77, tone: 'blue' },
  { id: 'ev-6', type: 'FOOTFALL_SPIKE', zone: 'MAIN ENTRANCE', camera: 'CAM-01', at: minutesAgo(22), confidence: 0.98, tone: 'lime' },
  { id: 'ev-7', type: 'SHELF_LOW', zone: 'AISLE 03', camera: 'CAM-06', at: minutesAgo(17), confidence: 0.89, tone: 'yellow' },
];

export const EVENT_TEMPLATES: { type: string; zone: string; camera: string; tone: Tone }[] = [
  { type: 'PERSON_ENTERED', zone: 'MAIN ENTRANCE', camera: 'CAM-01', tone: 'lime' },
  { type: 'PERSON_EXITED', zone: 'EXIT CORRIDOR', camera: 'CAM-11', tone: 'blue' },
  { type: 'SHELF_LOW', zone: 'AISLE 03', camera: 'CAM-06', tone: 'yellow' },
  { type: 'DWELL_THRESHOLD', zone: 'AISLE 02', camera: 'CAM-05', tone: 'purple' },
  { type: 'QUEUE_THRESHOLD', zone: 'CHECKOUT 01', camera: 'CAM-03', tone: 'yellow' },
  { type: 'ZONE_LAST_FACE_COVERED', zone: 'AISLE 01', camera: 'CAM-02', tone: 'coral' },
  { type: 'FOOTFALL_SPIKE', zone: 'END CAP', camera: 'CAM-12', tone: 'lime' },
];

/* ============================================================
   SYSTEM STATUS PANEL
   ============================================================ */
export const SYSTEM_ROWS: SystemRow[] = [
  { label: 'EDGE AI', value: 'ONLINE', detail: 'Jetson Orin · 62% GPU · 41 ms p95', state: 'ok' },
  { label: 'CAMERAS', value: '11 / 12', detail: 'CAM-04 offline · CAM-03 degraded', state: 'warn' },
  { label: 'MODEL', value: 'YOLO v8n', detail: 'retail-shelf-annex v3.4 · 1280px', state: 'ok' },
  { label: 'DATABASE', value: 'POSTGRESQL', detail: '2.1M events · 14 ms avg query', state: 'ok' },
  { label: 'NETWORK', value: 'STABLE', detail: '18 Mbps up · 3 ms jitter', state: 'ok' },
  { label: 'LOCAL STORAGE', value: '78%', detail: '412 GB / 528 GB · 7d ring buffer', state: 'warn' },
  { label: 'SYNC QUEUE', value: '0 EVENTS', detail: 'Offline-first buffer drained', state: 'ok' },
  { label: 'POS / ERP', value: 'CONNECTED', detail: 'SAP bridge · last sync 2 min ago', state: 'ok' },
];

export const INFERENCE_LOAD = [
  { t: '19:00', fps: 324, gpu: 58, latency: 38 },
  { t: '19:05', fps: 338, gpu: 62, latency: 41 },
  { t: '19:10', fps: 351, gpu: 66, latency: 44 },
  { t: '19:15', fps: 342, gpu: 61, latency: 39 },
  { t: '19:20', fps: 366, gpu: 69, latency: 47 },
  { t: '19:25', fps: 358, gpu: 64, latency: 42 },
];

/* ============================================================
   REPORTS
   ============================================================ */
export const REPORTS: ReportDef[] = [
  {
    id: 'rp-01',
    title: 'DAILY STORE REPORT',
    description: 'Footfall, dwell, conversion, queue SLA and shelf health for the trading day.',
    period: 'TODAY · 18 SEP',
    pages: 12,
    tone: 'blue',
    updatedAt: minutesAgo(24),
  },
  {
    id: 'rp-02',
    title: 'WEEKLY PERFORMANCE',
    description: 'Week-over-week traffic, category conversion and staffing efficiency.',
    period: 'MON 14 — SUN 20 SEP',
    pages: 24,
    tone: 'purple',
    updatedAt: hoursAgo(9),
  },
  {
    id: 'rp-03',
    title: 'STOCK-OUT REPORT',
    description: 'Every shelf-empty and low-stock event with time-to-detect and recovery.',
    period: 'LAST 7 DAYS',
    pages: 8,
    tone: 'coral',
    updatedAt: hoursAgo(3),
  },
  {
    id: 'rp-04',
    title: 'QUEUE REPORT',
    description: 'Wait-time percentiles, lane utilisation and SLA breaches per hour.',
    period: 'LAST 7 DAYS',
    pages: 10,
    tone: 'yellow',
    updatedAt: hoursAgo(3),
  },
  {
    id: 'rp-05',
    title: 'AI RECOMMENDATION REPORT',
    description: 'Issued recommendations, acceptance rate and measured operational impact.',
    period: 'LAST 30 DAYS',
    pages: 16,
    tone: 'lime',
    updatedAt: hoursAgo(28),
  },
  {
    id: 'rp-06',
    title: 'PRIVACY & COMPLIANCE',
    description: 'On-device processing log, retention windows and anonymous tracking audit.',
    period: 'LAST 30 DAYS',
    pages: 6,
    tone: 'ink',
    updatedAt: hoursAgo(28),
  },
];

/* ============================================================
   PRIVACY PIPELINE
   ============================================================ */
export const PRIVACY_PIPELINE = [
  {
    step: '01',
    title: 'VIDEO INPUT',
    detail: 'Existing store cameras. No new hardware, no rewiring, no cloud upload of frames.',
    tone: 'ink' as Tone,
  },
  {
    step: '02',
    title: 'EDGE PROCESSING',
    detail: 'Every frame is inferred locally on the in-store edge device. Pixels never leave the building.',
    tone: 'blue' as Tone,
  },
  {
    step: '03',
    title: 'ANONYMOUS DETECTION',
    detail: 'People become bounding boxes and temporary numeric track IDs. No face recognition, ever.',
    tone: 'purple' as Tone,
  },
  {
    step: '04',
    title: 'EVENT DATA',
    detail: 'Only structured events survive — counts, dwell, fill rates, queue depth. Frames are discarded.',
    tone: 'lime' as Tone,
  },
  {
    step: '05',
    title: 'INSIGHTS',
    detail: 'Aggregate dashboards to the cloud over an encrypted channel. Reversible identity: none.',
    tone: 'yellow' as Tone,
  },
];

export const PRIVACY_FACTS = [
  { label: 'FRAME RETENTION', value: '0 SECONDS', detail: 'Frames are dropped the moment inference completes.' },
  { label: 'ON-DEVICE INFERENCE', value: '100%', detail: 'YOLO v8n runs on the in-store edge box.' },
  { label: 'FACE RECOGNITION', value: 'DISABLED', detail: 'Not present in the model graph. Cannot be enabled remotely.' },
  { label: 'TRACK ID LIFETIME', value: '20 MIN', detail: 'Numeric IDs recycle when a person leaves the store.' },
  { label: 'EVENT RETENTION', value: '30 DAYS', detail: 'Aggregate counts only, configurable per store.' },
];

/* ============================================================
   LABELS
   ============================================================ */
export const ALERT_FILTERS: { id: AlertLevel | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'critical', label: 'CRITICAL' },
  { id: 'warning', label: 'WARNING' },
  { id: 'info', label: 'INFO' },
  { id: 'resolved', label: 'RESOLVED' },
];

export const DATE_FILTERS = ['TODAY', '7 DAYS', '30 DAYS', 'CUSTOM'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const TONE_BY_LEVEL: Record<AlertLevel, Tone> = {
  critical: 'coral',
  warning: 'yellow',
  info: 'blue',
  resolved: 'lime',
};
