
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to access the admin dashboard");
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        toast.error("Error verifying permissions");
        navigate('/dashboard');
        return;
      }

      if (roleData) {
        setIsAdmin(true);
      } else {
        setAccessAttempts(prev => prev + 1);
        toast.error("You don't have permission to access this page");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
      setIsLoading(false);
    };

    checkAdminAccess();
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
