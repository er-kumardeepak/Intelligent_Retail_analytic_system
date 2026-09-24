import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Analytics windows the backend accepts via `?window=`. */
export const DATE_FILTERS = ['TODAY', '7 DAYS', '30 DAYS'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

/** Maps the UI label onto the REST enum. */
export const WINDOW_BY_FILTER = {
  TODAY: 'today',
  '7 DAYS': 'last_7_days',
  '30 DAYS': 'last_30_days',
} as const;

interface AppState {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;

  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;

  /** Stops button travel, card lift, live pulses and chart animation. */
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
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
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(readReduceMotion);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    window.localStorage.setItem(MOTION_KEY, reduceMotion ? 'on' : 'off');
  }, [reduceMotion]);

  const value = useMemo<AppState>(
    () => ({ dateFilter, setDateFilter, drawerOpen, setDrawerOpen, reduceMotion, setReduceMotion }),
    [dateFilter, drawerOpen, reduceMotion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}

/** Convenience: the REST window for the currently selected filter. */
export function useWindow(): (typeof WINDOW_BY_FILTER)[DateFilter] {
  const { dateFilter } = useAppState();
  return WINDOW_BY_FILTER[dateFilter];
}
