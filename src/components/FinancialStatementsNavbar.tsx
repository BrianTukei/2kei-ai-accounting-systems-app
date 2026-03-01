import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, Calculator, TrendingUp, Scale, BookOpen } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    name: 'Income Statement',
    path: '/income-statement',
    icon: TrendingUp,
  },
  {
    name: 'Balance Sheet',
    path: '/balance-sheet',
    icon: Scale,
  },
  {
    name: 'Cash Flow',
    path: '/cash-flow',
    icon: Calculator,
  },
  {
    name: 'Trial Balance',
    path: '/trial-balance',
    icon: FileText,
  },
  {
    name: 'Cash Book',
    path: '/cash-book',
    icon: BookOpen,
  },
];

export default function FinancialStatementsNavbar() {
  const location = useLocation();

  return (
    <div className="fixed top-16 left-0 z-40 w-64 h-screen bg-white/95 backdrop-blur border-r shadow-sm">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">Financial Statements</h3>
        <nav className="flex flex-col space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-blue-50 hover:text-blue-700',
                  isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}