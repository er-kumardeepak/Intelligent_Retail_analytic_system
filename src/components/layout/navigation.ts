import {
  AlertTriangle,
  Boxes,
  LayoutDashboard,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Key into the REST alert feed, used to render a count badge. */
  badge?: 'alerts' | 'recommendations';
  /** Shows in the mobile bottom bar. */
  mobile?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Every route here exists in App.tsx. Keep the two in step. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    label: 'OPERATIONS',
    items: [
      { to: '/', label: 'Overview', short: 'HOME', icon: LayoutDashboard, mobile: true },
      { to: '/inventory', label: 'Inventory Analytics', short: 'STOCK', icon: Boxes, mobile: true },
      { to: '/queue', label: 'Queue Analytics', short: 'QUEUE', icon: Timer, mobile: true },
    ],
  },
  {
    id: 'intelligence',
    label: 'INTELLIGENCE',
    items: [
      {
        to: '/alerts',
        label: 'Alerts',
        short: 'ALERTS',
        icon: AlertTriangle,
        badge: 'alerts',
        mobile: true,
      },
      {
        to: '/recommendations',
        label: 'Recommendations',
        short: 'ACTIONS',
        icon: Sparkles,
        badge: 'recommendations',
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const MOBILE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter((item) => item.mobile);
