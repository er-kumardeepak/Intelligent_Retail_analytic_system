import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/overview', label: 'Overview' },
  { to: '/inventory-analytics', label: 'Inventory Analytics' },
  { to: '/queue-analytics', label: 'Queue Analytics' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b-3 border-ink bg-paper">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="Retail Intelligence home">
          <span className="flex h-9 w-9 items-center justify-center border-3 border-ink bg-ink font-mono text-sm font-bold uppercase tracking-tightest text-lime">
            RI
          </span>
          <span className="text-lg font-bold uppercase tracking-tightest">Retail Intelligence</span>
        </Link>

        <nav className="flex items-center gap-2 rounded-brutal border-3 border-ink bg-surface p-1.5 shadow-brutal-sm">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'rounded-[4px] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-mega transition-colors md:text-[11px]',
                  isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-yellow hover:text-ink',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
