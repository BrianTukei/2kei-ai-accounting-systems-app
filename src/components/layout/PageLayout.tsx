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
  showBackButton?: boolean;
  className?: string;
  requireAuth?: boolean;
  aiContextType?: string;
  aiContextData?: any;
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  showSidebar = true, 
  showBackButton = true,
  className = '',
  requireAuth = true,
  aiContextType,
  aiContextData
}: PageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBackClick = () => {
    // Don't show back button on landing page or if there's no history
    if (location.pathname === '/' || window.history.length <= 1) {
      navigate('/dashboard');
    } else {
      navigate(-1);
    }
  };

  // Don't show back button on specific pages
  const hideBackButtonPaths = ['/', '/dashboard', '/auth', '/email-confirmation'];
  const shouldShowBackButton = showBackButton && !hideBackButtonPaths.includes(location.pathname);

  // Helper function to determine AI context type based on current page
  const getDefaultContextType = (pathname: string): string => {
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('transaction')) return 'transaction';
    if (pathname.includes('report') || pathname.includes('statement') || pathname.includes('balance-sheet') || pathname.includes('income-statement') || pathname.includes('cash-flow') || pathname.includes('trial-balance') || pathname.includes('cash-book')) return 'report';
    if (pathname.includes('payroll')) return 'payroll';
    if (pathname.includes('invoice')) return 'invoice';
    return 'general';
  };

  const content = (
    <div className="compact-container bg-gradient-subtle">
      {showSidebar && <Navbar />}
      
      <main className={`compact-main px-2 sm:px-4 ${className}`}>
        {shouldShowBackButton && (
          <div className="flex items-center mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="mr-3 hover:bg-slate-100 transition-colors duration-200 h-9 px-3"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
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
              <p className="text-slate-500 text-xs sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="compact-grid px-1 sm:px-0">
          {children}
        </div>
      </main>

      {/* AI Floating Button - only show if user is authenticated and not on auth pages */}
      {requireAuth && !hideBackButtonPaths.includes(location.pathname) && (
        <AIFloatingButton 
          contextType={aiContextType || getDefaultContextType(location.pathname)}
          contextData={aiContextData}
        />
      )}
    </div>
  );

  return requireAuth ? (
    <AuthCheck>
      {content}
    </AuthCheck>
  ) : content;
}