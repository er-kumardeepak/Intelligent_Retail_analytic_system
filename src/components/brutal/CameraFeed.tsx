import { cn } from '@/lib/utils';
import { CAMERA_TONE, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { Camera, Tone } from '@/lib/types';

/* The feed is drawn in the same language as the rest of the platform: paper
   ground, ink structure, accent detection boxes. Nothing is inverted, so the
   card sits in the layout without a dark rectangle punched through it. */
const SCREEN = '#F5F1E8';
const FIGURE = '#111111';
const SHELF_BODY = '#FFFFFF';
const SHELF_EDGE = '#111111';
const PRODUCT = '#111111';
const COUNTER = '#FFFFFF';
const COUNTER_TOP = '#E4DFD3';

const NEON: Record<'person' | 'shelf' | 'queue' | 'low' | 'empty', string> = {
  person: '#2563EB',
  shelf: '#8B5CF6',
  queue: '#FACC15',
  low: '#FF5A5F',
  empty: '#FF5A5F',
};

function labelWidth(text: string) {
  return text.length * 7.6 + 18;
}

interface DetectionProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  hazard?: boolean;
}

function Detection({ x, y, w, h, label, color, hazard }: DetectionProps) {
  const lw = labelWidth(label);
  const corner = 16;
  return (
    <g>
      {hazard && <rect x={x} y={y} width={w} height={h} fill="url(#cv-hazard)" />}
      <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={hazard ? 0.08 : 0.1} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={2.5} />

      {/* Corner ticks — thicker, so the box reads like a viewer overlay */}
      <path d={`M${x} ${y + corner} L${x} ${y} L${x + corner} ${y}`} stroke={color} strokeWidth={6} fill="none" />
      <path d={`M${x + w - corner} ${y} L${x + w} ${y} L${x + w} ${y + corner}`} stroke={color} strokeWidth={6} fill="none" />
      <path d={`M${x} ${y + h - corner} L${x} ${y + h} L${x + corner} ${y + h}`} stroke={color} strokeWidth={6} fill="none" />
      <path
        d={`M${x + w - corner} ${y + h} L${x + w} ${y + h} L${x + w} ${y + h - corner}`}
        stroke={color}
        strokeWidth={6}
        fill="none"
      />

      {/* Label tag — a printed sticker on the screen */}
      <rect x={x} y={y - 22} width={lw} height={21} fill={color} stroke={SCREEN} strokeWidth={2} />
      <text
        x={x + 9}
        y={y - 7}
        fill="#111111"
        fontSize={12}
        fontWeight={700}
        letterSpacing={0.9}
        fontFamily='"IBM Plex Mono", monospace'
      >
        {label}
      </text>
    </g>
  );
}

function Figure({ cx, baseY, scale = 1 }: { cx: number; baseY: number; scale?: number }) {
  const head = 9 * scale;
  const bodyW = 22 * scale;
  const bodyH = 34 * scale;
  return (
    <g>
      <rect x={cx - bodyW / 2} y={baseY - bodyH - head * 1.6} width={bodyW} height={bodyH} fill={FIGURE} />
      <circle cx={cx} cy={baseY - bodyH - head * 2.4} r={head} fill={FIGURE} />
      <rect x={cx - bodyW / 2 + 2} y={baseY - 12} width={7} height={12} fill={FIGURE} />
      <rect x={cx + bodyW / 2 - 9} y={baseY - 12} width={7} height={12} fill={FIGURE} />
    </g>
  );
}

function ShelfUnit({
  x,
  y,
  w,
  h,
  rows,
  id,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rows: number[];
  id: string;
}) {
  const rowH = h / rows.length;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={SHELF_BODY} stroke={SHELF_EDGE} strokeWidth={3} />
      {rows.map((fill, r) => {
        const ry = y + rowH * r;
        const slots = 7;
        const pad = 10;
        const slotW = (w - pad * 2 - (slots - 1) * 4) / slots;
        const filled = Math.round(fill * slots);
        return (
          <g key={`${id}-row-${r}`}>
            <line x1={x} y1={ry + rowH} x2={x + w} y2={ry + rowH} stroke={SHELF_EDGE} strokeWidth={3} />
            {Array.from({ length: slots }).map((_, s) =>
              s < filled ? (
                <rect
                  key={`${id}-${r}-${s}`}
                  x={x + pad + s * (slotW + 4)}
                  y={ry + rowH * 0.32}
                  width={slotW}
                  height={rowH * 0.5}
                  fill={PRODUCT}
                />
              ) : null,
            )}
          </g>
        );
      })}
    </g>
  );
}

export interface CameraFeedProps {
  camera: Camera;
  queue: number;
  shelfFill: number;
  persons: number;
  className?: string;
  /** Hide the bottom telemetry strip for a tighter embed. */
  compact?: boolean;
  /** Set false when the feed already sits inside a bordered card. */
  framed?: boolean;
}

