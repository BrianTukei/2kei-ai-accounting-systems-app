
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2, DollarSign, UserCog, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminDashboardAPI, adminApiCallSoft } from '@/services/adminService';

/** Platform owner emails that always get admin access */
const OWNER_EMAILS = ['briantukei1000@gmail.com', 'tukeibrian5@gmail.com'];

export default function AdminAccessCard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [recentSignups, setRecentSignups] = useState(0);

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
          fetchPlatformStats();
        } else {
          // Fallback: check if owner email
          const isOwner = OWNER_EMAILS.map(e => e.toLowerCase()).includes(user.email?.toLowerCase() || '');
          if (isOwner) {
            setIsAdmin(true);
            fetchPlatformStats();
          }
        }
      }
    };

    checkAdminAccess();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      // Use the centralized AdminDashboardAPI
      const { users, source } = await AdminDashboardAPI.fetchPlatformUsers();
      setTotalUsers(users.length);

      // Count signups in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recent = users.filter(u => new Date(u.created_at) > weekAgo).length;
      setRecentSignups(recent);

      // Fetch orgs and calculate MRR
      const orgs = await AdminDashboardAPI.fetchOrganizations();
      setTotalOrgs(orgs.length);

      const mrrByPlan: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };
      const estimatedMrr = orgs
        .filter(o => ['active', 'trialing'].includes(o.sub_status))
        .reduce((sum, o) => sum + (mrrByPlan[o.plan_id] ?? 0), 0);
      setMrr(estimatedMrr);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            Admin Panel
          </span>
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Admin</Badge>
        </CardTitle>
        <CardDescription>Platform overview & management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold leading-tight">{totalUsers}</div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold leading-tight">{totalOrgs}</div>
              <div className="text-xs text-muted-foreground">Organizations</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold leading-tight">${mrr}</div>
              <div className="text-xs text-muted-foreground">MRR</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold leading-tight">+{recentSignups}</div>
              <div className="text-xs text-muted-foreground">This week</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate('/admin/users')}
          >
            <UserCog className="h-4 w-4 mr-1" />
            Users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
