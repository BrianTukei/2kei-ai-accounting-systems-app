import { useState, useEffect, useCallback } from "react";
import AdminAccessCheck from "@/components/admin/AdminAccessCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Key, Trash2, Search, Users, ShieldCheck, ShieldAlert, UserX, UserCheck,
  BarChart3, RefreshCw, Eye, Ban, CheckCircle, Clock, ChevronLeft, ChevronRight,
  Shield, Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from '@/components/layout/PageLayout';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
  roles?: string[];
  banned_until?: string;
  confirmed_at?: string;
  organization?: {
    organizationId?: string;
    orgRole?: string;
  } | null;
}

interface UserDetails extends AdminUser {
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    currency: string;
    role: string;
    joined: string;
  }>;
  subscription?: {
    plan_id: string;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    payment_provider: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
  suspendedUsers: number;
  confirmedUsers: number;
  unconfirmedUsers: number;
  adminCount: number;
  subscriptions: {
    total: number;
    active: number;
    pro: number;
    enterprise: number;
  };
}

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

// ── API Helper ───────────────────────────

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

// ── Stats Cards ──────────────────────────

function StatsGrid({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-slate-50 dark:bg-slate-900">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-12 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400' },
    { label: 'New This Month', value: stats.newUsersThisMonth, icon: UserCheck, color: 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-400' },
    { label: 'Active This Week', value: stats.activeUsersThisWeek, icon: Activity, color: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400' },
    { label: 'Suspended', value: stats.suspendedUsers, icon: Ban, color: 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400' },
    { label: 'Admins', value: stats.adminCount, icon: ShieldCheck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400' },
    { label: 'Active Subscriptions', value: stats.subscriptions.active, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { label: 'Pro Plans', value: stats.subscriptions.pro, icon: BarChart3, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400' },
    { label: 'Enterprise Plans', value: stats.subscriptions.enterprise, icon: Shield, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.color)}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────

export default function AdminUserManagement() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'all-users' | 'audit'>('users');

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);

  // Selected user
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    email: "", password: "", firstName: "", lastName: "", role: "admin",
  });
  const [resetPassword, setResetPassword] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("30");
  const [suspendReason, setSuspendReason] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Data Fetching ──────────────────────

  const fetchAdminUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (roleError) throw roleError;
      if (!roleData || roleData.length === 0) {
        setAdminUsers([]);
        return;
      }

      try {
        const result = await adminApiCall("list", {
          userIds: roleData.map(r => r.user_id),
        });
        setAdminUsers(result.users || []);
      } catch {
        // Edge function unavailable — build admin list from profiles table
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, created_at, updated_at")
          .in("id", roleData.map(r => r.user_id));

        if (profiles && profiles.length > 0) {
          setAdminUsers(profiles.map(p => ({
            id: p.id,
            email: p.email || "",
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            created_at: p.created_at,
            last_sign_in_at: p.updated_at,
            role: "admin",
          })));
        } else {
          setAdminUsers([]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching admin users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const result = await adminApiCall("list-all", {
          page,
          perPage: 50,
          search: searchQuery || undefined,
          roleFilter: roleFilter !== 'all' ? roleFilter : undefined,
        });
        setAllUsers(result.users || []);
        setTotalUsers(result.total || 0);
      } catch {
        // Edge function unavailable — load from profiles table
        let query = supabase
          .from("profiles")
          .select("id, first_name, last_name, email, created_at, updated_at", { count: 'exact' });

        if (searchQuery) {
          query = query.or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
        }

        const { data: profiles, count } = await query
          .order("created_at", { ascending: false })
          .range((page - 1) * 50, page * 50 - 1);

        if (profiles) {
          // Get roles for these users
          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", profiles.map(p => p.id));

          const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

          setAllUsers(profiles.map(p => ({
            id: p.id,
            email: p.email || "",
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            created_at: p.created_at,
            last_sign_in_at: p.updated_at,
            role: roleMap.get(p.id) || "user",
          })));
          setTotalUsers(count || 0);
        }
      }
    } catch (error: any) {
      console.error("Error fetching all users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, roleFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await adminApiCall("get-stats");
      setStats(result.stats);
    } catch (error: any) {
      console.error("Error fetching stats from edge function:", error);
      // Fallback: Calculate stats directly from supabase
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        // Get new users this month
        const { count: newUsersThisMonth } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Get active users this week (based on updated_at)
        const { count: activeUsersThisWeek } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', sevenDaysAgo.toISOString());

        // Get admin count
        const { count: adminCount } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin');

        // Get subscription stats
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('plan_id, status');

        const subsArray = subscriptions || [];
        const activeSubscriptions = subsArray.filter((s: any) => s.status === 'active');
        const proSubs = subsArray.filter((s: any) => s.plan_id === 'pro').length;
        const enterpriseSubs = subsArray.filter((s: any) => s.plan_id === 'enterprise').length;

        setStats({
          totalUsers: totalUsers || 0,
          newUsersThisMonth: newUsersThisMonth || 0,
          activeUsersThisWeek: activeUsersThisWeek || 0,
          suspendedUsers: 0,
          confirmedUsers: totalUsers || 0,
          unconfirmedUsers: 0,
          adminCount: adminCount || 0,
          subscriptions: {
            total: subsArray.length,
            active: activeSubscriptions.length,
            pro: proSubs,
            enterprise: enterpriseSubs,
          },
        });
      } catch (fallbackError) {
        console.error("Fallback stats fetch also failed:", fallbackError);
        // Set default stats so UI doesn't show loading indefinitely
        setStats({
          totalUsers: 0,
          newUsersThisMonth: 0,
          activeUsersThisWeek: 0,
          suspendedUsers: 0,
          confirmedUsers: 0,
          unconfirmedUsers: 0,
          adminCount: 0,
          subscriptions: { total: 0, active: 0, pro: 0, enterprise: 0 },
        });
      }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchAuditLog = useCallback(async () => {
    try {
      setAuditLoading(true);
      const result = await adminApiCall("get-audit-log", { page: 1, perPage: 100 });
      setAuditLogs(result.logs || []);
    } catch (error: any) {
      console.error("Error fetching audit log:", error);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminUsers();
    fetchStats();
  }, [fetchAdminUsers, fetchStats]);

  useEffect(() => {
    if (activeTab === 'all-users') fetchAllUsers();
    if (activeTab === 'audit') fetchAuditLog();
  }, [activeTab, fetchAllUsers, fetchAuditLog]);

  // ── User Actions ───────────────────────

  const handleCreateUser = async () => {
    try {
      if (!createForm.email || !createForm.password) {
        toast.error("Email and password are required");
        return;
      }
      if (createForm.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      await adminApiCall("create", {
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        role: createForm.role,
      });

      toast.success("User created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({ email: "", password: "", firstName: "", lastName: "", role: "admin" });
      fetchAdminUsers();
      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!resetPassword || resetPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      await adminApiCall("reset-password", {
        userId: selectedUserId,
        newPassword: resetPassword,
      });

      toast.success("Password reset successfully");
      setIsResetDialogOpen(false);
      setResetPassword("");
      setSelectedUserId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await adminApiCall("delete", { userId: deleteConfirm.id });
      toast.success("User deleted successfully");
      setDeleteConfirm(null);
      fetchAdminUsers();
      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleSuspendUser = async () => {
    try {
      await adminApiCall("suspend", {
        userId: selectedUserId,
        duration: suspendDuration,
        reason: suspendReason,
      });
      toast.success("User suspended successfully");
      setIsSuspendDialogOpen(false);
      setSuspendDuration("30");
      setSuspendReason("");
      fetchAdminUsers();
      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend user");
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await adminApiCall("unsuspend", { userId });
      toast.success("User reactivated");
      fetchAdminUsers();
      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate user");
    }
  };

  const handleViewDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      setIsDetailsDialogOpen(true);
      const result = await adminApiCall("get-user-details", { userId });
      setSelectedUserDetails(result.user);
    } catch (error: any) {
      toast.error(error.message || "Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string, removeRole?: string) => {
    try {
      await adminApiCall("update-role", { userId, newRole, removeRole });
      toast.success(removeRole ? "Role removed" : "Role assigned");
      fetchAdminUsers();
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleBulkAction = async (bulkAction: string) => {
    if (selectedIds.size === 0) {
      toast.error("No users selected");
      return;
    }
    try {
      const result = await adminApiCall("bulk-action", {
        userIds: Array.from(selectedIds),
        bulkAction,
      });
      toast.success(result.message);
      setSelectedIds(new Set());
      fetchAdminUsers();
      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || "Bulk action failed");
    }
  };

  // ── Helper ─────────────────────────────

  const isSuspended = (user: AdminUser) => {
    return user.banned_until && new Date(user.banned_until) > new Date();
  };

  const getUserName = (user: AdminUser) => {
    const first = user.user_metadata?.first_name || '';
    const last = user.user_metadata?.last_name || '';
    return (first + ' ' + last).trim() || '—';
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Render ─────────────────────────────

  const tabs = [
    { id: 'users' as const, label: 'Admin Users', icon: ShieldCheck },
    { id: 'all-users' as const, label: 'All Users', icon: Users },
    { id: 'audit' as const, label: 'Audit Log', icon: Clock },
  ];

  return (
    <AdminAccessCheck>
      <PageLayout
        title="Admin User Management"
        subtitle="Manage users, roles, and permissions"
        showSidebar={false}
        requireAuth={false}
      >
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats */}
          <StatsGrid stats={stats} loading={statsLoading} />

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { fetchAdminUsers(); fetchAllUsers(); fetchStats(); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Create a new user account with admin privileges.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={createForm.firstName}
                          onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={createForm.lastName}
                          onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── ADMIN USERS TAB ──────────── */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Users</CardTitle>
                <CardDescription>Users with administrative privileges</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading admin users...</div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No admin users found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{getUserName(u)}</TableCell>
                          <TableCell>
                            {isSuspended(u) ? (
                              <Badge variant="destructive" className="text-xs">Suspended</Badge>
                            ) : u.confirmed_at ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Unconfirmed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(u.id)} title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(u.id); setIsResetDialogOpen(true); }} title="Reset password">
                                <Key className="h-4 w-4" />
                              </Button>
                              {isSuspended(u) ? (
                                <Button variant="ghost" size="sm" onClick={() => handleUnsuspendUser(u.id)} title="Unsuspend">
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(u.id); setIsSuspendDialogOpen(true); }} title="Suspend">
                                  <Ban className="h-4 w-4 text-amber-600" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: u.id, email: u.email })} title="Delete">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ALL USERS TAB ────────────── */}
          {activeTab === 'all-users' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">All Users</CardTitle>
                    <CardDescription>{totalUsers} users total</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchAllUsers}>
                    <Search className="w-3.5 h-3.5 mr-1" /> Search
                  </Button>
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
                      <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')}>
                        <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading users...</div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No users found</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              aria-label="Select all users"
                              className="rounded border-slate-300"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(new Set(allUsers.map(u => u.id)));
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((u) => (
                          <TableRow key={u.id} className={selectedIds.has(u.id) ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}>
                            <TableCell>
                              <input
                                type="checkbox"
                                aria-label={`Select ${u.email}`}
                                className="rounded border-slate-300"
                                checked={selectedIds.has(u.id)}
                                onChange={() => toggleSelect(u.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-sm">{u.email}</TableCell>
                            <TableCell className="text-sm">{getUserName(u)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {(u.roles || []).length > 0 ? (
                                  u.roles!.map((r) => (
                                    <Badge key={r} variant="outline" className="text-xs capitalize">{r}</Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">user</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isSuspended(u) ? (
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              ) : u.confirmed_at ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Unconfirmed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(u.id)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(u.id); setIsResetDialogOpen(true); }}>
                                  <Key className="h-3.5 w-3.5" />
                                </Button>
                                {isSuspended(u) ? (
                                  <Button variant="ghost" size="sm" onClick={() => handleUnsuspendUser(u.id)}>
                                    <UserCheck className="h-3.5 w-3.5 text-green-600" />
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(u.id); setIsSuspendDialogOpen(true); }}>
                                    <Ban className="h-3.5 w-3.5 text-amber-600" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: u.id, email: u.email })}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-slate-500">
                        Page {page} — showing {allUsers.length} of {totalUsers}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={allUsers.length < 50} onClick={() => setPage(p => p + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── AUDIT LOG TAB ────────────── */}
          {activeTab === 'audit' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit Log</CardTitle>
                <CardDescription>Admin action history and security events</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading audit log...</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No audit log entries yet. Actions will appear here as admins manage users.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">
                            {log.admin_user_id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">
                            {log.target_user_id ? `${log.target_user_id.substring(0, 8)}...` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                            {JSON.stringify(log.details).substring(0, 80)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── RESET PASSWORD DIALOG ────── */}
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Set a new password for this user account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleResetPassword}>Reset Password</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── SUSPEND DIALOG ────────────── */}
          <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suspend User</DialogTitle>
                <DialogDescription>Temporarily or permanently block this user from signing in.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
                    rows={3}
                    placeholder="Reason for suspension..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleSuspendUser}>Suspend User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── USER DETAILS DIALOG ──────── */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
              </DialogHeader>
              {detailsLoading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : selectedUserDetails ? (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs">Email</span>
                      <span className="font-medium">{selectedUserDetails.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Name</span>
                      <span className="font-medium">{getUserName(selectedUserDetails)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Created</span>
                      <span>{new Date(selectedUserDetails.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Last Sign In</span>
                      <span>{selectedUserDetails.last_sign_in_at ? new Date(selectedUserDetails.last_sign_in_at).toLocaleString() : 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Status</span>
                      {isSuspended(selectedUserDetails) ? (
                        <Badge variant="destructive" className="text-xs">Suspended until {new Date(selectedUserDetails.banned_until!).toLocaleDateString()}</Badge>
                      ) : selectedUserDetails.confirmed_at ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Unconfirmed</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Roles</span>
                      <div className="flex gap-1 flex-wrap">
                        {(selectedUserDetails.roles || []).map((r) => (
                          <Badge key={r} variant="outline" className="text-xs capitalize">
                            {r}
                            <button
                              className="ml-1 text-red-400 hover:text-red-600"
                              onClick={() => handleUpdateRole(selectedUserDetails.id, '', r)}
                              title="Remove role"
                            >×</button>
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-1">
                        <Select onValueChange={(v) => handleUpdateRole(selectedUserDetails.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue placeholder="Add role..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Organizations */}
                  {selectedUserDetails.organizations && selectedUserDetails.organizations.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs font-medium block mb-1">Organizations</span>
                      <div className="space-y-1">
                        {selectedUserDetails.organizations.map((org) => (
                          <div key={org.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded px-3 py-1.5 text-sm">
                            <span className="font-medium">{org.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">{org.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscription */}
                  {selectedUserDetails.subscription && (
                    <div>
                      <span className="text-slate-500 text-xs font-medium block mb-1">Subscription</span>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Plan</span>
                          <span className="font-medium capitalize">{selectedUserDetails.subscription.plan_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status</span>
                          <Badge variant="outline" className="text-xs capitalize">{selectedUserDetails.subscription.status}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Provider</span>
                          <span className="capitalize">{selectedUserDetails.subscription.payment_provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Period End</span>
                          <span>{new Date(selectedUserDetails.subscription.current_period_end).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No user details available</div>
              )}
            </DialogContent>
          </Dialog>

          {/* ── DELETE CONFIRMATION ────────── */}
          <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete <strong>{deleteConfirm?.email}</strong>?
                  This action cannot be undone. The user will lose access to all organizations and data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteUser}>
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </PageLayout>
    </AdminAccessCheck>
  );
}