/**
 * AdminDashboard.tsx
 * ──────────────────
 * Owner / admin-only monitoring panel.
 * Shows real platform data from Supabase:
 *   - KPI stats (users, orgs, MRR, subscriptions)
 *   - Visual analytics (growth charts, revenue breakdown, activity timeline)
 *   - All registered users with email, name, signup date, last login
 *   - Auth events: live login/logout activity feed
 *   - Organization list with plan & subscription info
 *   - Subscription / plan distribution
 *   - Deactivate / Reactivate users directly
 *   - System health monitoring
 *   - CSV export for users & organizations
 *
 * Data loading strategy:
 *   1. Try edge function (service role → full platform visibility)
 *   2. Fallback to direct Supabase client queries (may be limited by RLS)
 *
 * Access is gated by AdminAccessCheck (user_roles table, role = 'admin').
 * Regular users never see this page or its navigation link.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import { PLANS, type PlanId } from '@/lib/plans';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Users, UserPlus, Building2, DollarSign, CreditCard,
  RefreshCw, Search, Shield, ShieldAlert, Mail,
  Crown, Sparkles, Zap, LogIn, LogOut, Clock, CheckCircle2, XCircle,
  TrendingUp, AlertCircle, Download, Wifi, Ban, UserCheck, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Admin subsystem imports
import { useAdminData } from '@/hooks/useAdminData';
import {
  AdminUserAPI,
  AdminDashboardAPI,
  type AuthEvent,
} from '@/services/adminService';
import {
  UserGrowthChart,
  RevenueBreakdownChart,
  SubscriptionStatusChart,
  ActivityTimeline,
  VerificationGauge,
} from '@/components/admin/AdminAnalyticsCharts';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-slate-100 text-slate-500',
  paused:   'bg-amber-100 text-amber-700',
  suspended:'bg-red-200 text-red-800',
  free:     'bg-slate-100 text-slate-600',
};

const PLAN_CLASS: Record<string, string> = {
  free:       'bg-slate-100 text-slate-600',
  pro:        'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const PLAN_ICONS = { free: Shield, pro: Zap, enterprise: Sparkles } as const;

const MRR_BY_PLAN: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };

const EVENT_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  signup: UserPlus,
  token_refresh: RefreshCw,
};

const EVENT_COLORS: Record<string, string> = {
  login:  'bg-green-100 text-green-600',
  logout: 'bg-red-100 text-red-600',
  signup: 'bg-blue-100 text-blue-600',
  token_refresh: 'bg-slate-100 text-slate-500',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

// ─────────────────────────────────────────
// Stat card component
// ─────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-slate-400 mt-0.5">{label}</div>
            {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userSearch, setUserSearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');

  // Auth events state
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [authEventsLoading, setAuthEventsLoading] = useState(false);
  const [authEventFilter, setAuthEventFilter] = useState<string>('all');

  // Suspend / Reactivate dialog
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; email: string } | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<{ id: string; email: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Use the centralized admin data hook with auto-refresh every 2 minutes
  const {
    users, orgs, stats,
    loading, refreshing, dataSource, loadError,
    refresh, exportUsers, exportOrgs,
    filteredUsers: getFilteredUsers,
    filteredOrgs: getFilteredOrgs,
    recentSignups, recentLogins,
  } = useAdminData({ autoRefresh: true, refreshInterval: 120000 });

  const filteredUsers = getFilteredUsers(userSearch);
  const filteredOrgs = getFilteredOrgs(orgSearch);

  // ── Load auth events ──
  const loadAuthEvents = useCallback(async () => {
    setAuthEventsLoading(true);
    try {
      const result = await AdminDashboardAPI.fetchAuthEvents({
        perPage: 200,
        filterType: authEventFilter !== 'all' ? authEventFilter : undefined,
      });
      setAuthEvents(result.events);
    } catch (err) {
      console.error('Failed to load auth events:', err);
    } finally {
      setAuthEventsLoading(false);
    }
  }, [authEventFilter]);

  useEffect(() => {
    if (!loading) {
      loadAuthEvents();
    }
  }, [loading, loadAuthEvents]);

  // ── Suspend user ──
  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setActionLoading(true);
    try {
      await AdminUserAPI.suspend(suspendTarget.id, { duration: '30', reason: 'Suspended by admin' });
      toast.success(`User ${suspendTarget.email} has been deactivated`);
      setSuspendTarget(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reactivate user ──
  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setActionLoading(true);
    try {
      await AdminUserAPI.unsuspend(reactivateTarget.id);
      toast.success(`User ${reactivateTarget.email} has been reactivated`);
      setReactivateTarget(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ──

  return (
    <AdminAccessCheck>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ADMIN DASHBOARD - Distinct dark theme with red accents                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-slate-950">
        
        {/* ── Admin Top Bar ── */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-slate-900 border-b border-red-700/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-white flex items-center gap-2">
                  Admin Control Center
                  <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px]">
                    RESTRICTED
                  </Badge>
                </h1>
                <p className="text-sm text-red-200/70">
                  Platform management & user monitoring
                  {dataSource && (
                    <span className={cn('ml-2 px-2 py-0.5 rounded text-xs', 
                      dataSource === 'edge' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    )}>
                      {dataSource === 'edge' ? '● Live Data' : '● Limited Mode'}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" 
                className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                onClick={() => navigate('/admin/users')}>
                <Users className="w-3.5 h-3.5 mr-1" /> Manage Users
              </Button>
              <Button variant="outline" size="sm" 
                className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                onClick={() => navigate('/super-admin')}>
                <Crown className="w-3.5 h-3.5 mr-1" /> Super Admin
              </Button>
              <Button variant="outline" size="sm" 
                className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                onClick={exportUsers} disabled={users.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" /> Export
              </Button>
              <Button variant="outline" size="sm" 
                className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                disabled={refreshing} onClick={refresh}>
                <RefreshCw className={cn('w-3.5 h-3.5 mr-1', refreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" 
                className="bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="max-w-7xl mx-auto p-6 space-y-6">

          {/* ── Error banner ── */}
          {loadError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {loadError}
              <Button variant="ghost" size="sm" className="ml-auto text-red-200 hover:text-white hover:bg-red-800" onClick={refresh}>
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-5 pb-4">
                      <div className="h-8 bg-slate-700 rounded w-16 mb-2" />
                      <div className="h-4 bg-slate-700 rounded w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── KPI Stats Row 1: Users ── */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Registered Users" value={stats.totalUsers}
                    sub={`${stats.verifiedUsers} verified`} color="bg-blue-100 text-blue-600" />
                  <StatCard icon={UserPlus} label="New Signups Today" value={stats.newUsersToday}
                    sub={`${stats.newUsersThisWeek} this week`} color="bg-green-100 text-green-600" />
                  <StatCard icon={TrendingUp} label="Signups This Month" value={stats.newUsersThisMonth}
                    color="bg-teal-100 text-teal-600" />
                  <StatCard icon={LogIn} label="Active Logins (7d)" value={stats.recentLogins}
                    sub="unique sign-ins" color="bg-violet-100 text-violet-600" />
                </div>
              )}

              {/* ── KPI Stats Row 2: Business ── */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Building2} label="Organizations" value={stats.totalOrgs}
                    sub={`${stats.activeOrgs} active`} color="bg-indigo-100 text-indigo-600" />
                  <StatCard icon={DollarSign} label="Est. MRR" value={`$${stats.mrr.toLocaleString()}`}
                    sub="monthly recurring" color="bg-emerald-100 text-emerald-600" />
                  <StatCard icon={Crown} label="Pro Plans" value={stats.planCounts.pro || 0}
                    sub={`$${(stats.planCounts.pro || 0) * 29}/mo`} color="bg-amber-100 text-amber-600" />
                  <StatCard icon={Sparkles} label="Enterprise Plans" value={stats.planCounts.enterprise || 0}
                    sub={`$${(stats.planCounts.enterprise || 0) * 79}/mo`} color="bg-purple-100 text-purple-600" />
                </div>
              )}

              {/* ── Analytics Charts Row ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UserGrowthChart users={users} months={6} />
                <RevenueBreakdownChart orgs={orgs} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ActivityTimeline users={users} />
                {stats && <SubscriptionStatusChart statusCounts={stats.statusCounts} />}
                {stats && <VerificationGauge verified={stats.verifiedUsers} total={stats.totalUsers} />}
              </div>

              {/* ── Verification & Plan Distribution ── */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-300">Verified Emails</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{stats.verifiedUsers}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-slate-300">Unverified</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400">{stats.unverifiedUsers}</div>
                    </CardContent>
                  </Card>

                  {(['free', 'pro', 'enterprise'] as const).map((planId) => {
                    const count = stats.planCounts[planId] || 0;
                    const pct = stats.totalOrgs ? Math.round((count / stats.totalOrgs) * 100) : 0;
                    const Icon = PLAN_ICONS[planId];
                    return (
                      <Card key={planId} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium capitalize text-slate-300">
                                {PLANS[planId]?.name ?? planId}
                              </span>
                            </div>
                            <Badge variant="secondary" className={cn('text-xs', PLAN_CLASS[planId])}>
                              {pct}%
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="h-1.5 mt-2 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* ── Main Tabs ── */}
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="flex-wrap h-auto bg-slate-800/50 border border-slate-700">
                  <TabsTrigger value="users" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Mail className="w-4 h-4" /> All Users
                  </TabsTrigger>
                  <TabsTrigger value="auth-events" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Activity className="w-4 h-4" /> Logins / Logouts
                  </TabsTrigger>
                  <TabsTrigger value="signups" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <UserPlus className="w-4 h-4" /> Recent Signups
                  </TabsTrigger>
                  <TabsTrigger value="orgs" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Building2 className="w-4 h-4" /> Organizations
                  </TabsTrigger>
                  <TabsTrigger value="subscriptions" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <CreditCard className="w-4 h-4" /> Subscriptions
                  </TabsTrigger>
                  <TabsTrigger value="health" className="gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Wifi className="w-4 h-4" /> System Health
                  </TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════════════════ */}
                {/* ── All Users Tab (with deactivate/reactivate) ── */}
                {/* ═══════════════════════════════════════════════ */}
                <TabsContent value="users" className="mt-4">
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <CardTitle className="text-base text-white">All Registered Users</CardTitle>
                          <CardDescription className="text-slate-400">
                            Every user on the platform — names, emails, login status, subscriptions — {users.length} total
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                              placeholder="Search by name or email…"
                              className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                            />
                          </div>
                          <Button variant="outline" size="sm" 
                            className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700"
                            onClick={exportUsers} disabled={users.length === 0}>
                            <Download className="w-3.5 h-3.5 mr-1" /> CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {users.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                          <p className="font-medium text-slate-300">No users found</p>
                          <p className="text-xs mt-1 text-slate-500">
                            {dataSource === 'direct'
                              ? 'Edge function not deployed — deploy to Supabase for full user list'
                              : 'No users have signed up yet'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl border border-slate-700 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/80 border-slate-700">
                                  <TableHead className="w-8 text-slate-300">#</TableHead>
                                  <TableHead className="text-slate-300">Name</TableHead>
                                  <TableHead className="text-slate-300">Email</TableHead>
                                  <TableHead className="text-slate-300">Signed Up</TableHead>
                                  <TableHead className="text-slate-300">Last Login</TableHead>
                                  <TableHead className="text-slate-300">Status</TableHead>
                                  <TableHead className="text-slate-300">Roles</TableHead>
                                  <TableHead className="text-right text-slate-300">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredUsers.length > 0 ? filteredUsers
                                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                  .map((u, i) => {
                                    const isBanned = u.roles?.includes('suspended');
                                    const fullName = (u.first_name + ' ' + u.last_name).trim();
                                    return (
                                      <TableRow key={u.id} className={isBanned ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                                        <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <div className={cn(
                                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                                              isBanned
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                                            )}>
                                              {(u.first_name?.[0] || u.email[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                              <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                                                {fullName || <span className="text-slate-400 italic">No name</span>}
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">{u.id.substring(0, 8)}…</div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="text-sm font-medium">{u.email}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">{fmtDate(u.created_at)}</TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                          {u.last_sign_in_at ? (
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                {(Date.now() - new Date(u.last_sign_in_at).getTime()) < 24 * 60 * 60 * 1000 && (
                                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                )}
                                                {timeAgo(u.last_sign_in_at)}
                                              </div>
                                              <div className="text-[10px] text-slate-400">{fmtDateTime(u.last_sign_in_at)}</div>
                                            </div>
                                          ) : (
                                            <span className="text-slate-300">Never</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {isBanned ? (
                                            <Badge className="bg-red-100 text-red-700 text-xs">
                                              <Ban className="w-3 h-3 mr-1" /> Deactivated
                                            </Badge>
                                          ) : u.confirmed ? (
                                            <Badge className="bg-green-100 text-green-700 text-xs">
                                              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              <Clock className="w-3 h-3 mr-1" /> Pending
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex gap-1 flex-wrap">
                                            {(u.roles || []).length > 0 ? u.roles!.map((r) => (
                                              <Badge key={r} variant="outline" className="text-[10px] capitalize">{r}</Badge>
                                            )) : (
                                              <span className="text-xs text-slate-300">user</span>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex gap-1 justify-end">
                                            {isBanned ? (
                                              <Button size="sm" variant="outline"
                                                className="h-7 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                                                onClick={() => setReactivateTarget({ id: u.id, email: u.email })}>
                                                <UserCheck className="w-3 h-3" /> Reactivate
                                              </Button>
                                            ) : (
                                              <Button size="sm" variant="outline"
                                                className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => setSuspendTarget({ id: u.id, email: u.email })}>
                                                <Ban className="w-3 h-3" /> Deactivate
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }) : (
                                  <TableRow>
                                    <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                                      No users match "{userSearch}"
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Showing {filteredUsers.length} of {users.length} registered users
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════ */}
                {/* ── Auth Events (Logins & Logouts) Tab ──────── */}
                {/* ═══════════════════════════════════════════════ */}
                <TabsContent value="auth-events" className="mt-4">
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2 text-white">
                            <Activity className="w-5 h-5 text-red-400" />
                            User Login & Logout Activity
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Real-time tracking of user authentication events — {authEvents.length} events loaded
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={authEventFilter} onValueChange={(v) => setAuthEventFilter(v)}>
                            <SelectTrigger className="w-36 h-8 text-xs bg-slate-800 border-slate-600 text-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="all">All Events</SelectItem>
                              <SelectItem value="login">Logins Only</SelectItem>
                              <SelectItem value="logout">Logouts Only</SelectItem>
                              <SelectItem value="signup">Signups Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" 
                            className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700"
                            onClick={loadAuthEvents} disabled={authEventsLoading}>
                            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', authEventsLoading && 'animate-spin')} />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {authEventsLoading ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-slate-700">
                              <div className="w-8 h-8 rounded-full bg-slate-700" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-700 rounded w-48" />
                                <div className="h-3 bg-slate-700 rounded w-32" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : authEvents.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <Activity className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                          <p className="font-medium text-slate-300">No auth events recorded yet</p>
                          <p className="text-xs mt-1 text-slate-500">
                            Login and logout events will appear here as users interact with the platform.
                            Events are tracked automatically once the auth_events table is created in Supabase.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Summary counters */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {[
                              { type: 'login', label: 'Logins', icon: LogIn, color: 'text-green-600' },
                              { type: 'logout', label: 'Logouts', icon: LogOut, color: 'text-red-600' },
                              { type: 'signup', label: 'Signups', icon: UserPlus, color: 'text-blue-600' },
                            ].map(({ type, label, icon: SIcon, color }) => {
                              const count = authEvents.filter(e => e.event_type === type).length;
                              return (
                                <div key={type} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <SIcon className={cn('w-4 h-4', color)} />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                                  </div>
                                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{count}</span>
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Unique Users</span>
                              </div>
                              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {new Set(authEvents.map(e => e.user_id)).size}
                              </span>
                            </div>
                          </div>

                          {/* Event list */}
                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800">
                                  <TableHead className="w-10">Event</TableHead>
                                  <TableHead>User</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Browser / Device</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {authEvents.map((evt) => {
                                  const EvtIcon = EVENT_ICONS[evt.event_type] || Activity;
                                  const evtColor = EVENT_COLORS[evt.event_type] || 'bg-slate-100 text-slate-500';
                                  const userAgent = evt.user_agent || '';
                                  const browserInfo = userAgent.includes('Chrome') ? 'Chrome'
                                    : userAgent.includes('Firefox') ? 'Firefox'
                                    : userAgent.includes('Safari') ? 'Safari'
                                    : userAgent.includes('Edge') ? 'Edge'
                                    : 'Unknown';
                                  const deviceInfo = userAgent.includes('Mobile') ? 'Mobile'
                                    : userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
                                  return (
                                    <TableRow key={evt.id}>
                                      <TableCell>
                                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', evtColor)}>
                                          <EvtIcon className="w-4 h-4" />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                          {evt.email || evt.metadata?.email || (
                                            <span className="text-slate-400 font-mono text-xs">{evt.user_id.substring(0, 12)}…</span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 capitalize">{evt.event_type.replace('_', ' ')}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{timeAgo(evt.created_at)}</div>
                                        <div className="text-[10px] text-slate-400">{fmtDateTime(evt.created_at)}</div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="secondary" className="text-[10px]">
                                          {browserInfo} · {deviceInfo}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════ */}
                {/* ── Recent Signups Tab ────────────────────────  */}
                {/* ═══════════════════════════════════════════════ */}
                <TabsContent value="signups" className="mt-4">
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Recent Signups</CardTitle>
                      <CardDescription className="text-slate-400">
                        {stats
                          ? `${stats.newUsersToday} today · ${stats.newUsersThisWeek} this week · ${stats.newUsersThisMonth} this month`
                          : 'Latest user registrations'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentSignups.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <UserPlus className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                          <p className="text-slate-300">No signups recorded yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {recentSignups.map((u) => {
                            const isToday = new Date(u.created_at) >= new Date(new Date().setHours(0,0,0,0));
                            return (
                              <div key={u.id} className={cn(
                                'flex items-center justify-between px-4 py-3 rounded-lg border',
                                isToday
                                  ? 'border-green-700 bg-green-950/50'
                                  : 'border-slate-700 bg-slate-800/50'
                              )}>
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                    isToday ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-300'
                                  )}>
                                    {(u.first_name?.[0] || u.email[0] || '?').toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-200">
                                      {u.email}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {(u.first_name + ' ' + u.last_name).trim() || 'No name provided'}
                                      {u.confirmed ? (
                                        <span className="ml-2 text-green-400">✓ verified</span>
                                      ) : (
                                        <span className="ml-2 text-amber-400">pending verification</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">{timeAgo(u.created_at)}</div>
                                  <div className="text-[10px] text-slate-500">{fmtDateTime(u.created_at)}</div>
                                  {isToday && (
                                    <Badge className="bg-green-900/50 text-green-300 border border-green-700 text-[10px] mt-1">NEW TODAY</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════ */}
                {/* ── Organizations Tab ────────────────────────── */}
                {/* ═══════════════════════════════════════════════ */}
                <TabsContent value="orgs" className="mt-4">
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <CardTitle className="text-base text-white">Organizations</CardTitle>
                          <CardDescription className="text-slate-400">All businesses on the platform ({orgs.length} total)</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                              placeholder="Search organizations…"
                              className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                              value={orgSearch}
                              onChange={(e) => setOrgSearch(e.target.value)}
                            />
                          </div>
                          <Button variant="outline" size="sm" 
                            className="bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700"
                            onClick={exportOrgs} disabled={orgs.length === 0}>
                            <Download className="w-3.5 h-3.5 mr-1" /> CSV
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {orgs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                          <p className="text-slate-300">No organizations found</p>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl border border-slate-700 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/80 border-slate-700">
                                  <TableHead className="text-slate-300">Organization</TableHead>
                                  <TableHead className="text-slate-300">Plan</TableHead>
                                  <TableHead className="text-slate-300">Status</TableHead>
                                  <TableHead className="text-slate-300">Members</TableHead>
                                  <TableHead className="text-slate-300">Currency</TableHead>
                                  <TableHead className="text-slate-300">Created</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredOrgs.map((o) => (
                                  <TableRow key={o.id} className="border-slate-700">
                                    <TableCell>
                                      <div className="font-medium text-sm text-white">{o.name}</div>
                                      <div className="text-xs text-slate-500">{o.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className={cn('text-xs', PLAN_CLASS[o.plan_id] ?? 'bg-slate-100')}>
                                        {PLANS[o.plan_id as PlanId]?.name ?? o.plan_id}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className={cn('text-xs', STATUS_CLASS[o.sub_status] ?? 'bg-slate-100')}>
                                        {o.sub_status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-400">{o.user_count}</TableCell>
                                    <TableCell className="text-sm text-slate-400">{o.currency}</TableCell>
                                    <TableCell className="text-sm text-slate-500">{fmtDate(o.created_at)}</TableCell>
                                  </TableRow>
                                ))}
                                {filteredOrgs.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                      No organizations match your search
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">{filteredOrgs.length} of {orgs.length} organizations</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ═══════════════════════════════════════════════ */}
                {/* ── Subscriptions Tab ─────────────────────────  */}
                {/* ═══════════════════════════════════════════════ */}
                <TabsContent value="subscriptions" className="mt-4">
                  <Card className="bg-slate-900/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Subscription Overview</CardTitle>
                      <CardDescription className="text-slate-400">All active and inactive subscriptions across the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats && Object.keys(stats.statusCounts).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                          {Object.entries(stats.statusCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
                                <Badge variant="secondary" className={cn('text-xs', STATUS_CLASS[status] ?? 'bg-slate-700 text-slate-300')}>
                                  {status}
                                </Badge>
                                <span className="text-lg font-bold text-white">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {orgs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                          <p className="text-slate-300">No subscriptions found</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-700 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/80 border-slate-700">
                                <TableHead className="text-slate-300">Organization</TableHead>
                                <TableHead className="text-slate-300">Plan</TableHead>
                                <TableHead className="text-slate-300">Price</TableHead>
                                <TableHead className="text-slate-300">Status</TableHead>
                                <TableHead className="text-slate-300">Members</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orgs
                                .sort((a, b) => {
                                  const order = ['enterprise', 'pro', 'free'];
                                  return order.indexOf(a.plan_id) - order.indexOf(b.plan_id);
                                })
                                .map((o) => (
                                  <TableRow key={o.id} className="border-slate-700">
                                    <TableCell className="font-medium text-sm text-white">{o.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className={cn('text-xs', PLAN_CLASS[o.plan_id] ?? 'bg-slate-700')}>
                                        {PLANS[o.plan_id as PlanId]?.name ?? o.plan_id}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-emerald-400">
                                      {o.plan_id === 'free' ? '$0' : `$${MRR_BY_PLAN[o.plan_id] ?? 0}/mo`}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className={cn('text-xs', STATUS_CLASS[o.sub_status] ?? 'bg-slate-700')}>
                                        {o.sub_status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-400">{o.user_count}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── System Health Tab ── */}
                <TabsContent value="health" className="mt-4">
                  <SystemHealthMonitor autoCheck autoCheckInterval={60000} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* ── Deactivate User Confirmation Dialog ─────── */}
        {/* ═══════════════════════════════════════════════ */}
        <AlertDialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                Deactivate User
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate <strong>{suspendTarget?.email}</strong>?
                <br /><br />
                This will prevent the user from logging in for 30 days. They can be reactivated at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSuspend}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Deactivating…' : 'Deactivate User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ═══════════════════════════════════════════════ */}
        {/* ── Reactivate User Confirmation Dialog ──────  */}
        {/* ═══════════════════════════════════════════════ */}
        <AlertDialog open={!!reactivateTarget} onOpenChange={(open) => !open && setReactivateTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                Reactivate User
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reactivate <strong>{reactivateTarget?.email}</strong>?
                <br /><br />
                This will restore the user's ability to log in and use the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReactivate}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? 'Reactivating…' : 'Reactivate User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminAccessCheck>
  );
}
