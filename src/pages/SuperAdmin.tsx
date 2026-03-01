/**
 * SuperAdmin.tsx
 * ──────────────
 * Hidden platform control panel at /super-admin.
 * Only accessible to users with the 'admin' role in user_roles.
 *
 * Features:
 *   - Platform KPIs (total orgs, users, MRR, AI calls)
 *   - Organization list with plan/status
 *   - Ability to suspend/activate orgs
 *   - AI usage heat-map (per org per month)
 *   - System health indicators
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Building2, Users, DollarSign, Activity, Search, Ban,
  CheckCircle2, RefreshCw, BarChart2, ShieldAlert, TrendingUp,
  Download, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS } from '@/lib/plans';
import { AdminDashboardAPI, AdminExportAPI, type OrgRow as ServiceOrgRow } from '@/services/adminService';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface OrgRow {
  id:         string;
  name:       string;
  slug:       string;
  owner_id:   string;
  industry:   string | null;
  country:    string | null;
  currency:   string;
  created_at: string;
  plan_id:    string;
  sub_status: string;
  user_count: number;
  ai_calls:   number;
}

interface PlatformStats {
  totalOrgs:    number;
  activeOrgs:   number;
  totalUsers:   number;
  totalAiCalls: number;
  mrr:          number;
}

// ─────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
            {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color ?? 'bg-indigo-100')}>
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Organization table
// ─────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-slate-100 text-slate-500',
  paused:   'bg-amber-100 text-amber-700',
  suspended:'bg-red-200 text-red-800',
};

const PLAN_CLASS: Record<string, string> = {
  free:       'bg-slate-100 text-slate-600',
  pro:        'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

function OrgTable({ orgs, onSuspend, onActivate }: {
  orgs: OrgRow[];
  onSuspend:  (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filtered = orgs.filter((o) => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || o.plan_id === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search organizations…" className="pl-9" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select defaultValue="all" onValueChange={setPlanFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>AI Calls</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{org.name}</div>
                  <div className="text-xs text-slate-400">{org.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-xs', PLAN_CLASS[org.plan_id] ?? 'bg-slate-100 text-slate-600')}>
                    {PLANS[org.plan_id as keyof typeof PLANS]?.name ?? org.plan_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-xs', STATUS_CLASS[org.sub_status] ?? 'bg-slate-100 text-slate-600')}>
                    {org.sub_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{org.user_count}</TableCell>
                <TableCell className="text-sm text-slate-600">{org.ai_calls}</TableCell>
                <TableCell className="text-sm text-slate-400">
                  {new Date(org.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {org.sub_status === 'suspended' ? (
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-green-700 border-green-200"
                        onClick={() => onActivate(org.id)}>
                        <CheckCircle2 className="w-3 h-3" /> Activate
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-red-600 border-red-200"
                        onClick={() => onSuspend(org.id)}>
                        <Ban className="w-3 h-3" /> Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  No organizations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} of {orgs.length} organizations</p>
    </div>
  );
}

// ─────────────────────────────────────────
// AI Usage tab
// ─────────────────────────────────────────

function AIUsageTab({ orgs }: { orgs: OrgRow[] }) {
  const sorted = [...orgs].sort((a, b) => b.ai_calls - a.ai_calls).slice(0, 20);
  const max    = sorted[0]?.ai_calls ?? 1;

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500 mb-4">Top 20 organizations by AI usage this month</p>
      {sorted.map((org) => (
        <div key={org.id} className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200 w-40 truncate">{org.name}</div>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.round((org.ai_calls / max) * 100)}%` }}
            />
          </div>
          <div className="text-sm font-medium text-slate-600 w-10 text-right">{org.ai_calls}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Main Super Admin page
// ─────────────────────────────────────────

export default function SuperAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats,      setStats]      = useState<PlatformStats | null>(null);
  const [orgs,       setOrgs]       = useState<OrgRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Auth check ────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc('is_super_admin', { _user_id: user.id })
      .then(({ data }) => {
        setAuthorized(!!data);
        if (!data) navigate('/', { replace: true });
      });
  }, [user, navigate]);

  // ── Load platform data (via centralized service) ────────────────

  const loadData = async () => {
    setLoading(true);
    try {
      // Use the centralized AdminDashboardAPI which handles edge function + fallback
      const orgData = await AdminDashboardAPI.fetchOrganizations();

      // AI usage still via direct query
      const { data: aiRows } = await supabase
        .from('ai_usage_log')
        .select('organization_id')
        .eq('month', new Date().toISOString().slice(0, 7));

      const aiMap: Record<string, number> = {};
      (aiRows ?? []).forEach((r: { organization_id: string }) => {
        aiMap[r.organization_id] = (aiMap[r.organization_id] ?? 0) + 1;
      });

      const mapped: OrgRow[] = orgData.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        owner_id: o.owner_id,
        industry: o.industry,
        country: o.country,
        currency: o.currency,
        created_at: o.created_at,
        plan_id: o.plan_id,
        sub_status: o.sub_status,
        user_count: o.user_count,
        ai_calls: aiMap[o.id] ?? 0,
      }));

      setOrgs(mapped);

      // MRR calculation (simplified)
      const mrrByPlan: Record<string, number> = { free: 0, pro: 29, enterprise: 79 };
      const mrr = mapped
        .filter((o) => ['active','trialing'].includes(o.sub_status))
        .reduce((sum, o) => sum + (mrrByPlan[o.plan_id] ?? 0), 0);

      const totalUsers = mapped.reduce((sum, o) => sum + o.user_count, 0);

      setStats({
        totalOrgs:    mapped.length,
        activeOrgs:   mapped.filter((o) => o.sub_status === 'active').length,
        totalUsers,
        totalAiCalls: Object.values(aiMap).reduce((a, b) => a + b, 0),
        mrr,
      });
    } catch (err) {
      console.error('Failed to load platform data:', err);
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (authorized) loadData(); }, [authorized]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Suspend / activate ────────────────

  const suspendOrg = async (orgId: string) => {
    await supabase.from('subscriptions').update({ status: 'suspended' }).eq('organization_id', orgId);
    setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, sub_status: 'suspended' } : o));
    toast.success('Organization suspended.');
  };

  const activateOrg = async (orgId: string) => {
    await supabase.from('subscriptions').update({ status: 'active' }).eq('organization_id', orgId);
    setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, sub_status: 'active' } : o));
    toast.success('Organization activated.');
  };

  if (authorized === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading admin panel…
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100">Super Admin</h1>
            <p className="text-xs text-slate-400">Platform control panel — restricted access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => navigate('/admin')}>
            <UserCog className="w-3.5 h-3.5" />
            User Management
          </Button>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => {
              AdminExportAPI.exportOrganizations(orgs.map(o => ({
                id: o.id, name: o.name, slug: o.slug, owner_id: o.owner_id,
                industry: o.industry, country: o.country, currency: o.currency,
                created_at: o.created_at, plan_id: o.plan_id, sub_status: o.sub_status,
                user_count: o.user_count,
              })));
              toast.success(`Exported ${orgs.length} organizations to CSV`);
            }}>
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2"
            disabled={refreshing}
            onClick={() => { setRefreshing(true); loadData(); }}>
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Building2} label="Total Organizations" value={stats.totalOrgs}
              color="bg-indigo-100" />
            <StatCard icon={CheckCircle2} label="Active Orgs" value={stats.activeOrgs}
              color="bg-green-100" />
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers}
              color="bg-blue-100" />
            <StatCard icon={Activity} label="AI Calls (month)" value={stats.totalAiCalls}
              color="bg-purple-100" />
            <StatCard icon={DollarSign} label="Estimated MRR" value={`$${stats.mrr.toLocaleString()}`}
              sub="excl. annual" color="bg-emerald-100" />
          </div>
        )}

        {/* Plan distribution */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {(['free','pro','enterprise'] as const).map((planId) => {
              const count = orgs.filter((o) => o.plan_id === planId).length;
              const pct   = orgs.length ? Math.round((count / orgs.length) * 100) : 0;
              return (
                <Card key={planId}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                        {PLANS[planId].name}
                      </span>
                      <Badge variant="secondary" className={cn('text-xs', PLAN_CLASS[planId])}>
                        {pct}%
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</div>
                    <div className="h-1.5 mt-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Main tabs */}
        <Tabs defaultValue="orgs">
          <TabsList>
            <TabsTrigger value="orgs" className="gap-2">
              <Building2 className="w-4 h-4" /> Organizations
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <BarChart2 className="w-4 h-4" /> AI Usage
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <TrendingUp className="w-4 h-4" /> System Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orgs" className="mt-4">
            <OrgTable orgs={orgs} onSuspend={suspendOrg} onActivate={activateOrg} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <AIUsageTab orgs={orgs} />
          </TabsContent>

          <TabsContent value="health" className="mt-4">
            <SystemHealthMonitor autoCheckInterval={120} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
