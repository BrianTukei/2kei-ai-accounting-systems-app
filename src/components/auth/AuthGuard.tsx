
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/utils/authUtils';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      
      if (!authenticated) {
        toast.error("Please sign in to access this feature");
      }
      
      setIsAuthorized(authenticated);
    };
    
    checkAuth();
  }, [location]);

  // Show loading while checking auth status
  if (isAuthorized === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to auth if not authenticated
  if (!isAuthorized) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  
  // Render children if authenticated
  return <>{children}</>;
}
