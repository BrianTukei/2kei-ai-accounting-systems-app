
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminAccessCheckProps {
  children: React.ReactNode;
}

export default function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    if (userData.email === 'tukeibrian5@gmail.co') {
      setIsAdmin(true);
    } else {
      toast.error("You don't have permission to access this page");
      navigate('/dashboard');
    }
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only Tukei Brian (tukeibrian5@gmail.co) can access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
