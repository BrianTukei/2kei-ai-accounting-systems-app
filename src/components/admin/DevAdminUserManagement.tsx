/**
 * DevAdminUserManagement.tsx
 * ══════════════════════════
 * Complete user management module for Developer Admin Dashboard
 * Features:
 *   - View all users with search and filtering
 *   - User detail view with accounting data
 *   - Suspend/activate accounts
 *   - Reset passwords
 *   - View subscription status
 *   - Export user data
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Eye,
  Ban,
  UserCheck,
  Mail,
  Key,
  Shield,
  Zap,
  Crown,
  Clock,
  Calendar,
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';

// ─────────────────────────────────────────
// Admin API Helper
// ─────────────────────────────────────────

async function adminApiCall(action: string, body: Record<string, any> = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session — please sign in");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-management`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...body }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ManagedUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  email_verified: boolean;
  created_at: string;
  last_sign_in_at?: string;
  organization_id?: string;
  organization_name?: string;
  plan_id: string;
  subscription_status?: string;
  role?: string;
}

interface UserStats {
  total_transactions: number;
  total_invoices: number;
  total_revenue: number;
  ai_tokens_used: number;
}

interface OverviewStats {
  totalUsers: number;
  activeThisWeek: number;
  paidSubscribers: number;
  suspendedUsers: number;
  newThisMonth: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
}

// ─────────────────────────────────────────
// User Management Service
// ─────────────────────────────────────────

const UserManagementService = {
  async getOverviewStats(): Promise<OverviewStats> {
    try {
      // Try to use edge function for accurate stats including suspended users
      const result = await adminApiCall('get-stats');
      return {
        totalUsers: result.totalUsers || 0,
        activeThisWeek: result.activeThisWeek || 0,
        paidSubscribers: result.paidSubscribers || 0,
        suspendedUsers: result.suspendedUsers || 0,
        newThisMonth: result.newThisMonth || 0,
        freeUsers: result.freeUsers || 0,
        proUsers: result.proUsers || 0,
        enterpriseUsers: result.enterpriseUsers || 0,
      };
    } catch (error) {
      console.error('Error fetching stats via edge function:', error);
      
      // Fallback to direct queries
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get total users from profiles
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Get users active this week (last sign in)
      const { count: activeThisWeek } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('updated_at', weekAgo.toISOString());

      // Get new users this month
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Get subscription counts by plan
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_id, status');

      const activeSubscriptions = (subscriptions || []).filter((s: any) => 
        s.status === 'active' || s.status === 'trialing'
      );

      const freeUsers = (totalUsers || 0) - activeSubscriptions.length;
      const proUsers = activeSubscriptions.filter((s: any) => s.plan_id === 'pro').length;
      const enterpriseUsers = activeSubscriptions.filter((s: any) => s.plan_id === 'enterprise').length;
      const paidSubscribers = proUsers + enterpriseUsers;

      return {
        totalUsers: totalUsers || 0,
        activeThisWeek: activeThisWeek || 0,
        paidSubscribers,
        suspendedUsers: 0,
        newThisMonth: newThisMonth || 0,
        freeUsers: Math.max(0, freeUsers),
        proUsers,
        enterpriseUsers,
      };
    }
  },
  async listUsers(params: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: ManagedUser[]; total: number }> {
    try {
      // Use the edge function to get ALL users with their ban status
      const result = await adminApiCall('list-all', {
        page: params.page || 1,
        perPage: params.limit || 20,
        search: params.search || '',
        status: params.status === 'all' ? '' : params.status,
        plan: params.plan === 'all' ? '' : params.plan,
      });

      // Map edge function response to our ManagedUser type
      const users: ManagedUser[] = (result.users || []).map((u: any) => {
        // Determine status based on banned_until
        let status: 'active' | 'suspended' | 'pending' = 'active';
        if (u.banned_until) {
          const bannedUntil = new Date(u.banned_until);
          if (bannedUntil > new Date()) {
            status = 'suspended';
          }
        }

        return {
          id: u.id,
          email: u.email || '',
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          status,
          email_verified: u.email_confirmed_at != null,
          created_at: u.created_at || new Date().toISOString(),
          last_sign_in_at: u.last_sign_in_at,
          organization_id: u.organization_id,
          organization_name: u.organization_name,
          plan_id: u.plan_id || 'free',
          subscription_status: u.subscription_status || 'active',
          role: u.role || 'user',
        };
      });

      return {
        users,
        total: result.total || users.length,
      };
    } catch (error) {
      console.error('Error fetching users via edge function:', error);
      
      // Fallback: try to get data from profiles directly (limited by RLS)
      const limit = params.limit || 20;
      const offset = ((params.page || 1) - 1) * limit;
      
      const { data: profiles, count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);

      return {
        users: (profiles || []).map((p: any) => ({
          id: p.id,
          email: p.email || '',
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          status: 'active' as const,
          email_verified: true,
          created_at: p.created_at || new Date().toISOString(),
          plan_id: 'free',
          role: 'user',
        })),
        total: profileCount || 0,
      };
    }
  },

  async getUserDetails(userId: string): Promise<ManagedUser | null> {
    try {
      // Use edge function to get user details with ban status
      const result = await adminApiCall('get-user-details', { userId });
      const u = result.user;
      
      if (!u) return null;

      // Determine status based on banned_until
      let status: 'active' | 'suspended' | 'pending' = 'active';
      if (u.banned_until) {
        const bannedUntil = new Date(u.banned_until);
        if (bannedUntil > new Date()) {
          status = 'suspended';
        }
      }

      return {
        id: u.id,
        email: u.email || '',
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        phone: u.phone,
        status,
        email_verified: u.email_confirmed_at != null,
        created_at: u.created_at || new Date().toISOString(),
        last_sign_in_at: u.last_sign_in_at,
        organization_id: u.organization_id,
        organization_name: u.organization_name,
        plan_id: u.plan_id || 'free',
        subscription_status: u.subscription_status || 'active',
        role: u.role || 'user',
      };
    } catch (error) {
      console.error('Error fetching user details via edge function:', error);
      
      // Fallback to direct query
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      const { data: orgUser } = await supabase
        .from('organization_users')
        .select(`
          role,
          organization_id,
          organizations (
            id,
            name,
            subscriptions (
              plan_id,
              status
            )
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      const org = (orgUser as any)?.organizations || {};
      const sub = org.subscriptions?.[0] || {};

      return {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        status: 'active' as const,
        email_verified: true,
        created_at: profile.created_at || new Date().toISOString(),
        organization_id: (orgUser as any)?.organization_id,
        organization_name: org.name,
        plan_id: sub.plan_id || 'free',
        subscription_status: sub.status || 'active',
        role: (orgUser as any)?.role,
      };
    }
  },

  async getUserStats(userId: string): Promise<UserStats> {
    // Get transaction count
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get invoice count
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get revenue from invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('user_id', userId)
      .eq('status', 'paid');

    const totalRevenue = (invoices || []).reduce(
      (sum, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
      0
    );

    // Get AI token usage (from ai_conversations if available)
    let aiTokens = 0;
    try {
      const { data: aiUsage } = await (supabase as any)
        .from('ai_conversations')
        .select('total_tokens')
        .eq('user_id', userId);
      aiTokens = (aiUsage || []).reduce((sum: number, c: any) => sum + (c.total_tokens || 0), 0);
    } catch (e) {
      // Table might not exist
    }

    return {
      total_transactions: transactionCount || 0,
      total_invoices: invoiceCount || 0,
      total_revenue: totalRevenue,
      ai_tokens_used: aiTokens,
    };
  },

  async suspendUser(userId: string, duration: string = '30', reason: string = ''): Promise<void> {
    // Call the edge function to actually suspend the user via auth.admin
    await adminApiCall('suspend', {
      userId,
      duration,
      reason: reason || 'No reason provided',
    });
    toast.success('User suspended successfully');
  },

  async activateUser(userId: string): Promise<void> {
    // Call the edge function to reactivate the user
    await adminApiCall('unsuspend', { userId });
    toast.success('User reactivated successfully');
  },

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async exportUsers(users: ManagedUser[]): Promise<void> {
    const headers = ['Email', 'Name', 'Organization', 'Plan', 'Status', 'Created At'];
    const rows = users.map((u) => [
      u.email,
      u.full_name || 'Unnamed',
      u.organization_name || 'N/A',
      u.plan_id,
      u.status,
      new Date(u.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─────────────────────────────────────────
// User Management Component
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// Stats Card Component
// ─────────────────────────────────────────

function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor,
  trend 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ElementType;
  iconColor: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-1',
                trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
              </p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Stats Grid Component
// ─────────────────────────────────────────

function OverviewStatsGrid({ stats, loading }: { stats: OverviewStats | undefined; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-800 animate-pulse">
            <CardContent className="pt-5 pb-4">
              <div className="h-3 bg-slate-700 rounded w-16 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        label="Total Users"
        value={stats.totalUsers.toLocaleString()}
        icon={Shield}
        iconColor="bg-indigo-500/20 text-indigo-400"
        trend={{ value: stats.newThisMonth, label: 'this month' }}
      />
      <StatsCard
        label="Active This Week"
        value={stats.activeThisWeek.toLocaleString()}
        icon={Zap}
        iconColor="bg-emerald-500/20 text-emerald-400"
      />
      <StatsCard
        label="Paid Subscribers"
        value={stats.paidSubscribers.toLocaleString()}
        icon={Crown}
        iconColor="bg-amber-500/20 text-amber-400"
      />
      <StatsCard
        label="Pro / Enterprise"
        value={`${stats.proUsers} / ${stats.enterpriseUsers}`}
        icon={CreditCard}
        iconColor="bg-purple-500/20 text-purple-400"
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────

export function DevAdminUserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [userToAction, setUserToAction] = useState<ManagedUser | null>(null);
  
  // Suspend form state
  const [suspendDuration, setSuspendDuration] = useState('30');
  const [suspendReason, setSuspendReason] = useState('');

  const limit = 20;

  // Fetch overview stats
  const { data: overviewStats, isLoading: isLoadingOverviewStats } = useQuery({
    queryKey: ['admin', 'overview-stats'],
    queryFn: UserManagementService.getOverviewStats,
    staleTime: 60 * 1000,
  });

  // Fetch users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users', search, statusFilter, planFilter, page],
    queryFn: () =>
      UserManagementService.listUsers({
        search,
        status: statusFilter,
        plan: planFilter,
        page,
        limit,
      }),
    staleTime: 30 * 1000,
  });

  // Fetch user stats when viewing details
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin', 'user-stats', selectedUser?.id],
    queryFn: () => UserManagementService.getUserStats(selectedUser!.id),
    enabled: !!selectedUser,
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: ({ userId, duration, reason }: { userId: string; duration: string; reason: string }) => 
      UserManagementService.suspendUser(userId, duration, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview-stats'] });
      setShowSuspendDialog(false);
      setUserToAction(null);
      setSuspendDuration('30');
      setSuspendReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => UserManagementService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview-stats'] });
      toast.success('User reactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reactivate user');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => UserManagementService.sendPasswordReset(email),
    onSuccess: () => {
      toast.success('Password reset email sent');
      setShowResetDialog(false);
      setUserToAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reset email');
    },
  });

  const handleExport = useCallback(() => {
    if (data?.users) {
      UserManagementService.exportUsers(data.users);
      toast.success('Export started');
    }
  }, [data?.users]);

  const handleViewUser = useCallback(async (user: ManagedUser) => {
    const details = await UserManagementService.getUserDetails(user.id);
    setSelectedUser(details || user);
    setShowUserDialog(true);
  }, []);

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const PLAN_ICONS = {
    free: Shield,
    pro: Zap,
    enterprise: Crown,
  };

  const PLAN_COLORS = {
    free: 'bg-slate-500/20 text-slate-400',
    pro: 'bg-blue-500/20 text-blue-400',
    enterprise: 'bg-purple-500/20 text-purple-400',
  };

  const STATUS_COLORS = {
    active: 'bg-emerald-500/20 text-emerald-400',
    suspended: 'bg-red-500/20 text-red-400',
    pending: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <OverviewStatsGrid stats={overviewStats} loading={isLoadingOverviewStats} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-slate-400">
            Manage platform users, subscriptions, and access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email, name, or organization..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-300">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Users Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Organization</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400">Last Active</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : data?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.map((user) => {
                  const PlanIcon = PLAN_ICONS[user.plan_id as keyof typeof PLAN_ICONS] || Shield;
                  return (
                    <TableRow key={user.id} className="border-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-slate-700 text-slate-300">
                              {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-200">
                              {user.full_name || 'Unnamed'}
                            </p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user.organization_name || (
                          <span className="text-slate-500">No org</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'gap-1',
                          PLAN_COLORS[user.plan_id as keyof typeof PLAN_COLORS] || PLAN_COLORS.free
                        )}>
                          <PlanIcon className="w-3 h-3" />
                          {user.plan_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[user.status] || STATUS_COLORS.active}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => handleViewUser(user)}
                              className="text-slate-200"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setUserToAction(user);
                                setShowResetDialog(true);
                              }}
                              className="text-slate-200"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {user.status === 'suspended' ? (
                              <DropdownMenuItem
                                onClick={() => activateMutation.mutate(user.id)}
                                className="text-emerald-400"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToAction(user);
                                  setShowSuspendDialog(true);
                                }}
                                className="text-red-400"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, data?.total || 0)} of {data?.total || 0}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser?.avatar_url} />
                <AvatarFallback className="bg-slate-700">
                  {(selectedUser?.full_name?.[0] || selectedUser?.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>
                  {selectedUser?.full_name || 'User Details'}
                </span>
                <p className="text-sm font-normal text-slate-400">{selectedUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-red-500/20">
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-red-500/20">
                Activity
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-red-500/20">
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400">Transactions</p>
                  <p className="text-xl font-bold text-white">
                    {isLoadingStats ? '...' : userStats?.total_transactions || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400">Invoices</p>
                  <p className="text-xl font-bold text-white">
                    {isLoadingStats ? '...' : userStats?.total_invoices || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400">Revenue</p>
                  <p className="text-xl font-bold text-emerald-400">
                    ${isLoadingStats ? '...' : (userStats?.total_revenue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400">AI Tokens</p>
                  <p className="text-xl font-bold text-purple-400">
                    {isLoadingStats ? '...' : (userStats?.ai_tokens_used || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Organization</Label>
                  <p className="text-slate-200">{selectedUser?.organization_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Role</Label>
                  <p className="text-slate-200 capitalize">{selectedUser?.role || 'Member'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Plan</Label>
                  <Badge className={cn(
                    'mt-1',
                    PLAN_COLORS[selectedUser?.plan_id as keyof typeof PLAN_COLORS] || PLAN_COLORS.free
                  )}>
                    {selectedUser?.plan_id || 'free'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-400">Status</Label>
                  <Badge className={cn(
                    'mt-1',
                    STATUS_COLORS[selectedUser?.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active
                  )}>
                    {selectedUser?.status || 'active'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-400">Email Verified</Label>
                  <p className="text-slate-200 flex items-center gap-1">
                    {selectedUser?.email_verified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400" />
                        No
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-400">Joined</Label>
                  <p className="text-slate-200">
                    {selectedUser?.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="text-center py-8 text-slate-500">
                Activity logs would be displayed here
              </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div>
                    <p className="font-medium text-white">Current Plan</p>
                    <p className="text-sm text-slate-400 capitalize">{selectedUser?.plan_id || 'free'}</p>
                  </div>
                  <Badge className={cn(
                    selectedUser?.subscription_status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {selectedUser?.subscription_status || 'N/A'}
                  </Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowUserDialog(false)} className="border-slate-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={(open) => {
        setShowSuspendDialog(open);
        if (!open) {
          setSuspendDuration('30');
          setSuspendReason('');
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Suspend User
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Suspend <span className="text-white font-medium">{userToAction?.email}</span> for misconduct. 
              They will not be able to access the platform until reactivated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Suspension Duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Reason for Suspension</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Describe the misconduct or reason for suspension..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">
                  This action will immediately log the user out and prevent access to their account.
                  {suspendDuration === 'permanent' && ' This suspension will not expire automatically.'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSuspendDialog(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => userToAction && suspendMutation.mutate({
                userId: userToAction.id,
                duration: suspendDuration,
                reason: suspendReason,
              })}
              disabled={suspendMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {suspendMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reset Password</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Send a password reset email to {userToAction?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-700 text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToAction && resetPasswordMutation.mutate(userToAction.email)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {resetPasswordMutation.isPending ? 'Sending...' : 'Send Reset Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DevAdminUserManagement;
