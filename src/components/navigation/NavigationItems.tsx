
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart, 
  Settings, 
  FileText,
  Book
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: CreditCard },
  { name: 'Reports', path: '/reports', icon: BarChart },
  { name: 'Income Statement', path: '/income-statement', icon: FileText },
  { name: 'Cash Flow', path: '/cash-flow', icon: FileText },
  { name: 'Balance Sheet', path: '/balance-sheet', icon: FileText },
  { name: 'Trial Balance', path: '/trial-balance', icon: FileText },
  { name: 'Cash Book', path: '/cash-book', icon: Book },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface NavigationItemsProps {
  orientation?: 'horizontal' | 'vertical';
  onItemClick?: () => void;
}

export default function NavigationItems({ orientation = 'horizontal', onItemClick }: NavigationItemsProps) {
  const location = useLocation();

  return (
    <div
      className={cn(
        'flex items-center',
        orientation === 'horizontal' ? 'space-x-6' : 'flex-col space-y-2 w-full'
      )}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              'flex items-center space-x-3 transition-all duration-200',
              orientation === 'horizontal'
                ? 'font-medium px-1 py-2'
                : 'p-3 rounded-lg w-full',
              isActive 
                ? orientation === 'horizontal'
                  ? 'text-primary border-b-2 border-primary'
                  : 'bg-primary/10 text-primary'
                : orientation === 'horizontal'
                  ? 'text-slate-600 hover:text-primary'
                  : 'hover:bg-slate-100 text-slate-700'
            )}
            onClick={onItemClick}
          >
            <Icon size={orientation === 'horizontal' ? 18 : 20} />
            <span className={orientation === 'horizontal' ? '' : 'font-medium'}>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
