/**
 * subscription.ts
 * ────────────────
 * Comprehensive subscription management service.
 * Handles:
 *   - Creating/updating subscriptions in database
 *   - Payment transaction tracking
 *   - Subscription status verification
 *   - Demo mode subscription handling with persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { PLANS, type PlanId, type BillingCycle, type SubStatus } from '@/lib/plans';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface SubscriptionData {
  id: string;
  organizationId: string;
  planId: PlanId;
  status: SubStatus;
  billingCycle: BillingCycle;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  activatedAt?: string;
  paymentProvider?: string;
}

export interface PaymentTransaction {
  id: string;
  organizationId: string;
  userId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionRef?: string;
  webhookVerified: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

// ─────────────────────────────────────────
// Local storage keys
// ─────────────────────────────────────────

const DEMO_SUBSCRIPTION_KEY = '2kai-demo-subscription';
const DEMO_PAYMENT_KEY = '2kai-demo-payments';
const SUBSCRIPTION_ACTIVATED_KEY = '2kai-subscription-activated';

// ─────────────────────────────────────────
// Demo mode check
// ─────────────────────────────────────────

export function isInDemoMode(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes('placeholder');
}

// ─────────────────────────────────────────
// Demo subscription management
// ─────────────────────────────────────────

interface DemoSubscriptionStorage {
  planId: PlanId;
  status: SubStatus;
  billingCycle: BillingCycle;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  activatedAt: string;
  paymentProvider: string;
}

function getDemoSubscription(): DemoSubscriptionStorage | null {
  try {
    const data = localStorage.getItem(DEMO_SUBSCRIPTION_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    console.log('[Subscription] Retrieved demo subscription:', parsed);
    return parsed;
  } catch {
    return null;
  }
}

function setDemoSubscription(sub: DemoSubscriptionStorage): void {
  console.log('[Subscription] Saving demo subscription:', sub);
  localStorage.setItem(DEMO_SUBSCRIPTION_KEY, JSON.stringify(sub));
  // Also set the activated flag
  localStorage.setItem(SUBSCRIPTION_ACTIVATED_KEY, 'true');
}

function addDemoPayment(payment: {
  planId: PlanId;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
}): string {
  const paymentId = crypto.randomUUID();
  try {
    const payments = JSON.parse(localStorage.getItem(DEMO_PAYMENT_KEY) || '[]');
    payments.unshift({
      id: paymentId,
      ...payment,
      paymentStatus: 'completed',
      paymentProvider: 'demo',
      webhookVerified: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem(DEMO_PAYMENT_KEY, JSON.stringify(payments.slice(0, 50)));
    console.log('[Subscription] Added demo payment:', paymentId);
  } catch (e) {
    console.error('[Subscription] Failed to save demo payment:', e);
  }
  return paymentId;
}

// ─────────────────────────────────────────
// Core subscription operations
// ─────────────────────────────────────────

/**
 * Create a payment transaction record before processing
 */
export async function createPaymentTransaction(
  organizationId: string,
  userId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  currency: string,
  paymentProvider: string
): Promise<{ paymentId: string | null; transactionRef: string }> {
  const plan = PLANS[planId];
  const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const transactionRef = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log('[Subscription] Creating payment transaction:', {
    organizationId, planId, billingCycle, amount, paymentProvider
  });

  // For demo provider OR demo mode, use localStorage
  if (paymentProvider === 'demo' || isInDemoMode()) {
    console.log('[Subscription] Using demo payment storage');
    const paymentId = addDemoPayment({ planId, billingCycle, amount, currency });
    return { paymentId, transactionRef };
  }

  try {
    // Note: payment_transactions table type may not be in generated types yet
    // Using type assertion until types are regenerated after migration
    const { data, error } = await (supabase as any)
      .from('payment_transactions')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount,
        currency,
        payment_provider: paymentProvider,
        payment_status: 'pending',
        transaction_ref: transactionRef,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Subscription] Failed to create payment transaction:', error);
      return { paymentId: null, transactionRef };
    }

    return { paymentId: data.id, transactionRef };
  } catch (e) {
    console.error('[Subscription] Exception creating payment:', e);
    return { paymentId: null, transactionRef };
  }
}

