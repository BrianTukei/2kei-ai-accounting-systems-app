
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface AdminAccessCheckProps {
  children: React.ReactNode;
}

export default function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessAttempts, setAccessAttempts] = useState(0);

  // Check if user is admin
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error("Please sign in to access the admin dashboard");
      navigate('/auth');
      return;
    }

    const userData = JSON.parse(user);
    // Check for specific admin credentials
    if (userData.email === 'tukeibrian5@gmail.com') {
      setIsAdmin(true);
      // Record admin login activity
      try {
        const timestamp = new Date().toISOString();
        const adminActivity = localStorage.getItem('adminActivity') || '[]';
        const activities = JSON.parse(adminActivity);
        activities.push({ action: 'access_admin_dashboard', timestamp });
        localStorage.setItem('adminActivity', JSON.stringify(activities));
      } catch (error) {
        console.error('Error logging admin activity:', error);
      }
    } else {
      // Record unauthorized access attempt
      setAccessAttempts(prev => prev + 1);
      toast.error("You don't have permission to access this page");
      
      try {
        const timestamp = new Date().toISOString();
        const securityAlerts = localStorage.getItem('securityAlerts') || '[]';
        const alerts = JSON.parse(securityAlerts);
        alerts.push({ 
          action: 'unauthorized_admin_access', 
          email: userData.email,
          name: userData.name,
          timestamp 
        });
        localStorage.setItem('securityAlerts', JSON.stringify(alerts));
      } catch (error) {
        console.error('Error logging security alert:', error);
      }
      
      // Redirect after short delay to allow toast to be seen
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Card className="w-96 shadow-lg border-red-200 animate-pulse">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle className="text-red-700">Access Restricted</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              This area is only accessible to authorized administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Your access attempt has been logged.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
