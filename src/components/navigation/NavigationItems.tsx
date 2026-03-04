
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Settings, 
  FileText,
  TrendingUp,
  Sparkles,
  Receipt,
  Landmark,
  BookOpenCheck,
  LineChart,
  Users,
  Wallet,
  Scale,
  Calculator,
  BookMarked,
  RefreshCw,
  Banknote,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon badge background */
  iconGradient: string;
  /** Tailwind text colour for the icon inside the badge */
  iconColor: string;
  group?: 'main' | 'financial' | 'saas' | 'reports';
  /** Items shown inline in the top navbar (others go in hamburger only) */
  primary?: boolean;
}

export const navItems: NavItem[] = [
  // ── Main (primary = visible in top bar) ──
  { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard, iconGradient: 'from-blue-500/20 to-indigo-500/20',   iconColor: 'text-blue-600 dark:text-blue-400',     group: 'main', primary: true },
  { name: 'Transactions', path: '/transactions', icon: CreditCard,      iconGradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', group: 'main', primary: true },
  { name: 'Reports',      path: '/reports',      icon: BarChart3,       iconGradient: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-600 dark:text-violet-400',  group: 'reports', primary: true },
  // ── Hamburger-only ──
  { name: 'Invoices',     path: '/invoices',     icon: Receipt,         iconGradient: 'from-amber-500/20 to-orange-500/20',  iconColor: 'text-amber-600 dark:text-amber-400',    group: 'main' },
  { name: 'Bank Import',  path: '/bank-import',  icon: Landmark,        iconGradient: 'from-cyan-500/20 to-sky-500/20',      iconColor: 'text-cyan-600 dark:text-cyan-400',      group: 'main' },
  { name: 'Bookkeeping',  path: '/journal',      icon: BookOpenCheck,   iconGradient: 'from-rose-500/20 to-pink-500/20',     iconColor: 'text-rose-600 dark:text-rose-400',      group: 'main' },
  { name: 'Forecast',     path: '/forecast',     icon: LineChart,       iconGradient: 'from-fuchsia-500/20 to-pink-500/20',  iconColor: 'text-fuchsia-600 dark:text-fuchsia-400', group: 'main' },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles,        iconGradient: 'from-yellow-500/20 to-amber-500/20',  iconColor: 'text-yellow-600 dark:text-yellow-400',  group: 'main' },
  { name: 'Payroll',      path: '/payroll',      icon: Banknote,        iconGradient: 'from-pink-500/20 to-rose-500/20',     iconColor: 'text-pink-600 dark:text-pink-400',      group: 'main' },
  { name: 'Recurring',    path: '/recurring-transactions', icon: RefreshCw, iconGradient: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-600 dark:text-orange-400', group: 'main' },
  // ── Financial Statements ──
  { name: 'Income Statement', path: '/income-statement', icon: TrendingUp,  iconGradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-600 dark:text-green-400',   group: 'financial' },
  { name: 'Balance Sheet',    path: '/balance-sheet',    icon: Scale,       iconGradient: 'from-indigo-500/20 to-blue-500/20',   iconColor: 'text-indigo-600 dark:text-indigo-400', group: 'financial' },
  { name: 'Cash Flow',        path: '/cash-flow',        icon: Calculator,  iconGradient: 'from-teal-500/20 to-cyan-500/20',     iconColor: 'text-teal-600 dark:text-teal-400',     group: 'financial' },
  { name: 'Trial Balance',    path: '/trial-balance',    icon: FileText,    iconGradient: 'from-orange-500/20 to-red-500/20',    iconColor: 'text-orange-600 dark:text-orange-400', group: 'financial' },
  { name: 'Cash Book',        path: '/cash-book',        icon: BookMarked,  iconGradient: 'from-lime-500/20 to-green-500/20',    iconColor: 'text-lime-600 dark:text-lime-400',     group: 'financial' },
  // ── SaaS / Account ──
  { name: 'Team',         path: '/team',         icon: Users,           iconGradient: 'from-sky-500/20 to-blue-500/20',      iconColor: 'text-sky-600 dark:text-sky-400',        group: 'saas' },
  { name: 'Billing',      path: '/billing',      icon: Wallet,          iconGradient: 'from-purple-500/20 to-violet-500/20',  iconColor: 'text-purple-600 dark:text-purple-400',  group: 'saas' },
  { name: 'Settings',     path: '/settings',     icon: Settings,        iconGradient: 'from-slate-500/20 to-gray-500/20',     iconColor: 'text-slate-600 dark:text-slate-400',    group: 'saas' },
];

interface NavigationItemsProps {
  orientation?: 'horizontal' | 'vertical';
  onItemClick?: () => void;
  /** When true, only render items marked `primary` */
  onlyPrimary?: boolean;
  /** The nav-item name to highlight with pulse-glow (set by AI navigation) */
  highlightedItem?: string | null;
}

export default function NavigationItems({ orientation = 'horizontal', onItemClick, onlyPrimary = false, highlightedItem }: NavigationItemsProps) {
  const location = useLocation();
  const items = onlyPrimary ? navItems.filter((i) => i.primary) : navItems;

  return (
    <div
      className={cn(
        'flex items-center',
        orientation === 'horizontal' ? 'space-x-1' : 'flex-col space-y-2 w-full'
      )}
    >
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const isHighlighted = highlightedItem === item.name;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              'flex items-center gap-3 transition-all duration-200 ease-out group',
              orientation === 'horizontal' ? 'font-medium px-2 py-1.5 rounded-md text-xs' : 'px-3 py-2.5 rounded-lg w-full',
              isActive
                ? orientation === 'horizontal'
                  ? 'text-primary bg-primary/5 shadow-sm'
                  : 'bg-primary/10 text-primary'
                : orientation === 'horizontal'
                  ? 'text-slate-600 hover:text-primary hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              isHighlighted && 'animate-pulse-glow ring-2 ring-primary/60 bg-primary/10 text-primary scale-105'
            )}
            onClick={onItemClick}
          >
            {/* Colored icon badge */}
            <span
              className={cn(
                'flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
                orientation === 'horizontal' ? 'w-7 h-7' : 'w-9 h-9',
                `bg-gradient-to-br ${item.iconGradient}`,
                isActive ? 'shadow-sm ring-1 ring-primary/20' : ''
              )}
            >
              <Icon
                size={orientation === 'horizontal' ? 14 : 18}
                className={cn(
                  item.iconColor,
                  'transition-colors duration-200',
                  isActive && 'drop-shadow-sm'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </span>
            <span className={cn(
              orientation === 'horizontal' ? 'text-xs' : 'text-sm font-medium',
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
