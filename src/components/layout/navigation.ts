import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Camera,
  FileText,
  LayoutDashboard,
  LineChart,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Key into the live alert feed, used to render a count badge. */
  badge?: 'alerts' | 'recommendations';
  /** Shows in the mobile bottom bar. */
  mobile?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    label: 'OPERATIONS',
    items: [
      { to: '/', label: 'Overview', short: 'HOME', icon: LayoutDashboard, mobile: true },
      { to: '/live', label: 'Live Analytics', short: 'LIVE', icon: Activity, mobile: true },
      { to: '/analytics', label: 'Store Analytics', short: 'ANALYTICS', icon: BarChart3 },
      { to: '/shelves', label: 'Shelf Monitoring', short: 'SHELVES', icon: Boxes, mobile: true },
      { to: '/queue', label: 'Queue Monitoring', short: 'QUEUE', icon: Timer, mobile: true },
      { to: '/flow', label: 'Customer Flow', short: 'FLOW', icon: Users },
    ],
  },
  {
    id: 'intelligence',
    label: 'INTELLIGENCE',
    items: [
      { to: '/predictions', label: 'Predictions', short: 'PREDICT', icon: LineChart },
      { to: '/recommendations', label: 'Recommendations', short: 'ACTIONS', icon: Sparkles, badge: 'recommendations' },
      { to: '/alerts', label: 'Alerts', short: 'ALERTS', icon: AlertTriangle, badge: 'alerts' },
    ],
  },
  {
    id: 'system',
    label: 'PLATFORM',
    items: [
      { to: '/cameras', label: 'Cameras', short: 'CAMERAS', icon: Camera },
      { to: '/privacy', label: 'Privacy', short: 'PRIVACY', icon: ShieldCheck },
      { to: '/reports', label: 'Reports', short: 'REPORTS', icon: FileText },
      { to: '/settings', label: 'Settings', short: 'SETTINGS', icon: SettingsIcon },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const MOBILE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter((i) => i.mobile);
