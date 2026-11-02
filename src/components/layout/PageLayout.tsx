import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthCheck from '@/components/auth/AuthCheck';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  /** Defaults to true on all pages except auth/landing roots */
  showBackButton?: boolean;
  /** Optional explicit back target, e.g. "/admin" */
  backTo?: string;
  className?: string;
  requireAuth?: boolean;
  aiContextType?: string;
  aiContextData?: any;
}

/** Paths that never show a back button */
const NO_BACK_PATHS = new Set([
  '/',
  '/auth',
  '/signup',
  '/email-confirmation',
  '/verify-email',
  '/onboarding',
]);

function resolveBackTarget(pathname: string, backTo?: string): string {
  if (backTo) return backTo;

  // Admin subsection → admin home
  if (pathname.startsWith('/admin') && pathname !== '/admin') return '/admin';
  if (pathname.startsWith('/super-admin') && pathname !== '/super-admin') return '/super-admin';
  if (pathname.startsWith('/dev-admin') && pathname !== '/dev-admin') return '/dev-admin';

  // Financial statements → reports
  if (
    pathname.includes('income-statement') ||
    pathname.includes('balance-sheet') ||
    pathname.includes('cash-flow') ||
    pathname.includes('trial-balance') ||
    pathname.includes('cash-book')
  ) {
    return '/reports';
  }

  // Dashboard is top of app shell
  if (pathname === '/dashboard') return '/';

  // Default: app home
  return '/dashboard';
}

export default function PageLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  showBackButton = true,
  backTo,
  className = '',
  requireAuth = true,
  aiContextType,
  aiContextData,
}: PageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const shouldShowBackButton =
    showBackButton && !NO_BACK_PATHS.has(pathname);

  const handleBackClick = () => {
    const target = resolveBackTarget(pathname, backTo);

    // Prefer browser history when it makes sense (same-session navigation)
    if (window.history.length > 1 && !backTo) {
      // Still fall back to a known safe route if user landed deep-linked
      try {
        navigate(-1);
        return;
      } catch {
        /* fall through */
      }
    }
    navigate(target);
  };

  const getDefaultContextType = (path: string): string => {
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('transaction')) return 'transaction';
    if (
      path.includes('report') ||
      path.includes('statement') ||
      path.includes('balance-sheet') ||
      path.includes('income-statement') ||
      path.includes('cash-flow') ||
      path.includes('trial-balance') ||
      path.includes('cash-book')
    ) {
      return 'report';
    }
    if (path.includes('payroll')) return 'payroll';
    if (path.includes('invoice')) return 'invoice';
    if (path.includes('bookkeeping') || path.includes('journal')) return 'bookkeeping';
    return 'general';
  };

  const content = (
    <div className="compact-container bg-gradient-subtle">
      {showSidebar && <Navbar />}

      <main className={`compact-main px-2 sm:px-4 ${className}`}>
        {shouldShowBackButton && (
          <div className="flex items-center mb-3 sticky top-0 z-10 bg-gradient-subtle/95 backdrop-blur-sm py-1 -mx-1 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="mr-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 h-9 px-3"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        )}

        {(title || subtitle) && (
          <div className="mb-4 animate-fade-up px-1">
            {title && (
              <h1 className="compact-text-2xl font-bold tracking-tight mb-1">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="compact-grid px-1 sm:px-0">{children}</div>
      </main>

      {requireAuth && !NO_BACK_PATHS.has(pathname) && (
        <AIFloatingButton
          contextType={aiContextType || getDefaultContextType(pathname)}
          contextData={aiContextData}
        />
      )}
    </div>
  );

  return requireAuth ? <AuthCheck>{content}</AuthCheck> : content;
}
