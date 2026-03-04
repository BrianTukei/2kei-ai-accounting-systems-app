/**
 * useBilling.ts
 * ──────────────
 * Production-grade billing management hook.
 * Provides:
 *   - Current subscription status with trial info
 *   - Usage meters with real-time tracking
 *   - Plan upgrade / downgrade via Stripe Checkout
 *   - Subscription cancellation & reactivation
 *   - Payment method display (last 4 digits + brand)
 *   - Billing history
 *   - Trial countdown timer
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  PLANS, PLAN_ORDER, type PlanId, type BillingCycle,
  trialDaysRemaining, isTrialActive, formatStorageLimit,
} from '@/lib/plans';
import {
  getUsageReport, getUsageCounters,
  type UsageCounters,
} from '@/services/usageTracking';
import {
  initiateCheckout, cancelSubscription, reactivateSubscription,
  fetchBillingHistory, stripeBillingPortal, isInDemoMode,
  selectProvider, type PaymentProvider,
} from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface BillingInfo {
  // Subscription
  planId: PlanId;
  planName: string;
  status: string;
  billingCycle: BillingCycle;
  isActive: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isTrialing: boolean;

  // Trial
  trialDaysLeft: number;
  trialEndDate: string | null;
  trialStartDate: string | null;

  // Renewal
  renewalDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;

  // Payment method
  paymentMethodLast4: string | null;
  paymentMethodBrand: string | null;

  // Stripe IDs
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Pricing
  currentPrice: number;
  currency: string;
}

export interface UsageMeter {
  name: string;
  eventType: string;
  current: number;
  limit: number;
  percentUsed: number;
  unit: string;
  isAtLimit: boolean;
}

export interface BillingHistoryItem {
  id: string;
  type: string;
  amount: number;
  currency: string;
  provider: string;
  created_at: string;
  metadata?: any;
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useBilling() {
  const { org, subscription, plan, refresh } = useOrganization();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [usageMeters, setUsageMeters] = useState<UsageMeter[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<{ last4: string | null; brand: string | null }>({
    last4: null,
    brand: null,
  });
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // ── Derived billing info ───────────────────────────────
  const billingInfo: BillingInfo = useMemo(() => {
    const status = subscription?.status || 'active';
    const billingCycle = (subscription?.billingCycle || 'monthly') as BillingCycle;
    const planId = (subscription?.planId || 'free') as PlanId;
    const planDef = PLANS[planId] || PLANS.free;

    return {
      planId,
      planName: planDef.name,
      status,
      billingCycle,
      isActive: status === 'active' || status === 'trialing',
      isPastDue: status === 'past_due',
      isCanceled: status === 'canceled',
      isTrialing: status === 'trialing',

      trialDaysLeft: trialDaysRemaining(subscription?.trialEndsAt),
      trialEndDate: subscription?.trialEndsAt || null,
      trialStartDate: null,

      renewalDate: subscription?.periodEnd || null,
      periodStart: null,
      periodEnd: subscription?.periodEnd || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,

      paymentMethodLast4: paymentMethod.last4,
      paymentMethodBrand: paymentMethod.brand,

      stripeCustomerId: null,
      stripeSubscriptionId: null,

      currentPrice: billingCycle === 'annual' ? planDef.priceAnnual : planDef.priceMonthly,
      currency: planDef.currency,
    };
  }, [subscription, paymentMethod]);

  // ── Load billing data ──────────────────────────────────
  const loadBillingData = useCallback(async () => {
    if (!org) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load usage meters
      const planId = (subscription?.planId || 'free') as PlanId;
      const report = await getUsageReport(org.id, planId);
      setUsageMeters(report.map(r => ({
        ...r,
        isAtLimit: r.limit !== -1 && r.current >= r.limit,
      })));

      // Load billing history
      try {
        const history = await fetchBillingHistory(org.id);
        setBillingHistory(history || []);
      } catch {
        setBillingHistory([]);
      }

      // Load payment method from subscription
      // Note: payment_method_last4/brand columns added by billing migration
      // Cast to any for pre-migration compatibility
      const { data: subData } = await (supabase as any)
        .from('subscriptions')
        .select('payment_method_last4, payment_method_brand, stripe_customer_id, stripe_subscription_id')
        .eq('organization_id', org.id)
        .single();

      if (subData) {
        setPaymentMethod({
          last4: subData.payment_method_last4 ?? null,
          brand: subData.payment_method_brand ?? null,
        });
      }
    } catch (err) {
      console.error('[useBilling] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [org, subscription]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // ── Upgrade / change plan ──────────────────────────────
  const upgradePlan = useCallback(async (
    targetPlanId: PlanId,
    billingCycle: BillingCycle,
    currency: string = 'USD',
    provider?: PaymentProvider,
  ) => {
    if (!org || !user) throw new Error('Not authenticated');
    if (targetPlanId === 'free') {
      // Downgrade to free is handled locally
      return;
    }

    setUpgrading(true);
    try {
      const selectedProvider = provider || selectProvider(currency);
      const result = await initiateCheckout({
        organizationId: org.id,
        planId: targetPlanId,
        billingCycle,
        email: user.email || '',
        currency,
        successUrl: `${window.location.origin}/billing`,
        cancelUrl: `${window.location.origin}/billing`,
      }, selectedProvider);

      return result;
    } finally {
      setUpgrading(false);
    }
  }, [org, user]);

  // ── Cancel subscription ────────────────────────────────
  const cancel = useCallback(async (reason?: string) => {
    if (!org) throw new Error('No organization');
    setCanceling(true);
    try {
      await cancelSubscription(org.id, { reason });
      await refresh();
    } finally {
      setCanceling(false);
    }
  }, [org, refresh]);

  // ── Reactivate subscription ────────────────────────────
  const reactivate = useCallback(async () => {
    if (!org) throw new Error('No organization');
    setCanceling(true);
    try {
      await reactivateSubscription(org.id);
      await refresh();
    } finally {
      setCanceling(false);
    }
  }, [org, refresh]);

  // ── Open Stripe billing portal ─────────────────────────
  const openBillingPortal = useCallback(async () => {
    if (!org) throw new Error('No organization');
    const result = await stripeBillingPortal(org.id, window.location.href);
    if (result?.url) window.open(result.url, '_blank');
  }, [org]);

  // ── Refresh usage data ─────────────────────────────────
  const refreshUsage = useCallback(async () => {
    await loadBillingData();
  }, [loadBillingData]);

  return {
    // State
    loading,
    billingInfo,
    usageMeters,
    billingHistory,
    upgrading,
    canceling,

    // Actions
    upgradePlan,
    cancel,
    reactivate,
    openBillingPortal,
    refreshUsage,
    refresh,
  };
}
