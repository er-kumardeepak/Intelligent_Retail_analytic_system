import { useState, type ReactNode } from 'react';
import { Camera as CameraIcon, Layers, Radio, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAMERA_TONE, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { CAMERAS, STORE_ZONES } from '@/lib/mock-data';
import type { Camera, PersonDot, StoreZone } from '@/lib/types';
import { SegmentBar } from './SegmentBar';

export interface StoreMapProps {
  zones?: StoreZone[];
  dots?: PersonDot[];
  cameras?: Camera[];
  className?: string;
  selectedZone?: string;
  onSelectZone?: (zoneId: string) => void;
}

export function StoreMap({
  zones = STORE_ZONES,
  dots = [],
  cameras = CAMERAS,
  className,
  selectedZone,
  onSelectZone,
}: StoreMapProps) {
  const [showHeat, setShowHeat] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showCams, setShowCams] = useState(true);
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  const selected = selectedZone ?? localSelected;
  const activeZone = zones.find((z) => z.id === selected) ?? null;

  const handleSelect = (id: string) => {
    const next = id === selected ? null : id;
    setLocalSelected(next);
    onSelectZone?.(id);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <MapToggle active={showHeat} onClick={() => setShowHeat((v) => !v)} icon={<Layers className="h-3.5 w-3.5" strokeWidth={3} />}>
          HEAT
        </MapToggle>
        <MapToggle active={showDots} onClick={() => setShowDots((v) => !v)} icon={<Users className="h-3.5 w-3.5" strokeWidth={3} />}>
          TRACKS
        </MapToggle>
        <MapToggle active={showCams} onClick={() => setShowCams((v) => !v)} icon={<CameraIcon className="h-3.5 w-3.5" strokeWidth={3} />}>
          CAMERAS
        </MapToggle>
        <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-mega text-muted">
          <Radio className="h-3.5 w-3.5 animate-blink text-coral" strokeWidth={3} />
          {dots.length} ANONYMOUS TRACKS
        </span>
      </div>

      {/* Floor plan */}
      <div className="grid-paper relative w-full overflow-hidden rounded-brutal border-3 border-ink bg-paper">
        <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
          {/* Zones */}
          {zones.map((z) => {
            const isActive = z.id === selected;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => handleSelect(z.id)}
                aria-pressed={isActive}
                aria-label={z.label}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                }}
                className={cn(
                  'group absolute overflow-hidden border-3 border-ink text-left transition-transform duration-150 hover:z-20 hover:-translate-y-[2px]',
                  isActive ? 'z-20 shadow-brutal-sm' : 'z-10',
                  z.kind === 'backroom' && 'border-dashed',
                )}
              >
                {showHeat && (
                  <span
                    className={cn('absolute inset-0', TONE_SOLID[z.tone])}
                    style={{ opacity: 0.1 + (z.heat / 100) * 0.5 }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative flex h-full flex-col justify-between p-1.5">
                  <span className="block truncate bg-paper/85 font-mono text-[9px] font-bold uppercase leading-none tracking-wider md:text-[10px]">
                    {z.short}
                  </span>
                  {z.w > 14 && (
                    <span className="hidden truncate bg-paper/85 font-mono text-[9px] uppercase tracking-wider text-muted md:block">
                      {z.heat}% LOAD · {z.dwell}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Camera coverage + markers */}
          {showCams &&
            cameras.map((c) => (
              <span key={c.id} className="pointer-events-none absolute z-30">
                <span
                  className="absolute border-3 border-dashed border-ink/30"
                  style={{
                    left: `${c.mapX - 7}%`,
                    top: `${c.mapY - 7}%`,
                    width: '14%',
                    height: '14%',
                  }}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-3 border-ink',
                    TONE_SOLID[CAMERA_TONE[c.status]],
                    c.status === 'offline' && 'animate-blink',
                  )}
                  style={{ left: `${c.mapX}%`, top: `${c.mapY}%` }}
                  title={`${c.id} · ${c.name} · ${c.status.toUpperCase()}`}
                >
                  <CameraIcon className="h-3 w-3 text-ink" strokeWidth={3.5} />
                </span>
              </span>
            ))}

          {/* Anonymous tracks */}
          {showDots &&
            dots.map((d) => (
              <span
                key={d.id}
                className={cn(
                  'absolute z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border-2 border-ink transition-[left,top] duration-[2200ms] ease-linear',
                  TONE_SOLID[d.tone],
                  d.stationary && 'rounded-full',
                )}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                aria-hidden="true"
              />
            ))}

          {/* Corner registration marks — technical drawing feel */}
          <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 border-l-3 border-t-3 border-ink/40" />
          <span className="pointer-events-none absolute right-1 top-1 h-4 w-4 border-r-3 border-t-3 border-ink/40" />
          <span className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 border-b-3 border-l-3 border-ink/40" />
          <span className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 border-b-3 border-r-3 border-ink/40" />
        </div>
      </div>

      {/* Readout for the selected zone */}
      <div className="flex flex-col gap-3 rounded-brutal border-3 border-ink bg-surface p-3 md:flex-row md:items-center">
        <div className="min-w-0 md:w-64">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-mega text-muted">
            SELECTED ZONE
          </p>
          <p className="mt-1 truncate text-sm font-bold uppercase tracking-wide">
            {activeZone ? activeZone.label : 'TAP A ZONE ON THE PLAN'}
          </p>
        </div>
        <div className="flex flex-1 items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-mega text-muted">
              FOOTFALL LOAD
            </p>
            <SegmentBar value={activeZone?.heat ?? 0} segments={18} height="sm" showValue />
          </div>
          <div className="shrink-0">
            <p className="font-mono text-[9px] uppercase tracking-mega text-muted">
              AVG DWELL
            </p>
            <p className={cn('text-xl font-bold leading-none tracking-tightest tnum', TONE_TEXT.ink)}>
              {activeZone?.dwell ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[
          { label: 'ENTRANCE / FLOW', tone: 'lime' as const },
          { label: 'AISLE SHELVING', tone: 'blue' as const },
          { label: 'QUEUE ZONE', tone: 'yellow' as const },
          { label: 'CHECKOUT', tone: 'coral' as const },
          { label: 'PROMO / END CAP', tone: 'purple' as const },
        ].map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={cn('h-3 w-4 border-2 border-ink', TONE_SOLID[item.tone])} />
            <span className="font-mono text-[9px] uppercase tracking-mega text-muted">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MapToggle({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'press-sm inline-flex items-center gap-1.5 rounded-brutal border-3 border-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-mega',
        active ? 'bg-ink text-paper' : 'bg-surface text-muted',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
