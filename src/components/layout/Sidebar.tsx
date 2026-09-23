import { NavLink } from 'react-router-dom';
import { ChevronRight, Cpu, HardDrive, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/lib/app-state';
import { useLive } from '@/lib/live-store';
import { SegmentBar } from '@/components/brutal';
import { NAV_GROUPS } from './navigation';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { alerts } = useLive();
  const { recommendationsCount, store } = useSidebarMeta();

  const badgeFor = (kind?: 'alerts' | 'recommendations') => {
    if (kind === 'alerts') return alerts.filter((a) => !a.acknowledged && a.level !== 'resolved').length;
    if (kind === 'recommendations') return recommendationsCount;
    return 0;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Panel header */}
      <div className="hidden border-b-3 border-ink p-3 lg:block">
        <div className="rounded-brutal border-3 border-ink bg-surface p-2.5 shadow-brutal-xs">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-mega text-muted">
            ACTIVE STORE
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase leading-tight tracking-wide">
            {store.name}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted">
            {store.cameras} CAMERAS · {store.area}
          </p>
        </div>
      </div>

      <nav className="brutal-scroll flex-1 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-5 last:mb-2">
            <p className="mb-2 hidden px-1 font-mono text-[9px] font-bold uppercase tracking-mega text-muted lg:block">
              {group.label}
            </p>
            <div className="hidden h-[3px] w-8 bg-ink/25 lg:mb-2 lg:block" />
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge = badgeFor(item.badge);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onNavigate}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-brutal border-3 px-2.5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150',
                          'justify-center lg:justify-start',
                          isActive
                            ? 'border-ink bg-ink text-paper shadow-brutal-xs'
                            : 'border-transparent text-ink hover:border-ink hover:bg-surface hover:shadow-brutal-xs',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn('h-4 w-4 shrink-0', isActive ? 'text-lime' : 'text-ink')}
                            strokeWidth={2.6}
                          />
                          <span className="hidden min-w-0 flex-1 truncate text-left lg:inline">
                            {item.label}
                          </span>
                          {badge > 0 && (
                            <span
                              className="hidden shrink-0 border-2 border-ink bg-coral px-1.5 py-[1px] font-mono text-[9px] font-bold text-ink tnum lg:inline"
                            >
                              {badge}
                            </span>
                          )}
                          <ChevronRight
                            className={cn(
                              'hidden h-3.5 w-3.5 shrink-0 lg:block',
                              isActive ? 'text-paper' : 'text-ink/30',
                            )}
                            strokeWidth={3}
                          />
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Machine readout */}
      <div className="hidden border-t-3 border-ink p-3 lg:block">
        <div className="rounded-brutal border-3 border-ink bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-mega">
              <Cpu className="h-3.5 w-3.5" strokeWidth={3} />
              EDGE AI
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-mega text-lime">
              <span className="h-2 w-2 bg-lime" />
              ONLINE
            </span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-mega text-muted">
                <HardDrive className="h-3 w-3" strokeWidth={2.5} />
                LOCAL STORAGE
              </span>
              <span className="font-mono text-[9px] font-bold tnum">78%</span>
            </div>
            <SegmentBar value={78} segments={14} tone="yellow" height="xs" />
          </div>

          <p className="mt-3 border-t-3 border-dashed border-ink/20 pt-2 font-mono text-[9px] uppercase leading-relaxed tracking-wider text-muted">
            FRAMES PROCESSED LOCAL · 0 UPLOADED
          </p>
        </div>
      </div>
    </div>
  );
}

/** Alerts/recommendation counts plus the active store, pulled once for the sidebar. */
function useSidebarMeta() {
  const { store } = useAppState();
  // Recommendations are static in this prototype; criticals drive the badge.
  const recommendationsCount = 3;
  return { recommendationsCount, store };
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[80px] shrink-0 border-r-3 border-ink bg-paper md:block lg:w-[268px]">
      <SidebarContent />
    </aside>
  );
}

export function SidebarDrawer() {
  const { drawerOpen, setDrawerOpen } = useAppState();
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/60 transition-opacity duration-200 md:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r-3 border-ink bg-paper shadow-brutal-lg transition-transform duration-200 md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b-3 border-ink px-3 py-3">
          <span className="font-bold uppercase tracking-tightest">
            RETAIL<span className="text-coral">//</span>AI
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="press-sm flex h-8 w-8 items-center justify-center rounded-brutal border-3 border-ink bg-surface"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </div>
      </aside>
    </>
  );
}


