import { Link, NavLink } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { cn, clock } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { StatusBadge } from '@/components/brutal';
import { ALL_NAV_ITEMS } from './navigation';

/**
 * Top navigation. Reads its store list and live counts from the REST data
 * layer, so the badges and the selector are always the backend's truth.
 */
export function Navbar() {
  const { user, signOut } = useAuth();
  const {
    stores,
    storeId,
    setStoreId,
    polling,
    setPolling,
    refresh,
    lastUpdated,
    error,
    unacknowledgedCount,
    recommendations,
  } = useData();

  const badgeFor = (kind?: 'alerts' | 'recommendations') => {
    if (kind === 'alerts') return unacknowledgedCount;
    if (kind === 'recommendations') return recommendations.length;
    return 0;
  };

  return (
    <header className="sticky top-0 z-30 border-b-3 border-ink bg-paper">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Retail Intelligence home">
          <span className="flex h-9 w-9 items-center justify-center border-3 border-ink bg-ink font-mono text-sm font-bold tracking-tightest text-lime">
            RI
          </span>
          <span className="hidden text-base font-bold uppercase tracking-tightest sm:block">
            Retail<span className="text-coral">//</span>Intelligence
          </span>
        </Link>

        {/* Tabs */}
        <nav
          className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t-3 border-ink px-4 pt-3 no-scrollbar sm:mx-0 sm:w-auto sm:border-0 sm:px-0 sm:pt-0 lg:order-none"
          aria-label="Sections"
        >
          <div className="flex items-center gap-1.5 sm:rounded-brutal sm:border-3 sm:border-ink sm:bg-surface sm:p-1.5 sm:shadow-brutal-sm">
            {ALL_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-[4px] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-mega transition-colors md:text-[11px]',
                    isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-yellow hover:text-ink',
                  )
                }
              >
                {item.label}
                {badgeFor(item.badge) > 0 && (
                  <span className="border-2 border-ink bg-coral px-1.5 font-mono text-[9px] font-bold text-ink tnum">
                    {badgeFor(item.badge)}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-2">
          {stores.length > 0 && (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Active store</span>
              <select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                className="max-w-[190px] cursor-pointer border-3 border-ink bg-surface px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-wider outline-none focus:bg-yellow/25"
              >
                {stores.map((store) => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_id} · {store.city}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={() => setPolling(!polling)}
            title={polling ? 'Pause live refresh' : 'Resume live refresh'}
            className="press-sm flex items-center rounded-brutal border-3 border-ink bg-surface"
          >
            <StatusBadge tone={error ? 'coral' : polling ? 'lime' : 'yellow'} size="sm" dot pulse={polling && !error}>
              {error ? 'OFFLINE' : polling ? 'LIVE' : 'PAUSED'}
            </StatusBadge>
          </button>

          <button
            type="button"
            onClick={refresh}
            title="Refresh now"
            aria-label="Refresh now"
            className="press-sm flex h-9 w-9 items-center justify-center rounded-brutal border-3 border-ink bg-surface"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={3} />
          </button>

          {user && (
            <button
              type="button"
              onClick={() => void signOut()}
              title={`Sign out ${user.email}`}
              aria-label="Sign out"
              className="press-sm hidden h-9 w-9 items-center justify-center rounded-brutal border-3 border-ink bg-surface sm:flex"
            >
              <LogOut className="h-4 w-4" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {lastUpdated && !error && (
        <p className="border-t-3 border-ink/15 bg-surface px-4 py-1 text-center font-mono text-[9px] uppercase tracking-mega text-muted">
          REST poll every 5s · last update {clock(lastUpdated)}
        </p>
      )}

      {error && (
        <p className="border-t-3 border-ink bg-coral px-4 py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-wider">
          Backend unreachable — {error}
        </p>
      )}
    </header>
  );
}
