/**
 * AdminBillingPanel.tsx
 * ──────────────────────
 * Admin panel for billing management.
 * Displays:
 *   - Revenue overview (MRR, total revenue, active subs)
 *   - All subscribers table with status filters
 *   - Per-subscriber details: plan, status, Stripe ID, trial info
 *   - Manual override controls (activate, cancel, extend trial, change plan)
 *   - Billing events log
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DollarSign, Users, TrendingUp, CreditCard, AlertTriangle,
  CheckCircle2, Clock, XCircle, Search, RefreshCw,
  Shield, Zap, Sparkles, Eye, Edit2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SubscriberRow {
  id: string;
  organization_id: string;
  org_name: string;
  org_slug: string;
  owner_email: string;
  plan_id: PlanId;
  status: string;
  billing_cycle: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_provider: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  created_at: string;
  updated_at: string;
}

interface RevenueStats {
  totalOrgs: number;
  activeSubs: number;
  trialingSubs: number;
  pastDueSubs: number;
  canceledSubs: number;
  proPlans: number;
  enterprisePlans: number;
  freePlans: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

// ─────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active:   { label: 'Active', variant: 'default' },
    trialing: { label: 'Trial', variant: 'secondary' },
    past_due: { label: 'Past Due', variant: 'destructive' },
    canceled: { label: 'Canceled', variant: 'outline' },
    paused:   { label: 'Paused', variant: 'outline' },
  };
  const { label, variant } = config[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={variant}>{label}</Badge>;
}

// ─────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────

export default function AdminBillingPanel() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Override dialog
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriberRow | null>(null);
  const [overrideAction, setOverrideAction] = useState<string>('');
  const [overridePlan, setOverridePlan] = useState<PlanId>('pro');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // ── Load data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all subscriptions with org + owner info
      const { data: subs, error: subsErr } = await supabase
        .from('subscriptions')
        .select(`
          *,
          organizations!inner (
            name, slug, owner_id,
            profiles:owner_id (email)
          )
        `)
        .order('created_at', { ascending: false });

      if (subsErr) {
        console.warn('[AdminBilling] Subs query error:', subsErr);
      }

      // Map to flat rows
      const rows: SubscriberRow[] = (subs || []).map((s: any) => ({
        id: s.id,
        organization_id: s.organization_id,
        org_name: s.organizations?.name || 'Unknown',
        org_slug: s.organizations?.slug || '',
        owner_email: s.organizations?.profiles?.email || '—',
        plan_id: s.plan_id as PlanId,
        status: s.status,
        billing_cycle: s.billing_cycle,
        stripe_customer_id: s.stripe_customer_id,
        stripe_subscription_id: s.stripe_subscription_id,
        payment_provider: s.payment_provider,
        trial_ends_at: s.trial_ends_at,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        payment_method_last4: s.payment_method_last4,
        payment_method_brand: s.payment_method_brand,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

      setSubscribers(rows);

      // Calculate revenue stats
      const active = rows.filter(r => r.status === 'active').length;
      const trialing = rows.filter(r => r.status === 'trialing').length;
      const pastDue = rows.filter(r => r.status === 'past_due').length;
      const canceled = rows.filter(r => r.status === 'canceled').length;
      const pro = rows.filter(r => r.plan_id === 'pro' && ['active', 'trialing'].includes(r.status)).length;
      const ent = rows.filter(r => r.plan_id === 'enterprise' && ['active', 'trialing'].includes(r.status)).length;
      const free = rows.filter(r => r.plan_id === 'free').length;

      // Calculate MRR
      let mrr = 0;
      rows.forEach(r => {
        if (r.status !== 'active') return;
        const plan = PLANS[r.plan_id];
        if (!plan) return;
        if (r.billing_cycle === 'annual') {
          mrr += plan.priceAnnual / 12;
        } else {
          mrr += plan.priceMonthly;
        }
      });

      // Get total revenue from billing events
      const { data: revenueData } = await supabase
        .from('billing_events')
        .select('amount')
        .eq('type', 'payment_succeeded');

      const totalRevenue = (revenueData || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      setStats({
        totalOrgs: rows.length,
        activeSubs: active,
        trialingSubs: trialing,
        pastDueSubs: pastDue,
        canceledSubs: canceled,
        proPlans: pro,
        enterprisePlans: ent,
        freePlans: free,
        monthlyRevenue: Math.round(mrr * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      });
    } catch (err) {
      console.error('[AdminBilling] Load error:', err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filter subscribers ─────────────────────────────────
  const filtered = subscribers.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.org_name.toLowerCase().includes(q) ||
        s.owner_email.toLowerCase().includes(q) ||
        s.stripe_customer_id?.toLowerCase()?.includes(q) ||
        s.plan_id.includes(q)
      );
    }
    return true;
  });

  // ── Handle override ────────────────────────────────────
  const handleOverride = async () => {
    if (!selectedSub || !overrideAction) return;
    setOverrideLoading(true);

    try {
      const now = new Date();
      const updates: Record<string, any> = { updated_at: now.toISOString() };

      switch (overrideAction) {
        case 'activate': {
          updates.status = 'active';
          updates.plan_id = overridePlan;
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          updates.current_period_start = now.toISOString();
          updates.current_period_end = periodEnd.toISOString();
          break;
        }

        case 'cancel':
          updates.status = 'canceled';
          updates.plan_id = 'free';
          updates.cancel_at_period_end = false;
          break;

        case 'extend_trial': {
          const newTrialEnd = new Date(now);
          newTrialEnd.setDate(newTrialEnd.getDate() + 7);
          updates.status = 'trialing';
          updates.trial_ends_at = newTrialEnd.toISOString();
          break;
        }

        case 'change_plan':
          updates.plan_id = overridePlan;
          break;

        case 'reset_usage':
          updates.usage_counters = {
            invoices: 0, ai_queries: 0, team_members: 0,
            storage_mb: 0, reports: 0, bank_imports: 0,
          };
          updates.last_usage_reset = now.toISOString();
          break;

        default:
          throw new Error('Invalid action');
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('organization_id', selectedSub.organization_id);

      if (error) throw error;

      // Log the override (table may not exist until migration runs)
      await (supabase.from as any)('admin_billing_overrides').insert({
        organization_id: selectedSub.organization_id,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: overrideAction,
        previous_state: {
          plan_id: selectedSub.plan_id,
          status: selectedSub.status,
        },
        new_state: updates,
        reason: overrideReason,
      });

      // Log billing event
      await supabase.from('billing_events').insert({
        organization_id: selectedSub.organization_id,
        type: `admin_${overrideAction}`,
        amount: 0,
        currency: 'USD',
        provider: 'admin',
        metadata: { reason: overrideReason, previous_plan: selectedSub.plan_id },
      });

      toast.success(`Override applied: ${overrideAction} for ${selectedSub.org_name}`);
      setOverrideDialog(false);
      await loadData();
    } catch (err) {
      console.error('[AdminBilling] Override error:', err);
      toast.error('Failed to apply override');
    } finally {
      setOverrideLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Revenue Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Monthly Revenue"
            value={`$${stats?.monthlyRevenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            color="bg-green-500"
            subtext="MRR"
          />
          <StatCard
            label="Total Revenue"
            value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
            icon={TrendingUp}
            color="bg-indigo-500"
            subtext="All time"
          />
          <StatCard
            label="Active Subscribers"
            value={stats?.activeSubs || 0}
            icon={CheckCircle2}
            color="bg-emerald-500"
            subtext={`${stats?.trialingSubs || 0} trialing`}
          />
          <StatCard
            label="Past Due"
            value={stats?.pastDueSubs || 0}
            icon={AlertTriangle}
            color="bg-red-500"
            subtext={`${stats?.canceledSubs || 0} canceled`}
          />
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Shield className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.freePlans || 0}</p>
            <p className="text-sm text-slate-500">Free</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Zap className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.proPlans || 0}</p>
            <p className="text-sm text-slate-500">Pro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.enterprisePlans || 0}</p>
            <p className="text-sm text-slate-500">Enterprise</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subscribers</CardTitle>
              <CardDescription>{filtered.length} of {subscribers.length} subscribers</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by org name, email, or Stripe ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Stripe Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No subscribers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.org_name}</TableCell>
                      <TableCell className="text-sm text-slate-500">{sub.owner_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{sub.plan_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell className="text-sm capitalize">{sub.billing_cycle}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {sub.stripe_customer_id
                          ? sub.stripe_customer_id.slice(0, 18) + '...'
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sub.payment_method_last4
                          ? `${sub.payment_method_brand || 'Card'} ···${sub.payment_method_last4}`
                          : sub.payment_provider || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSub(sub);
                            setOverridePlan(sub.plan_id);
                            setOverrideReason('');
                            setOverrideAction('');
                            setOverrideDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={overrideDialog} onOpenChange={setOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Override Subscription</DialogTitle>
            <DialogDescription>
              {selectedSub?.org_name} — Currently {selectedSub?.plan_id} ({selectedSub?.status})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stripe Info */}
            {selectedSub?.stripe_customer_id && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono">
                <p><span className="text-slate-500">Customer:</span> {selectedSub.stripe_customer_id}</p>
                {selectedSub.stripe_subscription_id && (
                  <p><span className="text-slate-500">Subscription:</span> {selectedSub.stripe_subscription_id}</p>
                )}
              </div>
            )}

            {/* Action */}
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={overrideAction} onValueChange={setOverrideAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate Subscription</SelectItem>
                  <SelectItem value="cancel">Cancel Subscription</SelectItem>
                  <SelectItem value="extend_trial">Extend Trial (+7 days)</SelectItem>
                  <SelectItem value="change_plan">Change Plan</SelectItem>
                  <SelectItem value="reset_usage">Reset Usage Counters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan (for activate / change_plan) */}
            {(overrideAction === 'activate' || overrideAction === 'change_plan') && (
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={overridePlan} onValueChange={(v) => setOverridePlan(v as PlanId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro ($29/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($79/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Input
                placeholder="Why are you making this override?"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!overrideAction || !overrideReason || overrideLoading}
            >
              {overrideLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
