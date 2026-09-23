import { useState } from 'react';
import {
  Bell,
  Boxes,
  Building2,
  Camera as CameraIcon,
  Cpu,
  Lock,
  Palette,
  Plug,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/app-state';
import { CAMERAS, STORES } from '@/lib/mock-data';
import { TONE_SOLID } from '@/lib/tone';
import {
  BrutalButton,
  BrutalCard,
  SectionHeading,
  SegmentBar,
  StatusBadge,
} from '@/components/brutal';
import { Field, Select, Slider, TextInput, Toggle } from '@/components/brutal/Form';
import { Page, Stack } from '@/components/layout/Page';

const TABS = [
  { id: 'store', label: 'STORE', icon: Building2 },
  { id: 'appearance', label: 'APPEARANCE', icon: Palette },
  { id: 'cameras', label: 'CAMERAS', icon: CameraIcon },
  { id: 'alerts', label: 'ALERT THRESHOLDS', icon: Bell },
  { id: 'model', label: 'AI MODEL', icon: Cpu },
  { id: 'integration', label: 'POS / ERP', icon: Plug },
  { id: 'users', label: 'USERS', icon: Users },
  { id: 'privacy', label: 'PRIVACY', icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]['id'];

const USERS_LIST = [
  { name: 'A. KRISHNAN', email: 'manager@retail.ai', role: 'STORE MANAGER', last: 'ACTIVE NOW', tone: 'lime' as const },
  { name: 'R. IYER', email: 'floor@retail.ai', role: 'FLOOR ASSOCIATE', last: '12 MIN AGO', tone: 'blue' as const },
  { name: 'S. NADAR', email: 'frontend@retail.ai', role: 'FRONT-END LEAD', last: '1 H AGO', tone: 'blue' as const },
  { name: 'M. FERNANDES', email: 'it@retail.ai', role: 'IT / FACILITIES', last: 'YESTERDAY', tone: 'purple' as const },
  { name: 'P. RAO', email: 'compliance@retail.ai', role: 'COMPLIANCE (READ ONLY)', last: '3 DAYS AGO', tone: 'ink' as const },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('store');
  const { reduceMotion, setReduceMotion } = useAppState();

  // Store
  const [storeName, setStoreName] = useState<string>(STORES[0].name);
  const [storeId, setStoreId] = useState<string>(STORES[0].id);
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:30');
  const [autoTrading, setAutoTrading] = useState(true);

  // Alerts
  const [queueThreshold, setQueueThreshold] = useState(4);
  const [waitThreshold, setWaitThreshold] = useState(5);
  const [fillThreshold, setFillThreshold] = useState(65);
  const [offlineThreshold, setOfflineThreshold] = useState(10);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  // Model
  const [model, setModel] = useState('yolov8n-retail-v3.4');
  const [confidence, setConfidence] = useState(72);
  const [resolution, setResolution] = useState('1280 × 720');
  const [detectShelves, setDetectShelves] = useState(true);
  const [detectPeople, setDetectPeople] = useState(true);
  const [detectQueues, setDetectQueues] = useState(true);
  const [nightlyRetrain, setNightlyRetrain] = useState(true);

  // Integration
  const [posSystem, setPosSystem] = useState('SAP RETAIL BRIDGE');
  const [syncInterval, setSyncInterval] = useState('5 MIN');
  const [webhook, setWebhook] = useState('https://ops.retail.ai/hooks/edge-01');
  const [offlineBuffer, setOfflineBuffer] = useState(true);

  // Privacy
  const [retention, setRetention] = useState(30);
  const [aggregateOnly, setAggregateOnly] = useState(true);
  const [clipStorage, setClipStorage] = useState(false);

  const [camEnabled, setCamEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(CAMERAS.map((c) => [c.id, c.status !== 'offline'])),
  );

  return (
    <Page
      index="CONFIG"
      eyebrow="PLATFORM CONFIGURATION"
      title="SETTINGS"
      description="Store configuration, camera enrolment, alert thresholds, model settings, POS integration, users and privacy — all in one control panel."
      tone="ink"
      actions={
        <>
          <StatusBadge tone="lime" size="lg" dot>
            CONFIG SYNCED
          </StatusBadge>
          <BrutalButton variant="primary" icon={<Save strokeWidth={3} />}>
            SAVE ALL
          </BrutalButton>
        </>
      }
    >
      <Stack gap="lg">
        {/* Tab rail */}
        <div className="flex flex-wrap gap-2 border-3 border-ink bg-paper p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={cn(
                  'press-sm inline-flex items-center gap-2 rounded-brutal border-3 border-ink px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-mega',
                  active ? 'bg-ink text-paper' : 'bg-surface text-muted',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', active && 'text-lime')} strokeWidth={3} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ---------------- STORE ---------------- */}
        {tab === 'store' && (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <BrutalCard title="STORE CONFIGURATION" subtitle="IDENTITY & TRADING HOURS" tone="blue">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="STORE NAME" required>
                  <TextInput value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </Field>
                <Field label="STORE CODE" hint="SHOWN ON EVERY EXPORT">
                  <TextInput value={storeId} onChange={(e) => setStoreId(e.target.value)} />
                </Field>
                <Field label="TIMEZONE">
                  <TextInput value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </Field>
                <Field label="FLOOR AREA">
                  <TextInput defaultValue={STORES[0].area} />
                </Field>
                <Field label="OPENS AT">
                  <TextInput type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                </Field>
                <Field label="CLOSES AT">
                  <TextInput type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <Toggle
                  label="AUTO TRADING-HOURS MODE"
                  detail="Suspends alerts and predictions outside trading hours to avoid false escalations."
                  checked={autoTrading}
                  onChange={setAutoTrading}
                  tone="blue"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t-3 border-dashed border-ink/25 pt-4">
                <BrutalButton variant="primary" icon={<Save strokeWidth={3} />}>
                  SAVE STORE
                </BrutalButton>
                <BrutalButton variant="secondary">RESET</BrutalButton>
              </div>
            </BrutalCard>

            <BrutalCard title="DEPLOYMENT" subtitle="EDGE NODE ASSIGNMENT" padding="md">
              <dl className="grid gap-3">
                {[
                  { k: 'EDGE DEVICE', v: 'EDGE-01 · JETSON ORIN NANO' },
                  { k: 'FIRMWARE', v: '1.4.0-rc3' },
                  { k: 'CAMERAS ENROLLED', v: `${CAMERAS.length} DEVICES` },
                  { k: 'LOCAL STORAGE', v: '412 GB / 528 GB' },
                  { k: 'SYNC TRANSPORT', v: 'MTLS · AES-256-GCM' },
                ].map((row) => (
                  <div key={row.k} className="rounded-brutal border-3 border-ink bg-ink/[0.03] p-3">
                    <dt className="font-mono text-[9px] uppercase tracking-mega text-muted">{row.k}</dt>
                    <dd className="mt-1 text-[11px] font-bold uppercase tracking-wide">{row.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 border-t-3 border-dashed border-ink/25 pt-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-mega text-muted">
                  LOCAL STORAGE PRESSURE
                </p>
                <SegmentBar value={78} segments={20} height="sm" tone="yellow" showValue />
              </div>
            </BrutalCard>
          </div>
        )}

        {/* ---------------- APPEARANCE ---------------- */}
        {tab === 'appearance' && (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <BrutalCard title="APPEARANCE" subtitle="ONE FIXED LIGHT THEME" tone="purple">
              <p className="text-sm leading-relaxed text-muted">
                The platform ships in a single theme: an off-white paper base with black structure.
                Nothing is switchable, so every screen an operator sees looks the same.
              </p>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  { tone: 'lime' as const, k: 'LIME', v: 'HEALTHY / NORMAL' },
                  { tone: 'coral' as const, k: 'CORAL', v: 'CRITICAL ALERT' },
                  { tone: 'yellow' as const, k: 'YELLOW', v: 'WARNING' },
                  { tone: 'blue' as const, k: 'BLUE', v: 'ANALYTICS / DATA' },
                  { tone: 'purple' as const, k: 'PURPLE', v: 'AI / PREDICTION' },
                  { tone: 'ink' as const, k: 'INK', v: 'STRUCTURE / TEXT' },
                ].map((row) => (
                  <li
                    key={row.k}
                    className="flex items-center gap-2.5 rounded-brutal border-3 border-ink bg-ink/[0.03] px-3 py-2"
                  >
                    <span
                      className={cn('h-3.5 w-3.5 shrink-0 border-2 border-ink', TONE_SOLID[row.tone])}
                    />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
                      {row.k}
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted">
                      {row.v}
                    </span>
                  </li>
                ))}
              </ul>
            </BrutalCard>

            <Stack gap="sm">
              <BrutalCard title="TOKEN PREVIEW" subtitle="CURRENTLY APPLIED" padding="md">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: 'PAPER', cls: 'bg-paper' },
                    { k: 'SURFACE', cls: 'bg-surface' },
                    { k: 'INK', cls: 'bg-ink' },
                  ].map((s) => (
                    <div key={s.k}>
                      <div className={cn('h-12 rounded-brutal border-3 border-ink', s.cls)} />
                      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-mega text-muted">
                        {s.k}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[
                    { k: 'BLUE', cls: 'bg-blue' },
                    { k: 'LIME', cls: 'bg-lime' },
                    { k: 'YELLOW', cls: 'bg-yellow' },
                    { k: 'CORAL', cls: 'bg-coral' },
                    { k: 'PURPLE', cls: 'bg-purple' },
                  ].map((s) => (
                    <div key={s.k}>
                      <div className={cn('h-9 rounded-brutal border-3 border-ink', s.cls)} />
                      <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-wider text-muted">
                        {s.k}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 border-t-3 border-dashed border-ink/25 pt-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  ACCENT COLOURS CARRY MEANING: GREEN HEALTHY, RED CRITICAL, YELLOW
                  WARNING, BLUE ANALYTICS, PURPLE AI.
                </p>
              </BrutalCard>

              <BrutalCard title="DISPLAY PREFERENCES" padding="md">
                <Toggle
                  label="REDUCE MOTION"
                  detail="Stops the button travel, card lift, live pulses and chart animations. Seeded from your operating system preference."
                  checked={reduceMotion}
                  onChange={setReduceMotion}
                  tone="blue"
                />
                <div className="flex items-start gap-3 pt-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-coral" strokeWidth={3} />
                  <p className="font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                    HIGH-CONTRAST MODE IS ALWAYS ON. BORDERS ARE NEVER THINNER THAN 3PX AND TEXT IS
                    NEVER PLACED ON A BLURRED SURFACE.
                  </p>
                </div>
              </BrutalCard>
            </Stack>
          </div>
        )}

        {/* ---------------- CAMERAS ---------------- */}
        {tab === 'cameras' && (
          <Stack gap="sm">
            <SectionHeading
              index="CAM"
              eyebrow="ENROLMENT"
              title="CAMERA CONFIGURATION"
              description="Only enabled cameras are decoded by the edge device. Disabling a camera removes its zone from tracking and forecasting."
              size="md"
              tone="blue"
            />
            <BrutalCard padding="none">
              <ul>
                {CAMERAS.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 border-b-3 border-ink/15 px-4 py-3.5 last:border-b-0"
                  >
                    <span className={cn('h-3.5 w-3.5 shrink-0 border-2 border-ink', TONE_SOLID.blue)} />
                    <span className="min-w-[150px] flex-1">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-wider">
                        {c.id} · {c.name}
                      </span>
                      <span className="block font-mono text-[10px] uppercase text-muted">
                        {c.zone} · {c.resolution} · {c.fps} FPS
                      </span>
                    </span>
                    <StatusBadge
                      tone={c.status === 'online' ? 'lime' : c.status === 'warning' ? 'yellow' : 'coral'}
                      size="sm"
                    >
                      {c.status.toUpperCase()}
                    </StatusBadge>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-mega text-muted">
                        {camEnabled[c.id] ? 'ENABLED' : 'DISABLED'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={camEnabled[c.id]}
                        aria-label={`Toggle ${c.id}`}
                        onClick={() => setCamEnabled((p) => ({ ...p, [c.id]: !p[c.id] }))}
                        className={cn('toggle-track', camEnabled[c.id] && 'bg-lime')}
                      >
                        <span
                          className={cn(
                            'toggle-knob',
                            camEnabled[c.id] ? 'left-0 bg-lime' : 'right-0 bg-surface',
                          )}
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </BrutalCard>

            <div className="grid gap-5 xl:grid-cols-2">
              <BrutalCard title="STREAM DEFAULTS" subtitle="APPLIED TO NEW CAMERAS">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="DECODE RESOLUTION">
                    <Select defaultValue="1080p">
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                    </Select>
                  </Field>
                  <Field label="TRANSPORT">
                    <Select defaultValue="RTSP">
                      <option value="RTSP">RTSP</option>
                      <option value="ONVIF">ONVIF</option>
                      <option value="HLS">HLS</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-2">
                  <Slider label="TARGET FRAME RATE" value={30} min={5} max={60} step={5} unit=" FPS" onChange={() => {}} />
                  <Slider label="JPEG SNAPSHOT QUALITY" value={80} onChange={() => {}} />
                </div>
              </BrutalCard>

              <BrutalCard title="UNWATCHED ZONES" subtitle="COVERAGE GAPS RIGHT NOW" padding="md">
                <ul className="flex flex-col gap-3">
                  {[
                    { zone: 'AISLE 03 · DAIRY BAYS', reason: 'CAM-04 OFFLINE · 42 MIN', tone: 'coral' as const },
                    { zone: 'CHECKOUT 01', reason: 'CAM-03 DEGRADED · 18 FPS', tone: 'yellow' as const },
                  ].map((gap) => (
                    <li
                      key={gap.zone}
                      className={cn('rounded-brutal border-3 border-ink p-3', TONE_SOLID[gap.tone])}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink">
                        {gap.zone}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/70">
                        {gap.reason}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  FORECASTS FOR THESE ZONES ARE MARKED LOW-CONFIDENCE UNTIL COVERAGE RETURNS.
                </p>
              </BrutalCard>
            </div>
          </Stack>
        )}

        {/* ---------------- ALERTS ---------------- */}
        {tab === 'alerts' && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <BrutalCard title="ALERT THRESHOLDS" subtitle="WHAT CROSSES THE LINE" tone="yellow">
              <Slider
                label="QUEUE DEPTH BEFORE WARNING"
                value={queueThreshold}
                min={1}
                max={12}
                unit=" PEOPLE"
                onChange={setQueueThreshold}
              />
              <Slider
                label="MAXIMUM ACCEPTABLE WAIT"
                value={waitThreshold}
                min={1}
                max={15}
                unit=" MIN"
                onChange={setWaitThreshold}
              />
              <Slider
                label="SHELF FILL WARNING FLOOR"
                value={fillThreshold}
                onChange={setFillThreshold}
              />
              <Slider
                label="CAMERA OFFLINE BEFORE CRITICAL"
                value={offlineThreshold}
                min={1}
                max={60}
                unit=" MIN"
                onChange={setOfflineThreshold}
              />

              <div className="mt-5 flex flex-wrap gap-2 border-t-3 border-dashed border-ink/25 pt-4">
                <BrutalButton variant="primary" icon={<Save strokeWidth={3} />}>
                  APPLY THRESHOLDS
                </BrutalButton>
                <BrutalButton variant="secondary">RESTORE DEFAULTS</BrutalButton>
              </div>
            </BrutalCard>

            <Stack gap="sm">
              <BrutalCard title="NOTIFICATION CHANNELS" padding="md">
                <Toggle
                  label="PUSH TO STORE TABLET"
                  detail="Instant banner on the wall display and manager tablet."
                  checked={notifyPush}
                  onChange={setNotifyPush}
                  tone="lime"
                />
                <Toggle
                  label="EMAIL DIGEST"
                  detail="Critical alerts immediately, warnings batched hourly."
                  checked={notifyEmail}
                  onChange={setNotifyEmail}
                  tone="blue"
                />
                <Toggle
                  label="SMS ESCALATION"
                  detail="Only for unacknowledged critical alerts after 5 minutes."
                  checked={notifySms}
                  onChange={setNotifySms}
                  tone="coral"
                />
              </BrutalCard>

              <BrutalCard title="ESCALATION PREVIEW" subtitle="HOW THE CURRENT SETTINGS BEHAVE" padding="md">
                <ul className="flex flex-col gap-3">
                  {[
                    { label: 'CRITICAL ALERTS PER DAY', value: 18, tone: 'coral' as const },
                    { label: 'WARNING ALERTS PER DAY', value: 42, tone: 'yellow' as const },
                    { label: 'INFO NOTIFICATIONS', value: 61, tone: 'blue' as const },
                    { label: 'EXPECTED FALSE POSITIVES', value: 6, tone: 'lime' as const },
                  ].map((s) => (
                    <li key={s.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {s.label}
                        </span>
                        <span className="font-mono text-[10px] font-bold tnum">{s.value}</span>
                      </div>
                      <SegmentBar value={Math.min(100, s.value * 1.6)} segments={16} height="xs" tone={s.tone} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t-3 border-dashed border-ink/25 pt-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  ESTIMATED FROM THE LAST 30 DAYS OF EVENT HISTORY FOR {STORES[0].id}.
                </p>
              </BrutalCard>
            </Stack>
          </div>
        )}

        {/* ---------------- MODEL ---------------- */}
        {tab === 'model' && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <BrutalCard title="AI MODEL SETTINGS" subtitle="INFERENCE & DETECTION TARGETS" tone="purple">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="MODEL" hint="DEPLOYED TO EDGE-01">
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option value="yolov8n-retail-v3.4">YOLOv8n · retail v3.4</option>
                    <option value="yolov8s-retail-v3.4">YOLOv8s · retail v3.4</option>
                    <option value="yolov8n-retail-v3.2">YOLOv8n · retail v3.2 (legacy)</option>
                  </Select>
                </Field>
                <Field label="INFERENCE RESOLUTION">
                  <Select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                    <option value="640 × 640">640 × 640</option>
                    <option value="1280 × 720">1280 × 720</option>
                    <option value="1920 × 1080">1920 × 1080</option>
                  </Select>
                </Field>
                <Field label="RETRAIN WINDOW">
                  <Select defaultValue="NIGHTLY 02:00 IST">
                    <option value="NIGHTLY 02:00 IST">NIGHTLY · 02:00 IST</option>
                    <option value="WEEKLY SUNDAY">WEEKLY · SUNDAY</option>
                    <option value="MANUAL">MANUAL ONLY</option>
                  </Select>
                </Field>
                <Field label="EDGE DEVICE">
                  <Select defaultValue="EDGE-01">
                    <option value="EDGE-01">EDGE-01 · JETSON ORIN NANO</option>
                    <option value="EDGE-02">EDGE-02 · JETSON ORIN NX</option>
                  </Select>
                </Field>
              </div>

              <div className="mt-4">
                <Slider
                  label="DETECTION CONFIDENCE FLOOR"
                  value={confidence}
                  min={40}
                  max={95}
                  onChange={setConfidence}
                />
                <Toggle
                  label="SHELF / EMPTY-BAY DETECTION"
                  detail="Detects facings per bay and flags empty bays."
                  checked={detectShelves}
                  onChange={setDetectShelves}
                  tone="yellow"
                />
                <Toggle
                  label="ANONYMOUS PERSON TRACKING"
                  detail="Numeric track IDs with a 20 minute lifetime. No identity is derived."
                  checked={detectPeople}
                  onChange={setDetectPeople}
                  tone="lime"
                />
                <Toggle
                  label="QUEUE POLYGON MONITORING"
                  detail="Counts people inside the checkout queue zones."
                  checked={detectQueues}
                  onChange={setDetectQueues}
                  tone="blue"
                />
                <Toggle
                  label="NIGHTLY EDGE RETRAIN"
                  detail="Adapts to this store's own layout and traffic using event data only."
                  checked={nightlyRetrain}
                  onChange={setNightlyRetrain}
                  tone="purple"
                />
              </div>
            </BrutalCard>

            <Stack gap="sm">
              <BrutalCard title="MODEL PERFORMANCE" subtitle="MEASURED ON THIS STORE" padding="md">
                <ul className="flex flex-col gap-3.5">
                  {[
                    { label: 'EMPTY SHELF PRECISION', value: 96 },
                    { label: 'PERSON RECALL', value: 94 },
                    { label: 'QUEUE COUNT ACCURACY', value: 91 },
                    { label: 'FALSE POSITIVE RATE', value: 12 },
                  ].map((m) => (
                    <li key={m.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {m.label}
                        </span>
                        <span className="font-mono text-[10px] font-bold tnum">{m.value}%</span>
                      </div>
                      <SegmentBar
                        value={m.value}
                        segments={18}
                        height="xs"
                        tone={m.label.includes('FALSE') ? 'coral' : 'purple'}
                      />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t-3 border-dashed border-ink/25 pt-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  VALIDATED ON {STORES[0].id} OVER 30 DAYS AGAINST MANUAL AUDITS.
                </p>
              </BrutalCard>

              <BrutalCard padding="md">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-coral" strokeWidth={3} />
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-mega">
                      FACE RECOGNITION IS NOT AVAILABLE
                    </p>
                    <p className="mt-1.5 text-[12px] leading-snug text-muted">
                      The capability is absent from the model graph and cannot be enabled from this
                      panel or remotely by support. This is an architectural constraint, not a
                      setting.
                    </p>
                  </div>
                </div>
              </BrutalCard>
            </Stack>
          </div>
        )}

        {/* ---------------- INTEGRATION ---------------- */}
        {tab === 'integration' && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <BrutalCard title="POS / ERP INTEGRATION" subtitle="BRIDGE TO TRANSACTION DATA" tone="lime">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="POS / ERP SYSTEM" required>
                  <Select value={posSystem} onChange={(e) => setPosSystem(e.target.value)}>
                    <option value="SAP RETAIL BRIDGE">SAP Retail Bridge</option>
                    <option value="TALLY PRIME">Tally Prime</option>
                    <option value="ZOHO INVENTORY">Zoho Inventory</option>
                    <option value="SHOPIFY POS">Shopify POS</option>
                    <option value="CUSTOM REST">Custom REST</option>
                  </Select>
                </Field>
                <Field label="SYNC INTERVAL">
                  <Select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)}>
                    <option value="1 MIN">1 MINUTE</option>
                    <option value="5 MIN">5 MINUTES</option>
                    <option value="15 MIN">15 MINUTES</option>
                    <option value="HOURLY">HOURLY</option>
                  </Select>
                </Field>
                <Field label="STORE IDENTIFIER (ERP)" hint="MAPPED TO STORE CODE">
                  <TextInput defaultValue="BLR014" />
                </Field>
                <Field label="WEBHOOK ENDPOINT" hint="RECEIVES ESCALATED ALERTS">
                  <TextInput value={webhook} onChange={(e) => setWebhook(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <Toggle
                  label="OFFLINE-FIRST EVENT BUFFER"
                  detail="Events queue locally on the edge device while the network is down, then replay in order. The store keeps working with no internet."
                  checked={offlineBuffer}
                  onChange={setOfflineBuffer}
                  tone="lime"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t-3 border-dashed border-ink/25 pt-4">
                <BrutalButton variant="primary" icon={<Save strokeWidth={3} />}>
                  SAVE INTEGRATION
                </BrutalButton>
                <BrutalButton variant="secondary">TEST CONNECTION</BrutalButton>
                <BrutalButton variant="ghost">VIEW SYNC LOG</BrutalButton>
              </div>
            </BrutalCard>

            <Stack gap="sm">
              <BrutalCard title="BRIDGE STATUS" subtitle="LIVE" padding="md">
                <ul className="flex flex-col gap-3">
                  {[
                    { k: 'CONNECTION', v: 'CONNECTED', tone: 'lime' as const },
                    { k: 'LAST SYNC', v: '2 MIN AGO', tone: 'lime' as const },
                    { k: 'TRANSACTIONS RECONCILED', v: '1,284', tone: 'blue' as const },
                    { k: 'EVENTS QUEUED OFFLINE', v: '0', tone: 'lime' as const },
                    { k: 'UNMATCHED BASKETS', v: '7', tone: 'yellow' as const },
                  ].map((row) => (
                    <li key={row.k} className="flex items-center gap-3">
                      <span className={cn('h-3 w-3 shrink-0 border-2 border-ink', TONE_SOLID[row.tone])} />
                      <span className="flex-1 font-mono text-[10px] uppercase tracking-mega text-muted">
                        {row.k}
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase tnum">{row.v}</span>
                    </li>
                  ))}
                </ul>
              </BrutalCard>

              <BrutalCard title="WHY THE BRIDGE MATTERS" padding="md">
                <ul className="flex flex-col gap-2.5">
                  {[
                    'Conversion rate = transactions ÷ anonymous entries',
                    'Sell-through rate sharpens stock-out forecasts',
                    'Basket size predicts queue pressure before it forms',
                    'Category performance ties footfall to revenue',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-lime" strokeWidth={2.8} />
                      <span className="text-[12px] leading-snug text-muted">{t}</span>
                    </li>
                  ))}
                </ul>
              </BrutalCard>
            </Stack>
          </div>
        )}

        {/* ---------------- USERS ---------------- */}
        {tab === 'users' && (
          <Stack gap="sm">
            <SectionHeading
              index="USR"
              eyebrow="ACCESS CONTROL"
              title="USER MANAGEMENT"
              description="Role-based access. Compliance roles are read-only by construction and can export audit reports without seeing operational controls."
              size="md"
              tone="blue"
              right={
                <BrutalButton variant="primary" icon={<UserPlus strokeWidth={3} />}>
                  INVITE USER
                </BrutalButton>
              }
            />
            <BrutalCard padding="none">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="border-b-3 border-ink bg-ink/[0.04]">
                      {['USER', 'EMAIL', 'ROLE', 'LAST ACTIVE', 'ACCESS'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left font-mono text-[9px] font-bold uppercase tracking-mega text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {USERS_LIST.map((u) => (
                      <tr key={u.email} className="border-b-3 border-ink/15 last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center border-3 border-ink bg-ink font-mono text-[10px] font-bold text-paper">
                              {u.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wide">
                              {u.name}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-muted">{u.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={u.tone} size="sm">
                            {u.role}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] uppercase text-muted">
                          {u.last}
                        </td>
                        <td className="px-4 py-3">
                          <BrutalButton variant="secondary" size="sm">
                            MANAGE
                          </BrutalButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BrutalCard>
          </Stack>
        )}

        {/* ---------------- PRIVACY ---------------- */}
        {tab === 'privacy' && (
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <BrutalCard title="PRIVACY SETTINGS" subtitle="RETENTION & DATA FLOW" tone="purple">
              <Slider
                label="EVENT RETENTION"
                value={retention}
                min={7}
                max={90}
                unit=" DAYS"
                onChange={setRetention}
              />
              <Toggle
                label="AGGREGATE-ONLY CLOUD SYNC"
                detail="Send store totals to the cloud. Per-track data stays on the edge device."
                checked={aggregateOnly}
                onChange={setAggregateOnly}
                tone="blue"
              />
              <Toggle
                label="STORE ANOMALY CLIPS LOCALLY"
                detail="Off by default. Short clips are kept locally for 24 hours to help tune the model."
                checked={clipStorage}
                onChange={setClipStorage}
                tone="coral"
              />

              <div className="mt-4 rounded-brutal border-3 border-ink bg-ink/[0.04] p-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-mega">
                  <Lock className="h-3.5 w-3.5" strokeWidth={3} />
                  ARCHITECTURALLY LOCKED
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {[
                    'FACE RECOGNITION — NOT PRESENT IN THE MODEL',
                    'RAW FRAME STORAGE — 0 SECONDS',
                    'CROSS-STORE TRACK LINKING — IMPOSSIBLE BY DESIGN',
                  ].map((t) => (
                    <li
                      key={t}
                      className="font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t-3 border-dashed border-ink/25 pt-4">
                <BrutalButton variant="primary" icon={<Save strokeWidth={3} />}>
                  SAVE PRIVACY SETTINGS
                </BrutalButton>
                <BrutalButton variant="danger" icon={<Trash2 strokeWidth={3} />}>
                  PURGE STORE DATA
                </BrutalButton>
              </div>
            </BrutalCard>

            <Stack gap="sm">
              <BrutalCard title="DATA FLOW SUMMARY" subtitle="WHAT LEAVES THE BUILDING" padding="md">
                <ul className="flex flex-col gap-3.5">
                  {[
                    { label: 'RAW VIDEO FRAMES', value: 0, tone: 'lime' as const },
                    { label: 'BOUNDING BOXES + TRACK IDS', value: 0, tone: 'lime' as const },
                    { label: 'AGGREGATE COUNTS', value: 8, tone: 'blue' as const },
                    { label: 'CONFIG & TELEMETRY', value: 3, tone: 'yellow' as const },
                  ].map((row) => (
                    <li key={row.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {row.label}
                        </span>
                        <span className="font-mono text-[10px] font-bold tnum">
                          {row.value}%
                        </span>
                      </div>
                      <SegmentBar value={row.value} segments={16} height="xs" tone={row.tone} />
                    </li>
                  ))}
                </ul>
              </BrutalCard>

              <BrutalCard padding="md">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple" strokeWidth={3} />
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-mega">
                      COMPLIANCE POSTURE
                    </p>
                    <p className="mt-1.5 text-[12px] leading-snug text-muted">
                      Designed to satisfy DPDP Act 2023 principles for physical-space analytics:
                      purpose limitation, data minimisation, storage limitation and no identity
                      processing. A privacy impact assessment document ships with the deployment.
                    </p>
                  </div>
                </div>
              </BrutalCard>
            </Stack>
          </div>
        )}
      </Stack>
    </Page>
  );
}