export function CameraFeed({
  camera,
  queue,
  shelfFill,
  persons,
  className,
  compact = false,
  framed = true,
}: CameraFeedProps) {
  const queuePeople = Math.max(1, Math.min(5, queue));
  const degraded = camera.status !== 'online';

  const stats: { label: string; value: string; tone: Tone }[] = [
    { label: 'QUEUE DEPTH', value: `${queue}`, tone: queue > 4 ? 'coral' : 'lime' },
    { label: 'SHELF FILL', value: `${shelfFill}%`, tone: shelfFill < 80 ? 'yellow' : 'lime' },
    { label: 'PERSONS IN FRAME', value: `${queuePeople + 5}`, tone: 'blue' },
    { label: 'TRACKED IN STORE', value: `${persons}`, tone: 'purple' },
  ];

  return (
    <div
      className={cn(
        'overflow-hidden bg-paper',
        framed && 'rounded-brutal border-3 border-ink',
        className,
      )}
    >
      <div className="relative">
        <svg viewBox="0 0 900 500" className="block w-full" role="img" aria-label={`Live vision feed from ${camera.id}`}>
          <defs>
            <pattern id="cv-grid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M45 0 L0 0 L0 45" fill="none" stroke="rgba(17,17,17,0.09)" strokeWidth="1" />
            </pattern>
            <pattern id="cv-hazard" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="12" height="12" fill="rgba(255,90,95,0.22)" />
              <rect width="6" height="12" fill="rgba(255,90,95,0.55)" />
            </pattern>
          </defs>

          <rect width="900" height="500" fill={SCREEN} />
          <rect width="900" height="500" fill="url(#cv-grid)" />

          {/* Floor perspective guides */}
          {[140, 250, 360, 450].map((y) => (
            <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="rgba(17,17,17,0.07)" strokeWidth="2" />
          ))}

          {/* Shelving */}
          <ShelfUnit id="A" x={40} y={120} w={170} h={230} rows={[1, 0.92, 0.86, 1]} />
          <ShelfUnit id="B" x={250} y={120} w={170} h={230} rows={[0.75, 0.4, 0, 0]} />

          {/* Aisle shopper */}
          <Figure cx={150} baseY={440} />
          <Figure cx={330} baseY={460} scale={1.05} />
          <Figure cx={432} baseY={420} scale={0.95} />

          {/* Checkout cashiers (behind the counter, so it occludes their legs) */}
          <Figure cx={600} baseY={345} scale={0.95} />
          <Figure cx={765} baseY={345} scale={0.95} />

          {/* Checkout counter */}
          <rect x="520" y="330" width="330" height="62" fill={COUNTER} stroke={SHELF_EDGE} strokeWidth="3" />
          <rect x="520" y="330" width="330" height="10" fill={COUNTER_TOP} />
          <rect x="612" y="330" width="3" height="62" fill={SHELF_EDGE} />
          {/* POS terminals */}
          <rect x="556" y="300" width="26" height="34" fill="#FFFFFF" stroke={SHELF_EDGE} strokeWidth="2" />
          <rect x="722" y="300" width="26" height="34" fill="#FFFFFF" stroke={SHELF_EDGE} strokeWidth="2" />

          {/* Queue */}
          {Array.from({ length: queuePeople }).map((_, i) => (
            <Figure key={`q-${i}`} cx={556 + i * 66} baseY={492} scale={0.92} />
          ))}

          {/* ---------- DETECTIONS ---------- */}
          <Detection x={34} y={114} w={182} h={242} label="SHELF 97%" color={NEON.shelf} />
          <Detection x={244} y={114} w={182} h={116} label="LOW STOCK 89%" color={NEON.low} />
          <Detection x={244} y={238} w={182} h={118} label="EMPTY SHELF 96%" color={NEON.empty} hazard />
          <Detection
            x={520}
            y={330}
            w={330}
            h={110}
            label={`QUEUE · ${queue} · 93%`}
            color={NEON.queue}
          />

          <Detection x={128} y={376} w={46} h={82} label="PERSON 0.98" color={NEON.person} />
          <Detection x={306} y={386} w={48} h={86} label="PERSON 0.94" color={NEON.person} />
          <Detection x={408} y={352} w={46} h={80} label="PERSON 0.91" color={NEON.person} />

          {queuePeople > 0 && (
            <Detection x={524} y={430} w={62} h={62} label="PERSON 0.96" color={NEON.person} />
          )}
          {queuePeople > 2 && (
            <Detection x={654} y={430} w={62} h={62} label="PERSON 0.93" color={NEON.person} />
          )}

          {/* Frame metadata, printed into the video signal */}
          <text
            x="20"
            y="484"
            fill="rgba(17,17,17,0.5)"
            fontSize={13}
            letterSpacing={1.4}
            fontFamily='"IBM Plex Mono", monospace'
          >
            {camera.id} / {camera.name} / {camera.resolution} / {camera.model}
          </text>
          <text
            x="880"
            y="484"
            textAnchor="end"
            fill="rgba(17,17,17,0.5)"
            fontSize={13}
            letterSpacing={1.4}
            fontFamily='"IBM Plex Mono", monospace'
          >
            EDGE-01 · {camera.latencyMs}MS · {camera.fps}FPS
          </text>
        </svg>

        {/* Sweeping scanline — the only motion inside the view */}
        <div className="scanline pointer-events-none absolute inset-x-0 top-0" aria-hidden="true" />

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 border-3 border-ink bg-surface px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-mega">
            {camera.id}
            <span className="text-muted">·</span>
            {camera.name}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 border-3 border-ink px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-mega',
              TONE_SOLID[CAMERA_TONE[camera.status]],
              'text-ink',
            )}
          >
            {camera.status.toUpperCase()}
          </span>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-2 border-3 border-ink bg-coral px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-mega text-ink">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 bg-ink" />
            <span className="absolute inset-0 animate-ping_soft bg-ink" />
          </span>
          LIVE
        </div>

        {degraded && (
          <div className="pointer-events-none absolute bottom-14 left-3 right-3 border-3 border-ink bg-yellow px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-mega text-ink">
            {camera.status === 'offline'
              ? `SIGNAL LOST · LAST FRAME ${camera.uptime === '—' ? '42 MIN AGO' : camera.uptime}`
              : 'DEGRADED SIGNAL · INFERENCE FALLBACK ACTIVE'}
          </div>
        )}
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-2 border-t-3 border-ink bg-surface p-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-3 border-ink bg-ink/[0.04] px-2.5 py-2">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-mega text-muted">
                {s.label}
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold leading-none tracking-tightest tnum',
                  TONE_TEXT[s.tone],
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
