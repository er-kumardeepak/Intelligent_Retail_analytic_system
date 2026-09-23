import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ALERTS,
  ALERT_TEMPLATES,
  CAMERAS,
  EVENT_TEMPLATES,
  INDEXED_EVENTS,
  METRICS,
  PEOPLE,
  SECONDARY_METRICS,
} from './mock-data';
import { clamp, pick, rand } from './utils';
import type { AlertItem, Camera, Metric, PersonDot, RetailEvent, Tone } from './types';

export interface QueueLane {
  id: string;
  lane: string;
  people: number;
  waitSec: number;
  active: boolean;
  utilisation: number;
  tone: Tone;
}

export interface LiveState {
  live: boolean;
  setLive: (v: boolean) => void;
  tick: number;
  pulseAt: number;
  peopleInStore: number;
  avgDwell: number;
  queueLength: number;
  shelfFill: number;
  avgWait: number;
  metrics: Metric[];
  secondaryMetrics: Metric[];
  alerts: AlertItem[];
  events: RetailEvent[];
  dots: PersonDot[];
  lanes: QueueLane[];
  cameras: Camera[];
  acknowledge: (id: string) => void;
  resolve: (id: string) => void;
  clearNew: () => void;
}

const LiveContext = createContext<LiveState | null>(null);

export const UPDATE_MS = 2600;

