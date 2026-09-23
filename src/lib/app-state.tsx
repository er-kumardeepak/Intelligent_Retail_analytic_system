import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NOTIFICATIONS, STORES } from './mock-data';
import type { DateFilter } from './mock-data';
import type { Notification } from './types';

interface AppState {
  storeId: string;
  store: (typeof STORES)[number];
  stores: typeof STORES;
  setStoreId: (id: string) => void;

  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;

  notifications: Notification[];
  unread: number;
  markAllRead: () => void;

  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;

  /** Stops button travel, card lift, live pulses and chart animation. */
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);
const MOTION_KEY = 'retailai.motion';

/** Motion preference, seeded from the OS setting and then remembered. */
function readReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = window.localStorage.getItem(MOTION_KEY);
  if (saved === 'on') return true;
  if (saved === 'off') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<string>(STORES[0].id);
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY');
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(readReduceMotion);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    window.localStorage.setItem(MOTION_KEY, reduceMotion ? 'on' : 'off');
  }, [reduceMotion]);

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    [],
  );

  const value = useMemo<AppState>(() => {
    const store = STORES.find((s) => s.id === storeId) ?? STORES[0];
    return {
      storeId,
      store,
      stores: STORES,
      setStoreId,
      dateFilter,
      setDateFilter,
      notifications,
      unread: notifications.filter((n) => !n.read).length,
      markAllRead,
      drawerOpen,
      setDrawerOpen,

      reduceMotion,
      setReduceMotion,
    };
  }, [storeId, dateFilter, notifications, markAllRead, drawerOpen, reduceMotion]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
