/**
 * Billing.tsx
 * ────────────
 * Subscription management page:
 *   - Current plan card with usage meters
 *   - Pricing plan grid (upgrade / downgrade)
 *   - Payment history table
 *   - Cancel / reactivate subscription
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  PLANS, PLAN_ORDER, type PlanId, isAtLimit, usagePercent,
} from '@/lib/plans';
import {
  cancelSubscription, reactivateSubscription,
  fetchBillingHistory, stripeBillingPortal, isInDemoMode,
  initiateCheckout, selectProvider, getProviderDisplayName,
  getProviderPaymentMethods, verifyPaymentFromRedirect,
  getDisplayPrice, providerRequiresPhone, isMoMoAvailable,
  type PaymentProvider, type CheckoutResult,
} from '@/services/billing';
import {
  processSubscription,
  activateSubscription,
  activateAfterPaymentVerified,
  clearActivationFlag,
} from '@/services/subscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Zap, Check, Shield, Sparkles, CreditCard, Calendar, TrendingUp,
  AlertTriangle, RefreshCw, ExternalLink, ArrowRight, ArrowUp, ArrowDown,
  Loader2, Globe, Smartphone, Building, CheckCircle2, Phone, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

// ─────────────────────────────────────────
// Plan card for pricing grid
// ─────────────────────────────────────────

const PLAN_ICONS = { free: Shield, pro: Zap, enterprise: Sparkles } as const;
const PLAN_ICON_COLORS = {
  free: 'text-slate-500 bg-slate-100',
  pro:  'text-indigo-600 bg-indigo-100',
  enterprise: 'text-purple-600 bg-purple-100',
};

function PlanCard({
  planId, currentPlanId, billingCycle,
  onSelect, loading, processingPlanId,
}: {
  planId: PlanId;
  currentPlanId: PlanId;
  billingCycle: 'monthly' | 'annual';
  onSelect: (p: PlanId) => void;
  loading: boolean;
  processingPlanId?: PlanId | null;
}) {
  const plan = PLANS[planId];
  const Icon = PLAN_ICONS[planId];
  const { selectedCurrency } = useCurrency();
  const displayPrice = getDisplayPrice(planId, billingCycle, selectedCurrency.code);
  const monthlyPrice = billingCycle === 'annual'
    ? getDisplayPrice(planId, billingCycle, selectedCurrency.code)
    : displayPrice;
  const annualTotal = getDisplayPrice(planId, 'annual', selectedCurrency.code);
  const isCurrent = planId === currentPlanId;
  const isProcessing = processingPlanId === planId;
  const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlanId);
  const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlanId);

  const features = [
    plan.maxInvoicesPerMonth === -1 ? 'Unlimited invoices' : `${plan.maxInvoicesPerMonth} invoices/month`,
    plan.maxAiChatsPerMonth   === -1 ? 'Unlimited AI chats' : `${plan.maxAiChatsPerMonth} AI chats/month`,
    plan.hasAiAssistant    && 'AI assistant',
    plan.hasAdvancedReports && 'Advanced reports',
    plan.hasPayroll         && 'Payroll processing',
    plan.hasTeamAccess      && 'Team access',
    planId !== 'free'       && `${plan.trialDays}-day free trial`,
    plan.maxUsers === -1    ? 'Unlimited users' : `Up to ${plan.maxUsers} user${plan.maxUsers > 1 ? 's' : ''}`,
  ].filter(Boolean) as string[];

  const getButtonText = () => {
    if (isCurrent) return 'Current plan';
    if (isProcessing) return isDowngrade ? 'Downgrading...' : 'Upgrading...';
    if (isDowngrade) return 'Downgrade';
    return 'Upgrade';
  };

  return (
    <Card className={cn(
      'relative border-2 transition-all',
      plan.highlighted && !isCurrent
        ? 'border-indigo-500 shadow-indigo-100 dark:shadow-indigo-950 shadow-lg'
        : 'border-slate-200 dark:border-slate-700',
      isCurrent && 'border-green-500',
      isProcessing && 'opacity-90',
    )}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-indigo-600 text-white text-xs">{plan.badge}</Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-600 text-white text-xs">Current plan</Badge>
        </div>
      )}

      <CardContent className="pt-6 pb-5">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', PLAN_ICON_COLORS[planId])}>
          <Icon className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
        <p className="text-sm text-slate-500 mt-1 mb-3">{plan.description}</p>

        <div className="mb-4">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {displayPrice.amount === 0 ? 'Free' : displayPrice.formatted}
          </span>
          {displayPrice.amount > 0 && <span className="text-slate-400 text-sm">/month</span>}
          {billingCycle === 'annual' && displayPrice.amount > 0 && (
            <p className="text-xs text-green-600 mt-0.5">billed annually ({annualTotal.formatted}/yr)</p>
          )}
        </div>

        <ul className="space-y-1.5 mb-5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            'w-full gap-2',
            isCurrent ? 'bg-green-600 hover:bg-green-700' : '',
            isDowngrade && !isCurrent ? 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20' : '',
            isProcessing && 'animate-pulse'
          )}
          variant={isCurrent ? 'default' : isDowngrade ? 'outline' : plan.highlighted ? 'default' : 'outline'}
          disabled={isCurrent || loading}
          onClick={() => !isCurrent && !loading && onSelect(planId)}
        >
          {isProcessing && <RefreshCw className="w-4 h-4 animate-spin" />}
          {!isProcessing && isDowngrade && <ArrowDown className="w-4 h-4" />}
          {!isProcessing && isUpgrade && <ArrowUp className="w-4 h-4" />}
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Usage meters
// ─────────────────────────────────────────

function UsageMeters() {
  const { plan, aiUsage, usageCounts } = useOrganization();

  const meters = [
    {
      label: 'Invoices',
      used:  usageCounts.invoices,
      limit: plan.maxInvoicesPerMonth,
      color: 'bg-indigo-500',
    },
    {
      label: 'AI Chats',
      used:  aiUsage.chats,
      limit: plan.maxAiChatsPerMonth,
      color: 'bg-purple-500',
    },
    {
      label: 'Bank Imports',
      used:  aiUsage.bankImports,
      limit: plan.maxBankImportsPerMonth,
      color: 'bg-amber-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meters.map((m) => {
          const unlimited = m.limit === -1;
          const pct = unlimited ? 0 : usagePercent(m.used, m.limit);
          const atLimit = !unlimited && isAtLimit(m.used, m.limit);

          return (
            <div key={m.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300">{m.label}</span>
                <span className={cn('font-medium', atLimit ? 'text-red-500' : 'text-slate-700 dark:text-slate-200')}>
                  {unlimited ? `${m.used} / ∞` : `${m.used} / ${m.limit}`}
                </span>
              </div>
              {!unlimited && (
                <Progress value={pct} className={cn('h-1.5', atLimit ? '[&>div]:bg-red-500' : `[&>div]:${m.color}`)} />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Main Billing page
// ─────────────────────────────────────────

export default function Billing() {
  const { org, subscription, plan, refresh } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [billingCycle,   setBillingCycle]   = useState<'monthly' | 'annual'>('monthly');
  const [loading,        setLoading]        = useState(false);
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null);
  const [cancelDialog,   setCancelDialog]   = useState(false);
  const [cancelReason,   setCancelReason]   = useState('');
  const [billingHistory, setBillingHistory] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    provider: string;
    created_at: string;
  }>>([]);

  // ── Upgrade confirmation dialog state ──
  const [upgradeDialog, setUpgradeDialog]           = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanId | null>(null);
  const [selectedProvider, setSelectedProvider]       = useState<PaymentProvider>('stripe');
  const [upgradeStep, setUpgradeStep]                 = useState<'confirm' | 'provider' | 'processing'>('confirm');
  const [momoPhoneNumber, setMomoPhoneNumber]         = useState('');

  useEffect(() => {
    if (org) {
      fetchBillingHistory(org.id).then((rows) => setBillingHistory(rows as typeof billingHistory));
    }
  }, [org]);

  // Check for upgrade success on URL param (from external payment providers)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider');
    
    // Handle successful upgrade from external provider
    if (params.get('upgraded') === '1' || params.get('reference') || params.get('tx_ref') || params.get('transaction_id') || params.get('OrderTrackingId') || params.get('orderTrackingId')) {
      console.log('[Billing] Payment return detected, provider:', provider);
      
      if (provider && provider !== 'demo' && org) {
        // ── REAL PROVIDER: Verify payment THEN activate subscription ──
        setLoading(true);
        const returnPlan = (params.get('plan') || 'pro') as PlanId;
        const returnCycle = (params.get('cycle') || 'monthly') as 'monthly' | 'annual';

        verifyPaymentFromRedirect(params, org.id).then(async (result) => {
          if (result.verified) {
            console.log('[Billing] Payment verified! Activating subscription...');

            // NOW activate the subscription — payment is confirmed
            const activationResult = await activateAfterPaymentVerified(
              org.id, returnPlan, returnCycle, provider,
            );

            if (activationResult.success) {
              try {
                const orgJson = localStorage.getItem('2k_onboarding_org');
                if (orgJson) {
                  const orgData = JSON.parse(orgJson);
                  orgData.plan = returnPlan;
                  localStorage.setItem('2k_onboarding_org', JSON.stringify(orgData));
                }
              } catch { /* non-critical */ }

              await refresh();
              navigate('/dashboard?payment=success', { replace: true });
            } else {
              toast.error(activationResult.error || 'Payment verified but activation failed. Contact support.');
              window.history.replaceState({}, '', '/billing');
            }
          } else {
            toast.error(result.error || 'Payment verification failed. Your card was not charged. Please try again.');
            window.history.replaceState({}, '', '/billing');
          }
          setLoading(false);
        }).catch((err) => {
          console.error('[Billing] Verification error:', err);
          toast.error('Could not verify payment. Please contact support if you were charged.');
          window.history.replaceState({}, '', '/billing');
          setLoading(false);
        });
        return;
      }
      
      // Demo provider — redirect to dashboard
      if (provider === 'demo' || !provider) {
        refresh();
        navigate('/dashboard?payment=success', { replace: true });
        return;
      }
    }
    
    // Handle cancelled payment
    if (params.get('payment') === 'cancelled') {
      console.log('[Billing] Payment was cancelled');
      toast.info('Payment was cancelled. You can try again when ready.');
      window.history.replaceState({}, '', '/billing');
    }
    
    // Handle failed payment
    if (params.get('payment') === 'failed') {
      toast.error('Payment failed. Please try again or use a different payment method.');
      window.history.replaceState({}, '', '/billing');
    }
  }, [refresh, navigate, org]);

  const handleSelectPlan = async (planId: PlanId) => {
    console.log('[Billing] Plan card clicked:', planId);
    if (!org || !user) {
      toast.error('Unable to process: missing organization or user data');
      return;
    }

    const currency = org.currency || 'USD';
    const currentPlanId = plan.id as PlanId;
    const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlanId);

    setSelectedUpgradePlan(planId);
    setSelectedProvider(selectProvider(currency));
    setMomoPhoneNumber('');

    // Downgrades go straight to confirmation (no payment needed)
    // Upgrades go to payment method selection FIRST
    if (isDowngrade) {
      setUpgradeStep('confirm');
    } else {
      setUpgradeStep('provider');
    }
    setUpgradeDialog(true);
  };

  /**
   * Persist subscription change to Supabase DB via Edge Function.
   * This is called internally by processSubscription/activateSubscription now,
   * but kept as a manual fallback for edge cases.
   */
  const persistSubscriptionToDb = async (orgId: string, planId: PlanId, cycle: 'monthly' | 'annual') => {
    try {
      const result = await activateSubscription(orgId, planId, cycle, undefined, 'manual-sync', true);
      if (!result.success) {
        console.warn('[Billing] DB subscription persistence failed:', result.error);
      }
    } catch (err) {
      console.warn('[Billing] DB subscription persistence error (non-critical):', err);
    }
  };

  /**
   * Execute a plan change — works for both upgrades and downgrades.
   *
   * CRITICAL FIX:
   *   - Downgrades: instant activation (no payment).
   *   - Demo provider: instant activation (testing only).
   *   - Real providers: redirect to payment gateway → activation ONLY after payment verified.
   *   - NO silent demo fallback when real providers fail.
   */
  const executeUpgrade = async () => {
    if (!selectedUpgradePlan || !org || !user) return;

    const planId = selectedUpgradePlan;
    const currentPlanId = plan.id as PlanId;
    const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlanId);
    const currency = org.currency || 'USD';
    const userId = user.id || `temp-user-${Date.now()}`;
    const actionLabel = isDowngrade ? 'Downgrading' : 'Upgrading';
    const successVerb = isDowngrade ? 'Downgraded' : 'Upgraded';

    console.log(`[Billing] ${actionLabel}:`, { planId, provider: selectedProvider, billingCycle });

    // Validate phone number for mobile money providers
    if (!isDowngrade && providerRequiresPhone(selectedProvider) && !momoPhoneNumber.trim()) {
      toast.error('Please enter your mobile money phone number.');
      return;
    }

    setUpgradeStep('processing');
    setLoading(true);
    setProcessingPlan(planId);

    try {
      // ── DOWNGRADE: No payment needed, activate immediately ──
      if (isDowngrade) {
        console.log('[Billing] Processing downgrade (no payment)');

        const result = await processSubscription(
          org.id, userId, planId, billingCycle,
          user.email ?? '', currency, selectedProvider,
          true, // isDowngrade
        );

        if (result.success) {
          try {
            const orgJson = localStorage.getItem('2k_onboarding_org');
            if (orgJson) {
              const orgData = JSON.parse(orgJson);
              orgData.plan = planId;
              localStorage.setItem('2k_onboarding_org', JSON.stringify(orgData));
            }
          } catch { /* non-critical */ }

          clearActivationFlag();
          setUpgradeDialog(false);
          toast.success(`${successVerb} to ${PLANS[planId].name}!`);
          await refresh();

          setTimeout(() => {
            window.location.href = '/dashboard?plan=' + planId;
          }, 1200);
          return;
        } else {
          toast.error(result.error || 'Failed to change plan. Please try again.');
        }
      }
      // ── DEMO PROVIDER: Instant activation for testing ──
      else if (selectedProvider === 'demo') {
        console.log('[Billing] Demo mode activation');

        const result = await processSubscription(
          org.id, userId, planId, billingCycle,
          user.email ?? '', currency, 'demo',
        );

        if (result.success) {
          try {
            const orgJson = localStorage.getItem('2k_onboarding_org');
            if (orgJson) {
              const orgData = JSON.parse(orgJson);
              orgData.plan = planId;
              localStorage.setItem('2k_onboarding_org', JSON.stringify(orgData));
            }
          } catch { /* non-critical */ }

          clearActivationFlag();
          setUpgradeDialog(false);
          await refresh();
          window.location.href = '/dashboard?payment=success&plan=' + planId;
          return;
        } else {
          toast.error(result.error || 'Failed to activate subscription.');
        }
      }
      // ── REAL PROVIDER: Redirect to payment gateway ──
      else {
        console.log('[Billing] Starting real payment checkout with:', selectedProvider);

        // Step 1: Create pending payment record (does NOT activate subscription)
        const paymentResult = await processSubscription(
          org.id, userId, planId, billingCycle,
          user.email ?? '', currency, selectedProvider,
        );

        if (!paymentResult.success) {
          toast.error(paymentResult.error || 'Failed to initiate payment.');
          return;
        }

        // Step 2: Redirect to external payment provider
        // Subscription activation will happen ONLY after payment is verified
        try {
          const checkoutResult: CheckoutResult = await initiateCheckout({
            organizationId: org.id,
            planId,
            billingCycle,
            email: user.email ?? '',
            currency,
            successUrl: `${window.location.origin}/billing?upgraded=1&provider=${selectedProvider}&plan=${planId}&cycle=${billingCycle}`,
            cancelUrl:  `${window.location.origin}/billing?payment=cancelled`,
            ...(providerRequiresPhone(selectedProvider)
              ? { phoneNumber: momoPhoneNumber, network: selectedProvider === 'airtel_money' ? 'AIRTEL' as const : 'MTN' as const }
              : {}),
          }, selectedProvider);

          console.log('[Billing] Checkout result:', checkoutResult);

          if (checkoutResult.checkoutUrl) {
            // Redirect user to payment page (Stripe, Flutterwave, Paystack, etc.)
            window.location.href = checkoutResult.checkoutUrl;
            return;
          } else {
            // Inline payment (e.g., mobile money push) — wait for confirmation
            toast.info('Payment request sent. Please check your phone to approve.');
            setUpgradeDialog(false);
            return;
          }
        } catch (providerErr: any) {
          // !! NO SILENT DEMO FALLBACK !!
          // If the provider fails, tell the user clearly.
          console.error('[Billing] Payment provider error:', providerErr);

          const errorMsg = providerErr?.message || String(providerErr);
          if (errorMsg.includes('not available') || errorMsg.includes('not configured') || errorMsg.includes('Demo mode')) {
            toast.error(
              'This payment method is not yet configured. Please select "Demo Mode" for testing, or contact support to set up real payments.',
              { duration: 8000 },
            );
          } else {
            toast.error(`Payment failed: ${errorMsg}. Please try a different payment method.`, { duration: 6000 });
          }

          // Go back to provider selection so user can pick another option
          setUpgradeStep('provider');
          return;
        }
      }
    } catch (err: any) {
      console.error(`[Billing] ${actionLabel} error:`, err);
      toast.error(err?.message || 'Could not process plan change. Please try again.');
    } finally {
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!org) return;
    try {
      const { url } = await stripeBillingPortal(org.id, `${window.location.origin}/billing`);
      if (url.includes('demo=portal')) {
        toast.info('Billing portal is available in production mode only.');
        return;
      }
      window.open(url, '_blank');
    } catch {
      toast.error('Could not open billing portal.');
    }
  };

  const handleCancel = async () => {
    if (!org) return;
    try {
      setLoading(true);
      const result = await cancelSubscription(org.id, { reason: cancelReason || undefined });
      toast.success(result.message || 'Subscription will cancel at end of billing period.');
      await refresh();
    } catch {
      toast.error('Could not cancel subscription.');
    } finally {
      setLoading(false);
    }
    setCancelDialog(false);
    setCancelReason('');
  };

  const handleReactivate = async () => {
    if (!org) return;
    try {
      await reactivateSubscription(org.id);
      toast.success('Subscription reactivated!');
      await refresh();
    } catch {
      toast.error('Could not reactivate subscription.');
    }
  };

  const subStatusBadge: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-slate-100 text-slate-600',
    paused:   'bg-amber-100 text-amber-700',
  };

  return (
    <PageLayout
      title="Billing & Subscription"
      subtitle="Manage your plan, usage, and payment details."
      showBackButton={false}
    >
      {/* Demo mode indicator */}
      {isInDemoMode() && (
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 mb-4 text-sm">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-amber-800 dark:text-amber-300">
            <strong>Demo Mode:</strong> Payment processing is simulated. Connect payment providers in production for real transactions.
          </span>
        </div>
      )}

      {/* Trial / past-due warning */}
      {subscription?.status === 'trialing' && subscription.trialEndsAt && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 mb-4 text-sm">
          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-blue-800 dark:text-blue-300">
            Your trial ends on{' '}
            <strong>{new Date(subscription.trialEndsAt).toLocaleDateString()}</strong>.
            Add a payment method to keep your features.
          </span>
          <Button size="sm" variant="outline" className="ml-auto border-blue-300 text-blue-700"
            onClick={() => handleSelectPlan(plan.id as PlanId)}>
            Add payment
          </Button>
        </div>
      )}

      {subscription?.status === 'past_due' && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-red-800">Your payment failed. Please update your payment method.</span>
          <Button size="sm" variant="destructive" className="ml-auto" onClick={handleManageBilling}>
            Fix payment
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current plan summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" /> Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</div>
                <div className="text-slate-500 text-sm">{plan.description}</div>
                {subscription && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      subStatusBadge[subscription.status] ?? 'bg-slate-100 text-slate-600')}>
                      {subscription.status}
                    </span>
                    {subscription.periodEnd && (
                      <span className="text-xs text-slate-400">
                        Renews {new Date(subscription.periodEnd).toLocaleDateString()}
                      </span>
                    )}
                    {subscription.cancelAtPeriodEnd && (
                      <span className="text-xs text-amber-600">Cancels at period end</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {subscription?.cancelAtPeriodEnd ? (
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleReactivate}>
                    <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                  </Button>
                ) : plan.id !== 'free' && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleManageBilling}>
                    <ExternalLink className="w-3.5 h-3.5" /> Manage billing
                  </Button>
                )}
                {plan.id !== 'free' && !subscription?.cancelAtPeriodEnd && (
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"
                    onClick={() => setCancelDialog(true)}>
                    Cancel plan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <UsageMeters />
      </div>

      {/* Plan selection grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Change Plan</h2>
          <div className="flex gap-2">
            {(['monthly','annual'] as const).map((c) => (
              <button key={c}
                className={cn('px-3 py-1 text-sm rounded-full border transition-all',
                  billingCycle === c
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600')}
                onClick={() => setBillingCycle(c)}>
                {c === 'annual' ? 'Annual (save 17%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLAN_ORDER.map((planId) => (
            <PlanCard
              key={planId}
              planId={planId}
              currentPlanId={plan.id as PlanId}
              billingCycle={billingCycle}
              onSelect={handleSelectPlan}
              loading={loading}
              processingPlanId={processingPlan}
            />
          ))}
        </div>
      </div>

      {/* Payment history */}
      {billingHistory.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Payment History</h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(evt.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {evt.type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{evt.provider}</TableCell>
                    <TableCell className="text-right font-medium">
                      {evt.amount > 0 ? `${evt.currency} ${evt.amount.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={evt.type.includes('succeeded')
                        ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {evt.type.includes('succeeded') ? 'Paid' : 'Failed'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Upgrade Confirmation Dialog ── */}
      <Dialog open={upgradeDialog} onOpenChange={(open) => {
        if (!loading) {
          setUpgradeDialog(open);
          if (!open) {
            setUpgradeStep('confirm');
            setSelectedUpgradePlan(null);
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          {selectedUpgradePlan && upgradeStep === 'confirm' && (() => {
            const newPlan = PLANS[selectedUpgradePlan];
            const currentPlanId = plan.id as PlanId;
            const isUpgrade = PLAN_ORDER.indexOf(selectedUpgradePlan) > PLAN_ORDER.indexOf(currentPlanId);
            const currency = org?.currency || 'USD';
            const priceInfo = getDisplayPrice(selectedUpgradePlan, billingCycle, currency);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isUpgrade ? <ArrowUp className="w-5 h-5 text-green-500" /> : <ArrowDown className="w-5 h-5 text-amber-500" />}
                    {isUpgrade ? 'Upgrade' : 'Downgrade'} to {newPlan.name}
                  </DialogTitle>
                  <DialogDescription>
                    {isUpgrade
                      ? 'Review your plan upgrade before proceeding'
                      : 'Review what changes when you downgrade'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Plan comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="text-xs text-slate-400 mb-1">Current Plan</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</div>
                      <div className="text-sm text-slate-500">${plan.priceMonthly}/mo</div>
                    </div>
                    <div className={cn('rounded-lg border-2 p-3', isUpgrade ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20')}>
                      <div className="text-xs text-slate-400 mb-1">New Plan</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{newPlan.name}</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {newPlan.priceMonthly === 0 ? 'Free' : `${priceInfo.formatted}/${billingCycle === 'annual' ? 'yr' : 'mo'}`}
                      </div>
                    </div>
                  </div>

                  {/* What you gain (upgrade) */}
                  {isUpgrade && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                      <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">What you'll get:</div>
                      <ul className="space-y-1">
                        {newPlan.maxInvoicesPerMonth !== plan.maxInvoicesPerMonth && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {newPlan.maxInvoicesPerMonth === -1 ? 'Unlimited invoices' : `${newPlan.maxInvoicesPerMonth} invoices/month`}
                          </li>
                        )}
                        {newPlan.maxAiChatsPerMonth !== plan.maxAiChatsPerMonth && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {newPlan.maxAiChatsPerMonth === -1 ? 'Unlimited AI chats' : `${newPlan.maxAiChatsPerMonth} AI chats/month`}
                          </li>
                        )}
                        {newPlan.hasAiAssistant && !plan.hasAiAssistant && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> AI Assistant
                          </li>
                        )}
                        {newPlan.hasAdvancedReports && !plan.hasAdvancedReports && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Advanced Reports
                          </li>
                        )}
                        {newPlan.hasPayroll && !plan.hasPayroll && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Payroll Processing
                          </li>
                        )}
                        {newPlan.hasTeamAccess && !plan.hasTeamAccess && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Team Access
                          </li>
                        )}
                        {newPlan.maxUsers !== plan.maxUsers && (
                          <li className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {newPlan.maxUsers === -1 ? 'Unlimited users' : `Up to ${newPlan.maxUsers} users`}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* What you'll lose (downgrade) */}
                  {!isUpgrade && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                      <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Features you'll lose:
                      </div>
                      <ul className="space-y-1">
                        {plan.hasAiAssistant && !newPlan.hasAiAssistant && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> AI Assistant
                          </li>
                        )}
                        {plan.hasAdvancedReports && !newPlan.hasAdvancedReports && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> Advanced Reports
                          </li>
                        )}
                        {plan.hasPayroll && !newPlan.hasPayroll && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> Payroll Processing
                          </li>
                        )}
                        {plan.hasTeamAccess && !newPlan.hasTeamAccess && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> Team Access
                          </li>
                        )}
                        {plan.maxInvoicesPerMonth !== newPlan.maxInvoicesPerMonth && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            Invoices limited to {newPlan.maxInvoicesPerMonth === -1 ? 'unlimited' : `${newPlan.maxInvoicesPerMonth}/month`}
                          </li>
                        )}
                        {plan.maxAiChatsPerMonth !== newPlan.maxAiChatsPerMonth && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            AI chats limited to {newPlan.maxAiChatsPerMonth === -1 ? 'unlimited' : `${newPlan.maxAiChatsPerMonth}/month`}
                          </li>
                        )}
                        {plan.maxUsers !== newPlan.maxUsers && (
                          <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            Users limited to {newPlan.maxUsers === -1 ? 'unlimited' : newPlan.maxUsers}
                          </li>
                        )}
                      </ul>

                      {selectedUpgradePlan !== 'free' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Your data will be preserved. You can upgrade again anytime.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment provider info — only for upgrades (downgrades don't need payment) */}
                  {isUpgrade && (
                    <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 p-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Selected Payment Method</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {getProviderDisplayName(selectedProvider)}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-indigo-600"
                          onClick={() => setUpgradeStep('provider')}>
                          Change method
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {getProviderPaymentMethods(selectedProvider).map(m => (
                          <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                      {providerRequiresPhone(selectedProvider) && momoPhoneNumber && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          Payment will be charged to: <span className="font-mono font-medium">{momoPhoneNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Downgrade notice — no payment */}
                  {!isUpgrade && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      No payment required — downgrade takes effect immediately
                    </div>
                  )}

                  {isUpgrade && billingCycle === 'annual' && (
                    <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Annual billing saves ~17% compared to monthly
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => {
                    if (isUpgrade) {
                      setUpgradeStep('provider');
                    } else {
                      setUpgradeDialog(false);
                    }
                  }}>
                    {isUpgrade ? 'Back' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={executeUpgrade}
                    className={cn('gap-2', !isUpgrade && 'bg-amber-600 hover:bg-amber-700')}
                  >
                    {isUpgrade ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {isUpgrade
                      ? `Pay & Upgrade — ${priceInfo.formatted}/${billingCycle === 'annual' ? 'yr' : 'mo'}`
                      : `Downgrade to ${newPlan.name}`}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}

          {/* Provider selection step */}
          {selectedUpgradePlan && upgradeStep === 'provider' && (() => {
            const currency = org?.currency || 'USD';
            const autoProvider = selectProvider(currency);
            const momoAvailable = isMoMoAvailable(currency);

            const providers: { id: PaymentProvider; label: string; icon: React.ElementType; desc: string; recommended?: boolean }[] = [
              { id: 'stripe', label: 'Stripe', icon: Globe, desc: 'International cards (Visa, Mastercard, Amex)', recommended: autoProvider === 'stripe' },
              { id: 'pesapal', label: 'Pesapal', icon: Smartphone, desc: 'MTN MoMo, Airtel Money, Cards, Bank Transfer (East Africa)', recommended: autoProvider === 'pesapal' },
              { id: 'flutterwave', label: 'Flutterwave', icon: Smartphone, desc: 'Cards, Mobile Money, Bank Transfer (West/South Africa)', recommended: autoProvider === 'flutterwave' },
              { id: 'paystack', label: 'Paystack', icon: Building, desc: 'Cards, USSD, Bank Transfer (Nigeria/Ghana)', recommended: autoProvider === 'paystack' },
            ];

            // Add direct MTN MoMo and Airtel Money when mobile money is available for the currency
            if (momoAvailable) {
              providers.push(
                { id: 'mtn_momo', label: 'MTN MoMo (Direct)', icon: Phone, desc: 'Pay via USSD push directly from your MTN MoMo wallet' },
                { id: 'airtel_money', label: 'Airtel Money', icon: Phone, desc: 'Pay directly from your Airtel Money wallet (via Pesapal)' },
              );
            }

            providers.push(
              { id: 'demo', label: 'Demo Mode', icon: Sparkles, desc: 'Instant activation for testing (no real payment)' },
            );

            const needsPhone = providerRequiresPhone(selectedProvider);
            const newPlan = PLANS[selectedUpgradePlan];
            const priceInfo = getDisplayPrice(selectedUpgradePlan, billingCycle, currency);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                    Choose Payment Method
                  </DialogTitle>
                  <DialogDescription>
                    Select how you'd like to pay for {newPlan.name} — {priceInfo.formatted}/{billingCycle === 'annual' ? 'yr' : 'mo'}
                  </DialogDescription>
                </DialogHeader>

                <RadioGroup value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as PaymentProvider)} className="space-y-2 py-2">
                  {providers.map((p) => (
                    <div key={p.id} className={cn(
                      'flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all',
                      selectedProvider === p.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300',
                    )}>
                      <RadioGroupItem value={p.id} id={`provider-${p.id}`} />
                      <Label htmlFor={`provider-${p.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <p.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium text-sm">{p.label}</span>
                          {p.recommended && (
                            <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Phone number input for MTN MoMo / Airtel Money / Pesapal (optional for Pesapal) */}
                {(needsPhone || selectedProvider === 'pesapal') && (
                  <div className="space-y-2 py-2 px-1">
                    <Label htmlFor="momo-phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-yellow-600" />
                      {selectedProvider === 'mtn_momo' ? 'MTN' : selectedProvider === 'pesapal' ? 'Mobile Money' : 'Airtel'} Phone Number
                      {selectedProvider === 'pesapal' && <span className="text-xs text-slate-400">(optional)</span>}
                    </Label>
                    <Input
                      id="momo-phone"
                      type="tel"
                      placeholder="e.g. 256770123456 or 0770123456"
                      value={momoPhoneNumber}
                      onChange={(e) => setMomoPhoneNumber(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-slate-500">
                      {selectedProvider === 'pesapal'
                        ? 'Optional: Pre-fill your mobile money number on the Pesapal payment page.'
                        : `Enter the phone number registered with your ${selectedProvider === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money'} account. A payment prompt will be sent to this number.`}
                    </p>
                  </div>
                )}

                {selectedProvider === 'demo' && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Demo mode activates instantly without real payment. For testing only.
                  </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setUpgradeDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setUpgradeStep('confirm')}
                    disabled={needsPhone && !momoPhoneNumber.trim()}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Continue to Review
                  </Button>
                </DialogFooter>
              </>
            );
          })()}

          {/* Processing step */}
          {upgradeStep === 'processing' && (() => {
            const isDowngrading = selectedUpgradePlan
              ? PLAN_ORDER.indexOf(selectedUpgradePlan) < PLAN_ORDER.indexOf(plan.id as PlanId)
              : false;

            return (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className={cn('w-10 h-10 animate-spin', isDowngrading ? 'text-amber-500' : 'text-indigo-500')} />
                <div className="text-center">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {isDowngrading ? 'Processing your downgrade…' : 'Processing your upgrade…'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {isDowngrading
                      ? 'Switching your plan…'
                      : selectedProvider === 'demo'
                      ? 'Activating your subscription…'
                      : selectedProvider === 'mtn_momo'
                      ? 'Sending payment prompt to your MTN MoMo…'
                      : selectedProvider === 'airtel_money'
                      ? 'Sending payment prompt to your Airtel Money…'
                      : `Connecting to ${getProviderDisplayName(selectedProvider)}…`}
                  </p>
                  {!isDowngrading && providerRequiresPhone(selectedProvider) && momoPhoneNumber && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <Phone className="w-3 h-3" />
                      Approve the prompt on {momoPhoneNumber}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialog} onOpenChange={(open) => {
        setCancelDialog(open);
        if (!open) setCancelReason('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will remain active until the end of the current billing period, then downgrade to Free.
              You won't lose any data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Reason for canceling (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
              rows={3}
              placeholder="Help us improve — tell us why you're leaving"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? 'Canceling...' : 'Cancel subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