function buildLanes(queueLength: number): QueueLane[] {
  // Sanity beats realism here: lanes fill in order, then normalise.
  const spread = [3, 2, 1, 0];
  const lanes: { id: string; lane: string; tone: Tone }[] = [
    { id: 'lane-01', lane: 'CHECKOUT 01', tone: 'coral' },
    { id: 'lane-02', lane: 'CHECKOUT 02', tone: 'coral' },
    { id: 'lane-03', lane: 'CHECKOUT 03', tone: 'yellow' },
    { id: 'lane-04', lane: 'CHECKOUT 04', tone: 'lime' },
  ];
  return lanes.map((lane, i) => {
    const active = i < (queueLength > 5 ? 4 : queueLength > 2 ? 3 : 2);
    const people = active ? clamp(queueLength - (spread[i] - 1), 0, 9) : 0;
    const utilisation = active ? clamp(38 + people * 11 + (i === 3 ? -22 : 0), 8, 99) : 0;
    return {
      ...lane,
      people,
      waitSec: Math.round(active && people > 0 ? 42 + people * 47 + (i === 0 ? 60 : 0) : 0),
      active,
      utilisation,
    };
  });
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);
  const [pulseAt, setPulseAt] = useState(() => Date.now());

  const [peopleInStore, setPeopleInStore] = useState(128);
  const [avgDwell, setAvgDwell] = useState(8.4);
  const [queueLength, setQueueLength] = useState(3);
  const [shelfFill, setShelfFill] = useState(92);
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [events, setEvents] = useState<RetailEvent[]>(INDEXED_EVENTS);
  const [cameras, setCameras] = useState<Camera[]>(CAMERAS);
  const [dots, setDots] = useState<PersonDot[]>(PEOPLE);

  const counter = useRef(1000);

  /* ---------------- the edge pipeline, simulated ---------------- */
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setPulseAt(Date.now());

      setPeopleInStore((v) => Math.round(clamp(v + rand(-7, 7), 34, 196)));
      setAvgDwell((v) => Number(clamp(v + rand(-0.35, 0.35), 5.4, 11.2).toFixed(1)));
      setQueueLength((v) => clamp(v + pick([-1, -1, 0, 0, 1, 1, 2]), 0, 9));
      setShelfFill((v) => Math.round(clamp(v + rand(-1.4, 0.9), 74, 97)));

      // People drift between zones; a few new arrivals appear at the entrance.
      setDots((prev) =>
        prev.map((d) => {
          if (d.stationary && Math.random() > 0.25) return d;
          const nx = clamp(d.x + rand(-3.4, 3.4), 4, 95);
          const ny = clamp(d.y + rand(-2.6, 2.6), 4, 95);
          return { ...d, x: Number(nx.toFixed(1)), y: Number(ny.toFixed(1)) };
        }),
      );

      // Event engine output.
      counter.current += 1;
      const tpl = pick(EVENT_TEMPLATES);
      const ev: RetailEvent = {
        id: `ev-${counter.current}`,
        type: tpl.type,
        zone: tpl.zone,
        camera: tpl.camera,
        at: new Date().toISOString(),
        confidence: Number(rand(0.71, 0.99).toFixed(2)),
        tone: tpl.tone,
      };
      setEvents((prev) => [ev, ...prev].slice(0, 40));

      // Alerts arrive less often than raw events — they are the escalated ones.
      if (Math.random() < 0.42) {
        const a = pick(ALERT_TEMPLATES);
        counter.current += 1;
        const alert: AlertItem = {
          ...a,
          id: `al-${counter.current}`,
          at: new Date().toISOString(),
          acknowledged: false,
          isNew: true,
        };
        setAlerts((prev) => [alert, ...prev].slice(0, 16));
      }

      // Camera health flutter.
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id === 'CAM-04') return c; // stays offline until maintenance
          if (c.id === 'CAM-03') {
            const fps = Math.round(clamp(c.fps + rand(-4, 4), 12, 26));
            return { ...c, fps, latencyMs: Math.round(clamp(c.latencyMs + rand(-40, 40), 180, 420)) };
          }
          if (Math.random() > 0.7) {
            return { ...c, latencyMs: Math.round(clamp(c.latencyMs + rand(-6, 6), 30, 90)) };
          }
          return c;
        }),
      );
    }, UPDATE_MS);
    return () => window.clearInterval(id);
  }, [live]);

  const acknowledge = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true, isNew: false } : a)));
  }, []);

  const resolve = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, level: 'resolved', isNew: false } : a)));
  }, []);

  const clearNew = useCallback(() => {
    setAlerts((prev) => prev.map((a) => (a.isNew ? { ...a, isNew: false } : a)));
  }, []);

  const avgWait = useMemo(
    () => Number((0.6 + queueLength * 0.58 + rand(-0.2, 0.2)).toFixed(1)),
    [queueLength, tick],
  );

  const lanes = useMemo(() => buildLanes(queueLength), [queueLength]);

  const metrics = useMemo<Metric[]>(
    () =>
      METRICS.map((m) => {
        switch (m.id) {
          case 'footfall':
            return { ...m, value: peopleInStore };
          case 'dwell':
            return { ...m, value: avgDwell };
          case 'queue':
            return { ...m, value: queueLength };
          case 'shelf':
            return { ...m, value: shelfFill };
          default:
            return m;
        }
      }),
    [peopleInStore, avgDwell, queueLength, shelfFill],
  );

  const secondaryMetrics = useMemo<Metric[]>(
    () =>
      SECONDARY_METRICS.map((m) =>
        m.id === 'wait' ? { ...m, value: avgWait } : m,
      ),
    [avgWait],
  );

  const value = useMemo<LiveState>(
    () => ({
      live,
      setLive,
      tick,
      pulseAt,
      peopleInStore,
      avgDwell,
      queueLength,
      shelfFill,
      avgWait,
      metrics,
      secondaryMetrics,
      alerts,
      events,
      dots,
      lanes,
      cameras,
      acknowledge,
      resolve,
      clearNew,
    }),
    [
      live,
      tick,
      pulseAt,
      peopleInStore,
      avgDwell,
      queueLength,
      shelfFill,
      avgWait,
      metrics,
      secondaryMetrics,
      alerts,
      events,
      dots,
      lanes,
      cameras,
      acknowledge,
      resolve,
      clearNew,
    ],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveState {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive must be used inside <LiveProvider>');
  return ctx;
}