/**
 * Update payment transaction status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  console.log('[Subscription] Updating payment status:', { paymentId, status });

  // Always use localStorage for demo-style payments (ID starts with non-UUID format)
  // or when in demo mode
  const isDemoPayment = !paymentId.includes('-') || paymentId.length < 30 || isInDemoMode();
  
  if (isDemoPayment) {
    console.log('[Subscription] Using demo payment status update');
    // Demo mode - update in localStorage
    try {
      const payments = JSON.parse(localStorage.getItem(DEMO_PAYMENT_KEY) || '[]');
      const idx = payments.findIndex((p: { id: string }) => p.id === paymentId);
      if (idx >= 0) {
        payments[idx].paymentStatus = status;
        if (status === 'completed') {
          payments[idx].completedAt = new Date().toISOString();
          payments[idx].webhookVerified = true;
        }
        if (errorMessage) payments[idx].errorMessage = errorMessage;
        localStorage.setItem(DEMO_PAYMENT_KEY, JSON.stringify(payments));
      }
    } catch { /* ignore */ }
    return;
  }

  try {
    // Note: payment_transactions table type may not be in generated types yet
    await (supabase as any)
      .from('payment_transactions')
      .update({
        payment_status: status,
        error_message: errorMessage || null,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        webhook_verified: status === 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
  } catch (e) {
    console.error('[Subscription] Failed to update payment status:', e);
  }
}

/**
 * Activate subscription after successful payment.
 * Uses the activate-subscription Edge Function to bypass RLS.
 * Falls back to localStorage in demo mode only.
 */
export async function activateSubscription(
  organizationId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  paymentId?: string,
  paymentProvider: string = 'demo',
  isDowngrade: boolean = false,
): Promise<SubscriptionResult> {
  console.log('[Subscription] Activating subscription:', {
    organizationId, planId, billingCycle, paymentProvider, isDowngrade,
  });

  const periodStart = new Date().toISOString();
  const periodEnd = new Date();
  if (billingCycle === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // For demo mode ONLY, save to localStorage
  if (isInDemoMode()) {
    const demoSub: DemoSubscriptionStorage = {
      planId,
      status: 'active',
      billingCycle,
      periodStart,
      periodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      activatedAt: new Date().toISOString(),
      paymentProvider,
    };
    setDemoSubscription(demoSub);
    console.log('[Subscription] Demo subscription activated (localStorage)');
    return { success: true, subscriptionId: 'demo' };
  }

  // ── Production: use Edge Function (bypasses RLS) ──
  try {
    const { data, error } = await supabase.functions.invoke('activate-subscription', {
      body: {
        organizationId,
        planId,
        billingCycle,
        paymentProvider,
        paymentId: paymentId || undefined,
        isDowngrade,
      },
    });

    if (error) {
      console.error('[Subscription] Edge function error:', error);
      // Fallback: try direct upsert (may work if RLS policy allows)
      return await activateSubscriptionDirect(
        organizationId, planId, billingCycle, paymentId, paymentProvider, periodStart, periodEnd.toISOString(),
      );
    }

    if (data?.error) {
      console.error('[Subscription] Activation rejected:', data.error);
      return { success: false, error: data.error };
    }

    console.log('[Subscription] Subscription activated via Edge Function:', data.subscriptionId);

    // Also save to localStorage as cache for faster UI updates
    const demoSub: DemoSubscriptionStorage = {
      planId,
      status: 'active',
      billingCycle,
      periodStart,
      periodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      activatedAt: new Date().toISOString(),
      paymentProvider,
    };
    setDemoSubscription(demoSub);

    return { success: true, subscriptionId: data.subscriptionId };
  } catch (e) {
    console.error('[Subscription] Edge function call failed, trying direct upsert:', e);
    return await activateSubscriptionDirect(
      organizationId, planId, billingCycle, paymentId, paymentProvider, periodStart, periodEnd.toISOString(),
    );
  }
}

/**
 * Direct DB upsert fallback when Edge Function is unavailable.
 */
async function activateSubscriptionDirect(
  organizationId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  paymentId: string | undefined,
  paymentProvider: string,
  periodStart: string,
  periodEnd: string,
): Promise<SubscriptionResult> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        payment_provider: paymentProvider,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
      .select('id')
      .single();

    if (error) {
      console.error('[Subscription] Direct upsert failed (possibly RLS):', error);
      // Last resort: save to localStorage so UI at least updates
      const demoSub: DemoSubscriptionStorage = {
        planId,
        status: 'active',
        billingCycle,
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: false,
        activatedAt: new Date().toISOString(),
        paymentProvider,
      };
      setDemoSubscription(demoSub);
      return { success: true, subscriptionId: 'local-fallback', error: 'DB write failed, saved locally' };
    }

    console.log('[Subscription] Direct upsert succeeded:', data.id);
    return { success: true, subscriptionId: data.id };
  } catch (e) {
    console.error('[Subscription] Direct upsert exception:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * Process complete subscription flow.
 *
 * For demo/downgrade: instant activation.
 * For real providers: creates pending payment, does NOT activate.
 *   Activation happens ONLY after payment verification (webhook or redirect).
 */
export async function processSubscription(
  organizationId: string,
  userId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  email: string,
  currency: string,
  paymentProvider: string,
  isDowngrade: boolean = false,
): Promise<SubscriptionResult> {
  console.log('[Subscription] Processing subscription:', {
    organizationId, userId, planId, billingCycle, paymentProvider, isDowngrade,
  });

  // ── Downgrade: No payment needed, activate immediately ──
  if (isDowngrade) {
    console.log('[Subscription] Processing as downgrade (no payment)');
    const result = await activateSubscription(
      organizationId, planId, billingCycle, undefined, paymentProvider, true,
    );
    return result;
  }

  // Step 1: Create payment transaction record
  const { paymentId, transactionRef } = await createPaymentTransaction(
    organizationId, userId, planId, billingCycle, currency, paymentProvider,
  );
  console.log('[Subscription] Payment transaction created:', { paymentId, transactionRef });

  // ── Demo mode: simulate instant payment + activation ──
  if (isInDemoMode() || paymentProvider === 'demo') {
    if (paymentId) {
      await updatePaymentStatus(paymentId, 'completed');
    }
    console.log('[Subscription] Demo payment completed');

    const result = await activateSubscription(
      organizationId, planId, billingCycle, paymentId || undefined, 'demo',
    );
    console.log('[Subscription] Demo subscription activation result:', result);
    return result;
  }

  // ── Real provider: mark as processing, do NOT activate yet ──
  // Activation happens via webhook callback or verifyPaymentFromRedirect()
  if (paymentId) {
    await updatePaymentStatus(paymentId, 'processing');
  }

  return {
    success: true,
    paymentId: paymentId || undefined,
  };
}

/**
 * Activate subscription after a real payment has been verified.
 * Called from Billing.tsx after verifyPaymentFromRedirect() succeeds.
 */
export async function activateAfterPaymentVerified(
  organizationId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  paymentProvider: string,
  paymentId?: string,
): Promise<SubscriptionResult> {
  console.log('[Subscription] Activating after verified payment:', {
    organizationId, planId, billingCycle, paymentProvider,
  });

  const result = await activateSubscription(
    organizationId, planId, billingCycle, paymentId, paymentProvider, false,
  );

  if (result.success) {
    console.log('[Subscription] Post-payment activation succeeded');
  } else {
    console.error('[Subscription] Post-payment activation failed:', result.error);
  }

  return result;
}

/**
 * Get current subscription status for organization
 */
export async function getSubscriptionStatus(
  organizationId: string
): Promise<SubscriptionData | null> {
  console.log('[Subscription] Getting subscription status for org:', organizationId);

  if (isInDemoMode()) {
    const demoSub = getDemoSubscription();
    if (demoSub) {
      return {
        id: 'demo',
        organizationId,
        planId: demoSub.planId,
        status: demoSub.status,
        billingCycle: demoSub.billingCycle,
        periodStart: demoSub.periodStart,
        periodEnd: demoSub.periodEnd,
        cancelAtPeriodEnd: demoSub.cancelAtPeriodEnd,
        activatedAt: demoSub.activatedAt,
        paymentProvider: demoSub.paymentProvider,
      };
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) return null;

    // Note: activated_at field may not exist in generated types yet
    const dataWithOptionalFields = data as typeof data & { activated_at?: string };

    return {
      id: data.id,
      organizationId: data.organization_id,
      planId: data.plan_id as PlanId,
      status: data.status as SubStatus,
      billingCycle: data.billing_cycle as BillingCycle,
      periodStart: data.current_period_start,
      periodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      activatedAt: dataWithOptionalFields.activated_at,
      paymentProvider: data.payment_provider,
    };
  } catch (e) {
    console.error('[Subscription] Failed to get subscription status:', e);
    return null;
  }
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(): boolean {
  if (isInDemoMode()) {
    const sub = getDemoSubscription();
    const isActive = sub?.status === 'active' || sub?.status === 'trialing';
    console.log('[Subscription] Demo subscription active check:', isActive);
    return isActive;
  }
  // For production, this is checked via OrganizationContext
  return false;
}

/**
 * Check if subscription was just activated (for redirect logic)
 */
export function wasSubscriptionJustActivated(): boolean {
  const activated = localStorage.getItem(SUBSCRIPTION_ACTIVATED_KEY) === 'true';
  console.log('[Subscription] Was just activated:', activated);
  return activated;
}

/**
 * Clear the "just activated" flag after redirect
 */
export function clearActivationFlag(): void {
  localStorage.removeItem(SUBSCRIPTION_ACTIVATED_KEY);
  console.log('[Subscription] Cleared activation flag');
}

/**
 * Get demo subscription data (exported for OrganizationContext)
 */
export function getDemoSubscriptionData(): DemoSubscriptionStorage | null {
  return getDemoSubscription();
}

/**
 * Verify payment was processed (for webhook verification)
 */
export async function verifyPaymentProcessed(
  transactionRef: string
): Promise<{ verified: boolean; paymentId?: string }> {
  console.log('[Subscription] Verifying payment:', transactionRef);

  if (isInDemoMode()) {
    // Demo mode - check localStorage
    try {
      const payments = JSON.parse(localStorage.getItem(DEMO_PAYMENT_KEY) || '[]');
      const payment = payments.find(
        (p: { transactionRef?: string; paymentStatus: string }) =>
          p.transactionRef === transactionRef && p.paymentStatus === 'completed'
      );
      return { verified: !!payment, paymentId: payment?.id };
    } catch {
      return { verified: false };
    }
  }

  try {
    // Note: payment_transactions table type may not be in generated types yet
    // Using raw query approach to avoid type conflicts
    const client = supabase as unknown as { 
      from: (table: string) => { 
        select: (cols: string) => { 
          eq: (col: string, val: string) => { 
            single: () => Promise<{ data: { id: string; webhook_verified: boolean } | null; error: unknown }> 
          } 
        } 
      } 
    };
    
    const result = await client
      .from('payment_transactions')
      .select('id, webhook_verified')
      .eq('transaction_ref', transactionRef)
      .single();

    if (result.error || !result.data) return { verified: false };
    return { verified: result.data.webhook_verified, paymentId: result.data.id };
  } catch {
    return { verified: false };
  }
}
