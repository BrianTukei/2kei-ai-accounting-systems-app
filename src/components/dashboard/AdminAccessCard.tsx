
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAccessCard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalSignups, setTotalSignups] = useState(0);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          setIsAdmin(true);
          fetchTotalSignups();
        }
      }
    };

    checkAdminAccess();
  }, []);
  
  const fetchTotalSignups = () => {
    try {
      const storedSignups = localStorage.getItem('userSignups');
      if (storedSignups) {
        const signups = JSON.parse(storedSignups);
        setTotalSignups(signups.length);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    }
  };
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-primary" />
          Admin Panel
        </CardTitle>
        <CardDescription>Access user management tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            <span className="text-sm">Total Users:</span>
          </div>
          <span className="font-bold">{totalSignups}</span>
        </div>
        
        <Button
          className="w-full"
          onClick={() => navigate('/admin')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Open Admin Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
