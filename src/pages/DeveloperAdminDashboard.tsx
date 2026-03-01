import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bot,
  Blocks,
  Activity,
  Bell,
  Code,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Search,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Zap,
  Brain,
  FileText,
  Receipt,
  Calculator,
  BarChart3,
  PieChart,
  LineChart,
  Megaphone,
  History,
} from 'lucide-react';
import { UserGrowthAreaChart, RevenueLineChart, PlanDistributionPieChart, SystemHealthVisualization } from '@/components/admin/DevAdminCharts';
import DevAdminUserManagement from '@/components/admin/DevAdminUserManagement';
import DevAdminAnnouncementForm from '@/components/admin/DevAdminAnnouncementForm';
import DevAdminLoginAudit from '@/components/admin/DevAdminLoginAudit';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import { useAdminAuth, useDashboardStats, useFeatureFlags, useAccountingModules, useAIControl, useSystemMonitoring, useNotifications, useDeveloperTools, useBilling } from '@/hooks/useDeveloperAdmin';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────

type NavSection = 
  | 'overview'
  | 'users'
  | 'billing'
  | 'ai'
  | 'modules'
  | 'monitoring'
  | 'audit'
  | 'notifications'
  | 'developers'
  | 'settings';

interface NavItem {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  requiresRole?: 'super_admin' | 'developer';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'ai', label: 'AI Control', icon: Brain },
  { id: 'modules', label: 'Modules', icon: Blocks },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'audit', label: 'Audit Log', icon: History },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'developers', label: 'Developer Tools', icon: Code, requiresRole: 'developer' },
  { id: 'settings', label: 'Settings', icon: Settings, requiresRole: 'super_admin' },
];

const HEALTH_COLORS = {
  healthy: 'text-emerald-500',
  degraded: 'text-amber-500',
  down: 'text-red-500',
  maintenance: 'text-blue-500',
};

const HEALTH_BG = {
  healthy: 'bg-emerald-500/20',
  degraded: 'bg-amber-500/20',
  down: 'bg-red-500/20',
  maintenance: 'bg-blue-500/20',
};

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────

function DeveloperAdminDashboardContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeSection = (searchParams.get('section') as NavSection) || 'overview';

  // New admin features navigation
  const ADMIN_FEATURE_SECTIONS = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'bulk', label: 'Bulk Actions', icon: Layers },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'orgs', label: 'Organizations', icon: Building2 },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'auth', label: 'Auth Events', icon: LogOut },
  ];
  
  const { user, signOut } = useAuth();
  const { isAdmin, adminRole, adminUser, hasPermission, isSuperAdmin, isDeveloper } = useAdminAuth();
  const dashboardStats = useDashboardStats();
  const featureFlags = useFeatureFlags();
  const accountingModules = useAccountingModules();
  const aiControl = useAIControl();
  const systemMonitoring = useSystemMonitoring();
  const notifications = useNotifications();
  const devTools = useDeveloperTools();
  const billing = useBilling();

  const setActiveSection = useCallback((section) => {
    setSearchParams({ section });
  }, [setSearchParams]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Filter nav items based on permissions
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (!item.requiresRole) return true;
    return hasPermission(item.requiresRole);
  });

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm">2K AI Admin</h1>
                <p className="text-[10px] text-slate-400">Developer Console</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
        {/* User & Collapse */}
        <div className="border-t border-slate-800 p-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-red-500/20 text-red-400">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-400 capitalize">{adminRole || 'Admin'}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-200">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-center text-slate-400 hover:text-white"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold capitalize">
              {activeSection === 'ai' ? 'AI Control Panel' : activeSection.replace(/_/g, ' ')}
            </h1>
            {systemMonitoring.overallHealth && (
              <Badge className={cn('text-xs', HEALTH_BG[systemMonitoring.overallHealth as keyof typeof HEALTH_BG])}>
                <span className={cn('w-2 h-2 rounded-full mr-2', 
                  systemMonitoring.overallHealth === 'healthy' ? 'bg-emerald-500' :
                  systemMonitoring.overallHealth === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                )} />
                {systemMonitoring.overallHealth}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                dashboardStats.refetch();
                toast.success('Data refreshed');
              }}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={cn('w-4 h-4', dashboardStats.isLoading && 'animate-spin')} />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Enhanced Supabase Admin Features */}
            {activeSection === 'overview' && (
              <OverviewSection stats={dashboardStats} monitoring={systemMonitoring} />
            )}
            {activeSection === 'users' && <DevAdminUserManagement />}
            {activeSection === 'bulk' && <BulkActionsSection />}
            {activeSection === 'stats' && <AdminStatsSection />}
            {activeSection === 'orgs' && <OrganizationsSection />}
            {activeSection === 'audit' && <AuditLogSection />}
            {activeSection === 'auth' && <AuthEventsSection />}
            {/* Existing sections */}
            {activeSection === 'billing' && <BillingSection billing={billing} />}
            {activeSection === 'ai' && <AIControlSection ai={aiControl} />}
            {activeSection === 'modules' && (
              <ModulesSection modules={accountingModules} features={featureFlags} />
            )}
            {activeSection === 'monitoring' && <MonitoringSection monitoring={systemMonitoring} />}
            {activeSection === 'notifications' && <NotificationsSection notifications={notifications} />}
            {activeSection === 'developers' && <DevelopersSection devTools={devTools} features={featureFlags} />}
            {activeSection === 'settings' && <SettingsSection />}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
