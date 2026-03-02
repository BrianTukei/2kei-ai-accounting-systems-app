
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OWNER_EMAILS, isOwnerEmail } from '@/lib/adminEmails';

interface AdminAccessCheckProps {
  children: React.ReactNode;
}

type AccessState = 'checking' | 'granted' | 'denied' | 'no-auth';

export default function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const navigate = useNavigate();
  const { user, authResolved } = useAuth();
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve first
    if (!authResolved) return;
    
    // No user - redirect to auth
    if (!user) {
      lastUserId.current = null;
      setAccessState('no-auth');
      return;
    }

    // Re-check if user changed (prevents stale access state on account switch)
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;
    setAccessState('checking');

    const userEmail = user.email?.toLowerCase() || '';
    
    // Owner email = instant access (no database check needed)
    if (isOwnerEmail(userEmail)) {
      console.log('[AdminAccessCheck] Owner email detected:', userEmail);
      setAccessState('granted');
      
      // Background: ensure DB entries (non-blocking)
      setupAdminDbEntries(user.id).catch(console.error);
      return;
    }

    // For non-owners, check database
    checkDatabaseAccess(user.id);
  }, [authResolved, user]);

  const setupAdminDbEntries = async (userId: string) => {
    try {
      // Try RPC bootstrap
      await supabase.rpc('bootstrap_admin_if_owner').catch(() => {});
      
      // Upsert admin_users
      await (supabase as any)
        .from('admin_users')
        .upsert({
          user_id: userId,
          admin_role: 'super_admin',
          department: 'Platform',
          permissions: ['*'],
          is_active: true
        }, { onConflict: 'user_id' })
        .catch(() => {});
      
      // Upsert user_roles
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
        .catch(() => {});
    } catch (e) {
      console.log('[AdminAccessCheck] DB setup error (non-fatal):', e);
    }
  };

  const checkDatabaseAccess = async (userId: string) => {
    try {
      // Check admin_users table
      const { data: adminData } = await (supabase as any)
        .from('admin_users')
        .select('id, admin_role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (adminData) {
        setAccessState('granted');
        return;
      }

      // Fallback: check user_roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleData) {
        setAccessState('granted');
        return;
      }

      // No access
      setAccessState('denied');
    } catch (error) {
      console.error('[AdminAccessCheck] Database check error:', error);
      setAccessState('denied');
    }
  };

  // Still waiting for auth
  if (!authResolved || accessState === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying admin access...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (accessState === 'no-auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-96 shadow-lg border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Sign In Required</CardTitle>
            <CardDescription className="text-slate-400">
              Please sign in to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => navigate('/auth', { replace: true })}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (accessState === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-96 shadow-lg border-red-900/50 bg-slate-900">
          <CardHeader className="bg-red-950/50 border-b border-red-900/30">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle className="text-red-400">Access Restricted</CardTitle>
            </div>
            <CardDescription className="text-red-300/70">
              This area is only accessible to authorized administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-center text-sm text-slate-400">
              Contact support if you believe this is an error.
            </p>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => navigate('/dashboard', { replace: true })}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}
