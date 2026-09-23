import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live-store';
import { NAV_GROUPS, MOBILE_NAV_ITEMS } from './navigation';

export function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { alerts } = useLive();
  const unacked = alerts.filter((a) => !a.acknowledged && a.level !== 'resolved').length;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/60 transition-opacity duration-200 md:hidden',
          sheetOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSheetOpen(false)}
        aria-hidden="true"
      />

      {/* More sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-[68px] z-50 mx-3 max-h-[65vh] overflow-y-auto brutal-scroll rounded-brutal border-3 border-ink bg-paper shadow-brutal-lg transition-transform duration-200 md:hidden',
          sheetOpen ? 'translate-y-0' : 'pointer-events-none translate-y-[130%]',
        )}
        aria-hidden={!sheetOpen}
      >
        <div className="flex items-center justify-between border-b-3 border-ink px-3 py-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
            ALL MODULES
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            aria-label="Close modules"
            className="press-sm flex h-7 w-7 items-center justify-center rounded-brutal border-3 border-ink bg-surface"
          >
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        </div>
        <div className="p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="mb-4 last:mb-0">
              <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const showBadge = item.badge === 'alerts' && unacked > 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setSheetOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-brutal border-3 px-2.5 py-2.5 text-[10px] font-bold uppercase tracking-wide',
                          isActive
                            ? 'border-ink bg-ink text-paper shadow-brutal-xs'
                            : 'border-ink bg-surface',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.8} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {showBadge && (
                        <span className="border-2 border-ink bg-coral px-1 font-mono text-[9px] font-bold text-ink tnum">
                          {unacked}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-3 border-ink bg-paper md:hidden">
        <ul className="flex items-stretch">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showBadge = item.badge === 'alerts' && unacked > 0;
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex h-16 flex-col items-center justify-center gap-1 border-r-3 border-ink/15 px-0.5 text-[9px] font-bold uppercase tracking-wider',
                      isActive ? 'bg-ink text-paper' : 'text-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2.8} />
                        {showBadge && (
                          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center border-2 border-ink bg-coral px-0.5 font-mono text-[8px] font-bold text-ink">
                            {unacked}
                          </span>
                        )}
                      </span>
                      <span className={cn('truncate', isActive && 'text-lime')}>{item.short}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setSheetOpen((v) => !v)}
              aria-expanded={sheetOpen}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted"
            >
              <ChevronUp
                className={cn('h-[18px] w-[18px] transition-transform', sheetOpen && 'rotate-180')}
                strokeWidth={3}
              />
              MORE
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