// Bulk Actions Section
// ─────────────────────────────────────────
function BulkActionsSection() {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBulkAction = async () => {
    setIsLoading(true);
    try {
      const res = await adminApiCall('bulk-action', {
        userIds: selectedUserIds,
        bulkAction,
        reason,
      });
      setResult(res);
      toast.success(res.message || 'Bulk action complete');
    } catch (err: any) {
      toast.error(err.message || 'Bulk action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Actions</CardTitle>
        <CardDescription>Perform actions on multiple users at once.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="block text-slate-300 mb-2">User IDs (comma separated)</label>
          <Input
            value={selectedUserIds.join(',')}
            onChange={e => setSelectedUserIds(e.target.value.split(',').map(s => s.trim()))}
            placeholder="user1,user2,user3"
            className="mb-2"
          />
          <label className="block text-slate-300 mb-2">Bulk Action</label>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="suspend">Suspend</SelectItem>
              <SelectItem value="unsuspend">Unsuspend</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="add-role">Add Role</SelectItem>
              <SelectItem value="remove-role">Remove Role</SelectItem>
            </SelectContent>
          </Select>
          <label className="block text-slate-300 mt-4 mb-2">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for bulk action"
            className="mb-2 bg-slate-800 border-slate-700 text-white"
          />
          <Button onClick={handleBulkAction} disabled={isLoading || !bulkAction || selectedUserIds.length === 0} className="mt-2 bg-red-500 hover:bg-red-600 text-white">
            {isLoading ? 'Processing...' : 'Run Bulk Action'}
          </Button>
        </div>
        {result && (
          <div className="mt-4">
            <CardTitle>Result</CardTitle>
            <pre className="bg-slate-900 text-slate-300 p-2 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Admin Stats Section
// ─────────────────────────────────────────
function AdminStatsSection() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminApiCall('get-stats');
      setStats(res.stats);
    } catch (err) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchStats(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Stats</CardTitle>
        <CardDescription>Dashboard statistics for users, subscriptions, and more.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-slate-400">Loading stats...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard label="Total Users" value={stats.totalUsers} icon={Users} iconColor="bg-indigo-500/20 text-indigo-400" />
            <StatsCard label="New This Month" value={stats.newUsersThisMonth} icon={Sparkles} iconColor="bg-emerald-500/20 text-emerald-400" />
            <StatsCard label="Active This Week" value={stats.activeUsersThisWeek} icon={Zap} iconColor="bg-blue-500/20 text-blue-400" />
            <StatsCard label="Suspended Users" value={stats.suspendedUsers} icon={Ban} iconColor="bg-red-500/20 text-red-400" />
            <StatsCard label="Confirmed Users" value={stats.confirmedUsers} icon={CheckCircle2} iconColor="bg-green-500/20 text-green-400" />
            <StatsCard label="Unconfirmed Users" value={stats.unconfirmedUsers} icon={AlertTriangle} iconColor="bg-yellow-500/20 text-yellow-400" />
            <StatsCard label="Admin Count" value={stats.adminCount} icon={Shield} iconColor="bg-purple-500/20 text-purple-400" />
            <StatsCard label="Active Subs" value={stats.subscriptions.active} icon={CreditCard} iconColor="bg-amber-500/20 text-amber-400" />
            <StatsCard label="Pro Subs" value={stats.subscriptions.pro} icon={Crown} iconColor="bg-blue-500/20 text-blue-400" />
            <StatsCard label="Enterprise Subs" value={stats.subscriptions.enterprise} icon={Building2} iconColor="bg-pink-500/20 text-pink-400" />
          </div>
        ) : (
          <div className="text-slate-400">No stats available.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Organizations Section
// ─────────────────────────────────────────
function OrganizationsSection() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    adminApiCall('get-dashboard-data').then(res => {
      setOrgs(res.organizations || []);
      setSubs(res.subscriptions || []);
      setMembers(res.memberRows || []);
    }).catch(() => {
      toast.error('Failed to fetch organizations');
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>View all organizations and their subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-slate-400">Loading organizations...</div>
        ) : orgs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Subscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map(org => {
                  const sub = subs.find(s => s.organization_id === org.id);
                  const memberCount = members.filter(m => m.organization_id === org.id).length;
                  return (
                    <TableRow key={org.id}>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.owner_id}</TableCell>
                      <TableCell>{org.industry}</TableCell>
                      <TableCell>{org.country}</TableCell>
                      <TableCell>{org.currency}</TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{memberCount}</TableCell>
                      <TableCell>{sub ? `${sub.plan_id} (${sub.status})` : 'None'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-slate-400">No organizations found.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Auth Events Section
// ─────────────────────────────────────────
function AuthEventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    adminApiCall('get-auth-events', { page: 1, perPage: 100 }).then(res => {
      setEvents(res.events || []);
    }).catch(() => {
      toast.error('Failed to fetch auth events');
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auth Events</CardTitle>
        <CardDescription>View login/logout events for all users.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-slate-400">Loading events...</div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(ev => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.event_type}</TableCell>
                    <TableCell>{ev.user_id}</TableCell>
                    <TableCell>{ev.email}</TableCell>
                    <TableCell>{new Date(ev.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-slate-400">No auth events found.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Overview Section
// ─────────────────────────────────────────

function OverviewSection({ stats, monitoring }: { stats: ReturnType<typeof useDashboardStats>; monitoring: ReturnType<typeof useSystemMonitoring> }) {
  const { data, isLoading } = stats;

  const statCards = [
    {
      title: 'Total Users',
      value: data?.totalUsers ?? 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Subscriptions',
      value: data?.activeSubscriptions ?? 0,
      icon: CreditCard,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Monthly Revenue',
      value: `$${(data?.monthlyRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      change: '+23%',
      changeType: 'positive' as const,
    },
    {
      title: 'AI Requests Today',
      value: data?.aiRequestsToday ?? 0,
      icon: Brain,
      change: '+45%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? '...' : stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={cn(
                      'w-3 h-3',
                      stat.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'
                    )} />
                    <span className={cn(
                      'text-xs',
                      stat.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart - Using enhanced Recharts component */}
        <UserGrowthAreaChart data={data?.userGrowth || []} isLoading={isLoading} />

        {/* Revenue Chart - Using enhanced Recharts component */}
        <RevenueLineChart data={data?.revenueChart || []} isLoading={isLoading} />
      </div>

      {/* Plan Distribution & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution - Using enhanced Recharts component */}
        <PlanDistributionPieChart data={data?.planDistribution || []} isLoading={isLoading} />

        {/* System Health - Using enhanced visualization */}
        <div className="lg:col-span-2">
          <SystemHealthVisualization services={monitoring.healthStatus} isLoading={monitoring.isLoadingHealth} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Users Section (Placeholder)
// ─────────────────────────────────────────

function UsersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-slate-400">Manage platform users and their access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-red-500 hover:bg-red-600">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users by email or name..."
                className="pl-9 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400">Last Active</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-slate-800">
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  User management integrates with existing AdminDashboard functionality.
                  <br />
                  <span className="text-xs">Navigate to the existing admin panel for full user management.</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// Billing Section
// ─────────────────────────────────────────

function BillingSection({ billing }: { billing: ReturnType<typeof useBilling> }) {
  const { revenue, refunds, isLoadingRevenue, isLoadingRefunds, processRefund } = billing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Billing & Revenue</h2>
          <p className="text-sm text-slate-400">Manage subscriptions, revenue, and refunds</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">MRR</p>
            <p className="text-2xl font-bold text-white mt-1">
              ${revenue?.mrr?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">ARR</p>
            <p className="text-2xl font-bold text-white mt-1">
              ${revenue?.arr?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Growth</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              +{revenue?.revenueGrowth || 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Pending Refunds</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {refunds.filter(r => r.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Refund Requests</CardTitle>
          <CardDescription className="text-slate-400">
            Review and process refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refunds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Organization</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Reason</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id} className="border-slate-800">
                    <TableCell className="text-slate-200">{refund.organization_name || 'N/A'}</TableCell>
                    <TableCell className="text-slate-200">
                      ${refund.amount} {refund.currency.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-xs truncate">{refund.reason}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        refund.status === 'pending' && 'bg-amber-500/20 text-amber-400',
                        refund.status === 'approved' && 'bg-emerald-500/20 text-emerald-400',
                        refund.status === 'rejected' && 'bg-red-500/20 text-red-400',
                        refund.status === 'processed' && 'bg-blue-500/20 text-blue-400'
                      )}>
                        {refund.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {refund.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => processRefund({ id: refund.id, approved: true })}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => processRefund({ id: refund.id, approved: false })}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              No refund requests
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// AI Control Section
// ─────────────────────────────────────────

function AIControlSection({ ai }: { ai: ReturnType<typeof useAIControl> }) {
  const { usageStats, config, conversations, isLoadingUsageStats, updateConfig } = ai;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI System Control</h2>
          <p className="text-sm text-slate-400">Monitor and configure AI features</p>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Tokens</p>
                <p className="text-xl font-bold text-white">
                  {usageStats?.totalTokens?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Cost</p>
                <p className="text-xl font-bold text-white">
                  ${usageStats?.totalCost?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Today's Conversations</p>
                <p className="text-xl font-bold text-white">
                  {usageStats?.conversationsToday || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Tokens/Conv</p>
                <p className="text-xl font-bold text-white">
                  {usageStats?.averageTokensPerConversation || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Configuration */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">AI Configuration</CardTitle>
          <CardDescription className="text-slate-400">
            Configure AI features and limits per plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.length > 0 ? (
            <div className="space-y-4">
              {config.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium text-slate-200">{cfg.config_key}</p>
                    <p className="text-sm text-slate-400">{cfg.description || 'No description'}</p>
                  </div>
                  <Switch
                    checked={cfg.is_active}
                    onCheckedChange={(checked) =>
                      updateConfig({ id: cfg.id, updates: { is_active: checked } })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              No AI configuration found. Run database migrations.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent AI Conversations</CardTitle>
          <CardDescription className="text-slate-400">
            Monitor AI usage across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Tokens</TableHead>
                <TableHead className="text-slate-400">Cost</TableHead>
                <TableHead className="text-slate-400">Duration</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.length > 0 ? (
                conversations.slice(0, 10).map((conv) => (
                  <TableRow key={conv.id} className="border-slate-800">
                    <TableCell className="text-slate-200">{conv.user_email || conv.user_id}</TableCell>
                    <TableCell className="text-slate-300">{conv.total_tokens}</TableCell>
                    <TableCell className="text-slate-300">${conv.cost_usd.toFixed(4)}</TableCell>
                    <TableCell className="text-slate-300">
                      {conv.duration_ms ? `${conv.duration_ms}ms` : '-'}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(conv.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No AI conversations recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// Modules Section
// ─────────────────────────────────────────

function ModulesSection({ 
  modules, 
  features 
}: { 
  modules: ReturnType<typeof useAccountingModules>; 
  features: ReturnType<typeof useFeatureFlags>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Modules & Features</h2>
          <p className="text-sm text-slate-400">Control accounting modules and feature flags</p>
        </div>
      </div>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="modules" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            Accounting Modules
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            Feature Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Accounting Modules</CardTitle>
              <CardDescription className="text-slate-400">
                Enable or disable accounting modules for the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.data?.map((mod) => (
                  <div
                    key={mod.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      mod.is_enabled
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-slate-900/50 border-slate-800 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Blocks className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{mod.module_name}</p>
                          <p className="text-xs text-slate-400">{mod.module_key}</p>
                        </div>
                      </div>
                      <Switch
                        checked={mod.is_enabled}
                        onCheckedChange={(checked) =>
                          modules.toggleModule({ id: mod.id, enabled: checked })
                        }
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-3">{mod.description || 'No description'}</p>
                    <Badge className="mt-2 bg-slate-700 text-slate-300">
                      {mod.required_plan}
                    </Badge>
                  </div>
                ))}
                {!modules.data?.length && (
                  <p className="col-span-3 text-slate-500 text-sm text-center py-8">
                    No modules configured. Run database migrations.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Feature Flags</CardTitle>
              <CardDescription className="text-slate-400">
                Control feature rollout and beta features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Feature</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Rollout %</TableHead>
                    <TableHead className="text-slate-400">Plans</TableHead>
                    <TableHead className="text-slate-400 text-right">Toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.data?.map((flag) => (
                    <TableRow key={flag.id} className="border-slate-800">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-200">{flag.feature_name}</p>
                          <p className="text-xs text-slate-400">{flag.feature_key}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          flag.status === 'enabled' && 'bg-emerald-500/20 text-emerald-400',
                          flag.status === 'disabled' && 'bg-slate-500/20 text-slate-400',
                          flag.status === 'beta' && 'bg-purple-500/20 text-purple-400',
                          flag.status === 'deprecated' && 'bg-red-500/20 text-red-400'
                        )}>
                          {flag.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={flag.rollout_percentage} className="w-20 h-2 bg-slate-800" />
                          <span className="text-sm text-slate-400">{flag.rollout_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {flag.allowed_plans?.join(', ') || 'All'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={flag.status === 'enabled'}
                          onCheckedChange={(checked) =>
                            features.toggleFlag({ id: flag.id, enabled: checked })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!features.data?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No feature flags configured. Run database migrations.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────
// Monitoring Section
// ─────────────────────────────────────────

function MonitoringSection({ monitoring }: { monitoring: ReturnType<typeof useSystemMonitoring> }) {
  const { healthStatus, errorLogs, activityLogs, resolveError, isLoadingErrors } = monitoring;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">System Monitoring</h2>
          <p className="text-sm text-slate-400">Monitor system health, errors, and activity</p>
        </div>
      </div>

      {/* Health Status Grid */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-red-400" />
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthStatus.map((service) => (
              <div
                key={service.id}
                className={cn(
                  'p-4 rounded-lg border',
                  HEALTH_BG[service.status as keyof typeof HEALTH_BG],
                  service.status === 'healthy' && 'border-emerald-500/30',
                  service.status === 'degraded' && 'border-amber-500/30',
                  service.status === 'down' && 'border-red-500/30',
                  service.status === 'maintenance' && 'border-blue-500/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-3 h-3 rounded-full animate-pulse',
                    service.status === 'healthy' && 'bg-emerald-500',
                    service.status === 'degraded' && 'bg-amber-500',
                    service.status === 'down' && 'bg-red-500',
                    service.status === 'maintenance' && 'bg-blue-500'
                  )} />
                  <span className="font-medium text-white">{service.service_name}</span>
                </div>
                <p className="text-sm text-slate-400 mt-2 capitalize">{service.status}</p>
                {service.latency_ms && (
                  <p className="text-xs text-slate-500">Latency: {service.latency_ms}ms</p>
                )}
              </div>
            ))}
            {healthStatus.length === 0 && (
              <p className="col-span-4 text-slate-500 text-sm text-center py-8">
                No health data. Run database migrations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Logs */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {errorLogs.length > 0 ? (
                <div className="space-y-3">
                  {errorLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            log.severity === 'error' && 'bg-red-500/20 text-red-400',
                            log.severity === 'warning' && 'bg-amber-500/20 text-amber-400',
                            log.severity === 'info' && 'bg-blue-500/20 text-blue-400'
                          )}>
                            {log.severity}
                          </Badge>
                          {log.is_resolved && (
                            <Badge className="bg-emerald-500/20 text-emerald-400">resolved</Badge>
                          )}
                        </div>
                        {!log.is_resolved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveError(log.id)}
                            className="text-slate-400 hover:text-emerald-400"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 mt-2">{log.error_type}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.error_message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">
                  No errors logged
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.slice(0, 15).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">{log.action}</p>
                        {log.resource_type && (
                          <p className="text-xs text-slate-400">
                            {log.resource_type} {log.resource_id && `#${log.resource_id.slice(0, 8)}`}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">
                  No activity recorded
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Developer Tools Section
// ─────────────────────────────────────────

function DeveloperToolsSection() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('apikeys');

  useEffect(() => {
    setLoading(true);
    adminApiCall('get-dashboard-data').then(res => {
      setApiKeys(res.api_keys || []);
      setWebhooks(res.webhooks || []);
      setJobs(res.jobs || []);
      setDatabaseStats(res.database_stats || null);
    }).catch(() => {
      toast.error('Failed to fetch developer tools data');
    }).finally(() => setLoading(false));
  }, []);

  const revokeKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const toggleWebhook = (id: string, active: boolean) => {
    setWebhooks(webhooks.map(wh => wh.id === id ? { ...wh, is_active: active } : wh));
  };

  const retryJob = (id: string) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, status: 'failed' } : job));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Developer Tools</h2>
          <p className="text-sm text-slate-400">API keys, webhooks, and background jobs</p>
        </div>
      </div>

      <Tabs defaultValue="apikeys" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="apikeys" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            Background Jobs
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apikeys">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage organization API keys
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Key Prefix</TableHead>
                    <TableHead className="text-slate-400">Scopes</TableHead>
                    <TableHead className="text-slate-400">Last Used</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.length > 0 ? (
                    apiKeys.map((key) => (
                      <TableRow key={key.id} className="border-slate-800">
                        <TableCell className="text-slate-200">{key.name}</TableCell>
                        <TableCell className="font-mono text-slate-300">{key.key_prefix}...</TableCell>
                        <TableCell className="text-slate-300">
                          {key.scopes?.slice(0, 2).join(', ')}
                          {key.scopes?.length > 2 && ` +${key.scopes.length - 2}`}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge className={key.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                          }>
                            {key.is_active ? 'Active' : 'Revoked'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {key.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => revokeKey(key.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        No API keys found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Webhooks</CardTitle>
              <CardDescription className="text-slate-400">
                Manage webhook endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">URL</TableHead>
                    <TableHead className="text-slate-400">Events</TableHead>
                    <TableHead className="text-slate-400">Success/Fail</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.length > 0 ? (
                    webhooks.map((wh) => (
                      <TableRow key={wh.id} className="border-slate-800">
                        <TableCell className="text-slate-200">{wh.name}</TableCell>
                        <TableCell className="text-slate-400 max-w-xs truncate font-mono text-xs">
                          {wh.url}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {wh.events?.length || 0} events
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-400">{wh.success_count}</span>
                          {' / '}
                          <span className="text-red-400">{wh.failure_count}</span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={wh.is_active}
                            onCheckedChange={(active) =>
                              toggleWebhook({ id: wh.id, active })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-slate-400">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        No webhooks configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Background Jobs</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor and manage background jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Job</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Attempts</TableHead>
                    <TableHead className="text-slate-400">Scheduled</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length > 0 ? (
                    jobs.map((job) => (
                      <TableRow key={job.id} className="border-slate-800">
                        <TableCell className="text-slate-200">{job.job_name}</TableCell>
                        <TableCell className="text-slate-400">{job.job_type}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            job.status === 'pending' && 'bg-amber-500/20 text-amber-400',
                            job.status === 'running' && 'bg-blue-500/20 text-blue-400',
                            job.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                            job.status === 'failed' && 'bg-red-500/20 text-red-400'
                          )}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {job.attempts}/{job.max_attempts}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {new Date(job.scheduled_for).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => retryJob(job.id)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        No background jobs
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-red-400" />
                Database Statistics
              </CardTitle>
              <CardDescription className="text-slate-400">
                Database tables and storage usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">organizations</p>
                  <p className="text-xl font-bold text-white">~150 rows</p>
                  <p className="text-xs text-slate-500">2.4 MB</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">transactions</p>
                  <p className="text-xl font-bold text-white">~12,500 rows</p>
                  <p className="text-xs text-slate-500">45.2 MB</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">invoices</p>
                  <p className="text-xl font-bold text-white">~3,200 rows</p>
                  <p className="text-xs text-slate-500">12.1 MB</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-sm text-slate-400">Total Storage</p>
                  <p className="text-xl font-bold text-emerald-400">156.8 MB</p>
                  <p className="text-xs text-slate-500">of 500 MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────
// Settings Section
// ─────────────────────────────────────────

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Admin Settings</h2>
        <p className="text-sm text-slate-400">Configure platform-wide settings (Super Admin only)</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-200">Maintenance Mode</p>
              <p className="text-sm text-slate-400">Disable access for non-admin users</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-200">New Registrations</p>
              <p className="text-sm text-slate-400">Allow new user sign-ups</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-200">Email Verification Required</p>
              <p className="text-sm text-slate-400">Require email verification for new accounts</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-200">AI Features</p>
              <p className="text-sm text-slate-400">Enable AI assistant across the platform</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Export with Access Check
// ─────────────────────────────────────────

export default function DeveloperAdminDashboard() {
  return (
    <AdminAccessCheck>
      <DeveloperAdminDashboardContent />
    </AdminAccessCheck>
  );
}
