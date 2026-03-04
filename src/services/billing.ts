/**
 * billing.ts
 * ──────────
 * Payment provider integration layer.
 *
 * Architecture:
 *   - Stripe:       primary for international (USD/EUR)
 *   - Flutterwave:  African markets (NGN, GHS, KES, ZAR …)
 *   - Paystack:     Nigeria / Ghana fallback
 *
 * In production, these calls hit your Supabase Edge Functions
 * which proxy to the payment providers to keep secret keys on
 * the server.  The Edge Function URLs are set via VITE_SUPABASE_URL.
 *
 * Each provider follows the same interface so the billing UI
 * can be provider-agnostic.
 *
 * DEMO MODE: When Edge Functions are not available, the system
 * uses localStorage-based subscription management for testing.
 */

import { supabase } from '@/integrations/supabase/client';
import { PLANS, type PlanId, type BillingCycle, type SubStatus } from '@/lib/plans';

// ─────────────────────────────────────────
// Demo mode helpers
// ─────────────────────────────────────────

const DEMO_MODE_KEY = '2kai-demo-subscription';
const DEMO_BILLING_HISTORY_KEY = '2kai-billing-history';

interface DemoSubscription {
  planId: PlanId;
  status: SubStatus;
  billingCycle: BillingCycle;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

function getDemoSubscription(): DemoSubscription | null {
  try {
    const data = localStorage.getItem(DEMO_MODE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setDemoSubscription(sub: DemoSubscription): void {
  localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(sub));
}

function addDemoBillingEvent(event: {
  type: string;
  amount: number;
  currency: string;
  provider: string;
}): void {
  try {
    const history = JSON.parse(localStorage.getItem(DEMO_BILLING_HISTORY_KEY) || '[]');
    history.unshift({
      id: crypto.randomUUID(),
      ...event,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(DEMO_BILLING_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Check if we're in demo mode (Edge Functions not available)
 */
function isDemoMode(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes('placeholder');
}

// ─────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────

export type PaymentProvider = 'stripe' | 'flutterwave' | 'paystack' | 'pesapal' | 'mtn_momo' | 'airtel_money' | 'demo';

export interface CheckoutOptions {
  organizationId: string;
  planId:         PlanId;
  billingCycle:   BillingCycle;
  /** User's email (pre-fill checkout form) */
  email:          string;
  /** ISO-4217 currency code eg. 'USD', 'NGN', 'GHS', 'ZAR' */
  currency:       string;
  successUrl:     string;
  cancelUrl:      string;
  /** Phone number for mobile money payments (required for MTN MoMo / Airtel Money) */
  phoneNumber?:   string;
  /** Mobile money network override */
  network?:       'MTN' | 'AIRTEL';
}

export interface CheckoutResult {
  provider:    PaymentProvider;
  checkoutUrl: string;  // redirect user here (empty string = completed inline)
  txRef?:      string;  // transaction reference for later verification
  amount?:     number;
  currency?:   string;
}

export interface BillingPortalResult {
  url: string;
}

export interface PaymentVerificationResult {
  success:      boolean;
  verified:     boolean;
  planId?:      string;
  billingCycle?: string;
  periodEnd?:   string;
  error?:       string;
}

// ─────────────────────────────────────────
// Provider selection heuristic
// ─────────────────────────────────────────

/** Uganda & East Africa — prefer Pesapal (Flutterwave doesn't support Uganda merchants) */
const PESAPAL_CURRENCIES = new Set(['UGX', 'KES', 'TZS', 'RWF']);

/** African countries — Flutterwave (non-EA) */
const AF_CURRENCIES = new Set([
  'NGN','GHS','ZAR','XOF','XAF','ETB',
  'EGP','MAD','DZD','TND','ZMW','BWP','MWK','MZN','AOA',
]);

/** Nigeria & Ghana specific — prefer Paystack */
const PAYSTACK_CURRENCIES = new Set(['NGN', 'GHS']);

/** Currencies where Mobile Money (MTN/Airtel) is widely used */
const MOMO_CURRENCIES = new Set(['UGX', 'RWF', 'TZS', 'GHS', 'XOF', 'XAF', 'ZMW', 'KES', 'MWK']);

export function selectProvider(currency: string): PaymentProvider {
  // In demo mode, always use demo provider
  if (isDemoMode()) return 'demo';
  
  const upper = currency.toUpperCase();
  
  // Uganda & East Africa — Pesapal (supports MTN MoMo, Airtel Money, Cards)
  if (PESAPAL_CURRENCIES.has(upper)) {
    return 'pesapal';
  }
  
  // Paystack is preferred for NGN and GHS (their primary markets)
  if (PAYSTACK_CURRENCIES.has(upper) && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
    return 'paystack';
  }
  
  // Other African currencies — Flutterwave
  if (AF_CURRENCIES.has(upper)) {
    return 'flutterwave';
  }
  
  // International — Stripe
  return 'stripe';
}

/**
 * Get the human-readable provider name for UI display
 */
export function getProviderDisplayName(provider: PaymentProvider): string {
  switch (provider) {
    case 'stripe':       return 'Stripe (Card)';
    case 'flutterwave':  return 'Flutterwave';
    case 'paystack':     return 'Paystack';
    case 'pesapal':      return 'Pesapal';
    case 'mtn_momo':     return 'MTN Mobile Money (Direct)';
    case 'airtel_money': return 'Airtel Money';
    case 'demo':         return 'Demo Mode';
    default:             return provider;
  }
}

/**
 * Get available payment methods for a given provider
 */
export function getProviderPaymentMethods(provider: PaymentProvider): string[] {
  switch (provider) {
    case 'stripe':       return ['Card', 'Bank Debit'];
    case 'flutterwave':  return ['Card', 'Bank Transfer', 'USSD', 'Mobile Money'];
    case 'paystack':     return ['Card', 'Bank Transfer', 'USSD', 'Mobile Money'];
    case 'pesapal':      return ['MTN MoMo', 'Airtel Money', 'Visa/Mastercard', 'Bank Transfer'];
    case 'mtn_momo':     return ['MTN MoMo'];
    case 'airtel_money': return ['Airtel Money'];
    case 'demo':         return ['Demo Payment'];
    default:             return ['Card'];
  }
}

/**
 * Check if a provider requires a phone number (mobile money)
 */
export function providerRequiresPhone(provider: PaymentProvider): boolean {
  return provider === 'mtn_momo' || provider === 'airtel_money';
}

/**
 * Check if provider optionally accepts a phone number (for pre-filling)
 */
export function providerAcceptsPhone(provider: PaymentProvider): boolean {
  return provider === 'pesapal' || provider === 'mtn_momo' || provider === 'airtel_money';
}

/**
 * Check if mobile money providers are available for a given currency
 */
export function isMoMoAvailable(currency: string): boolean {
  return MOMO_CURRENCIES.has(currency.toUpperCase());
}

// ─────────────────────────────────────────
// Supabase Edge Function caller
// ─────────────────────────────────────────

async function callEdgeFunction<T>(name: string, body: object): Promise<T> {
  if (isDemoMode()) {
    throw new Error(`Demo mode: Edge function '${name}' not available`);
  }
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// ─────────────────────────────────────────
// Demo Mode Checkout
// ─────────────────────────────────────────

export async function demoCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const plan = PLANS[opts.planId];
  const amount = opts.billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  
  // Calculate period end (1 month or 1 year from now)
  const periodEnd = new Date();
  if (opts.billingCycle === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  
  // Create demo subscription
  const subscription: DemoSubscription = {
    planId: opts.planId,
    status: 'active',
    billingCycle: opts.billingCycle,
    periodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
  };
  setDemoSubscription(subscription);
  
  // Record demo billing event
  addDemoBillingEvent({
    type: 'payment_succeeded',
    amount,
    currency: opts.currency,
    provider: 'demo',
  });
  
  // Return success - no redirect needed in demo mode
  return { provider: 'demo', checkoutUrl: '' };
}

// ─────────────────────────────────────────
// Stripe
// ─────────────────────────────────────────

export async function stripeCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const data = await callEdgeFunction<{ url: string }>('stripe-checkout', opts);
  return { provider: 'stripe', checkoutUrl: data.url };
}

export async function stripeBillingPortal(
  organizationId: string,
  returnUrl: string,
): Promise<BillingPortalResult> {
  if (isDemoMode()) {
    return { url: '/billing?demo=portal' };
  }
  return callEdgeFunction<BillingPortalResult>('stripe-billing-portal', { organizationId, returnUrl });
}

// ─────────────────────────────────────────
// Flutterwave
// ─────────────────────────────────────────

export async function flutterwaveCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const data = await callEdgeFunction<{
    link: string;
    txRef: string;
    amount: number;
    currency: string;
  }>('flutterwave-checkout', {
    ...opts,
    action: 'checkout',
  });
  return {
    provider: 'flutterwave',
    checkoutUrl: data.link,
    txRef: data.txRef,
    amount: data.amount,
    currency: data.currency,
  };
}

/**
 * Verify a Flutterwave transaction after redirect
 */
export async function verifyFlutterwavePayment(
  transactionId: string,
  txRef: string,
  organizationId: string,
): Promise<PaymentVerificationResult> {
  if (isDemoMode()) {
    return { success: true, verified: true };
  }
  try {
    const result = await callEdgeFunction<PaymentVerificationResult>('flutterwave-checkout', {
      action: 'verify',
      transactionId,
      txRef,
      organizationId,
    });
    return result;
  } catch (error: any) {
    return { success: false, verified: false, error: error.message };
  }
}

// ─────────────────────────────────────────
// Paystack
// ─────────────────────────────────────────

/**
 * Initialise a Paystack transaction and return the checkout URL.
 * Uses the public key for inline JS or redirects to Paystack hosted page.
 */
export async function paystackCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

  if (publicKey) {
    // Inline Paystack (frontend-only)
    return new Promise((resolve, reject) => {
      const PaystackPop = (window as typeof window & { PaystackPop?: { setup: (cfg: object) => { openIframe: () => void } } }).PaystackPop;
      if (!PaystackPop) {
        // Fall through to server-side
        console.warn('PaystackPop not loaded, falling back to server redirect');
        callEdgeFunction<{
          authorization_url: string;
          reference: string;
          amount: number;
          currency: string;
        }>('paystack-checkout', {
          ...opts,
          action: 'checkout',
        }).then(data => {
          resolve({
            provider: 'paystack',
            checkoutUrl: data.authorization_url,
            txRef: data.reference,
            amount: data.amount,
            currency: data.currency,
          });
        }).catch(reject);
        return;
      }

      const reference = `led_${opts.organizationId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const handler = PaystackPop.setup({
        key:       publicKey,
        email:     opts.email,
        amount:    getPlanAmountKobo(opts.planId, opts.billingCycle, opts.currency),
        currency:  opts.currency || 'NGN',
        ref:       reference,
        metadata: {
          organization_id: opts.organizationId,
          plan_id:         opts.planId,
          billing_cycle:   opts.billingCycle,
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: `${opts.planId} (${opts.billingCycle})`,
            },
          ],
        },
        callback: (response: { reference: string }) => {
          // Verify the payment
          verifyPaystackPayment(response.reference, opts.organizationId).then((result) => {
            if (result.verified) {
              window.location.href = `${opts.successUrl}?reference=${response.reference}&provider=paystack&plan=${opts.planId}&upgraded=1`;
            } else {
              window.location.href = `${opts.cancelUrl}?payment=failed`;
            }
          });
        },
        onClose: () => {
          // User closed the modal — no action needed
          console.log('Paystack popup closed by user');
        },
      });
      handler.openIframe();
      resolve({ provider: 'paystack', checkoutUrl: '', txRef: reference });
    });
  }

  // Fall back to server-side initialisation
  const data = await callEdgeFunction<{
    authorization_url: string;
    reference: string;
    amount: number;
    currency: string;
  }>('paystack-checkout', {
    ...opts,
    action: 'checkout',
  });
  return {
    provider: 'paystack',
    checkoutUrl: data.authorization_url,
    txRef: data.reference,
    amount: data.amount,
    currency: data.currency,
  };
}

/**
 * Verify a Paystack transaction after redirect
 */
export async function verifyPaystackPayment(
  reference: string,
  organizationId: string,
): Promise<PaymentVerificationResult> {
  if (isDemoMode()) {
    return { success: true, verified: true };
  }
  try {
    const result = await callEdgeFunction<PaymentVerificationResult>('paystack-checkout', {
      action: 'verify',
      reference,
      organizationId,
    });
    return result;
  } catch (error: any) {
    return { success: false, verified: false, error: error.message };
  }
}

// ─────────────────────────────────────────
// Mobile Money (MTN MoMo & Airtel Money)
// ─────────────────────────────────────────

/**
 * Initiate an MTN Mobile Money checkout via the mtn-momo-checkout edge function.
 * Uses the MTN MoMo Open API directly (not Flutterwave).
 */
export async function mtnMomoCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  if (!opts.phoneNumber) throw new Error('Phone number is required for MTN Mobile Money');
  const data = await callEdgeFunction<{
    status: string;
    txRef: string;
    amount: number;
    currency: string;
    redirectUrl?: string;
    verifyUrl?: string;
    message?: string;
  }>('mtn-momo-checkout', {
    ...opts,
    action: 'checkout',
  });
  return {
    provider: 'mtn_momo',
    checkoutUrl: data.redirectUrl || data.verifyUrl || '',
    txRef: data.txRef,
    amount: data.amount,
    currency: data.currency,
  };
}

/**
 * Initiate an Airtel Money checkout.
 * Routes through Pesapal (which supports Airtel Money in Uganda).
 */
export async function airtelMoneyCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  if (!opts.phoneNumber) throw new Error('Phone number is required for Airtel Money');
  // Use Pesapal for Airtel Money in Uganda (Pesapal supports it natively)
  return pesapalCheckout(opts);
}

/**
 * Verify an MTN MoMo payment via the direct API
 */
export async function verifyMomoPayment(
  txRef: string,
  organizationId: string,
  planId?: string,
  billingCycle?: string,
): Promise<PaymentVerificationResult> {
  if (isDemoMode()) {
    return { success: true, verified: true };
  }
  try {
    return await callEdgeFunction<PaymentVerificationResult>('mtn-momo-checkout', {
      action: 'verify',
      referenceId: txRef,
      organizationId,
      planId,
      billingCycle,
    });
  } catch (error: any) {
    return { success: false, verified: false, error: error.message };
  }
}

// ─────────────────────────────────────────
// Pesapal (East Africa — Uganda, Kenya, Tanzania, Rwanda)
// ─────────────────────────────────────────

/**
 * Initiate a Pesapal checkout.
 * Pesapal handles: MTN MoMo, Airtel Money, Visa/MC, Bank Transfer.
 * The user is redirected to Pesapal's hosted payment page.
 */
export async function pesapalCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const data = await callEdgeFunction<{
    status: string;
    checkoutUrl: string;
    orderTrackingId: string;
    merchantRef: string;
    amount: number;
    currency: string;
  }>('pesapal-checkout', {
    ...opts,
    action: 'checkout',
  });
  return {
    provider: 'pesapal',
    checkoutUrl: data.checkoutUrl,
    txRef: data.orderTrackingId,
    amount: data.amount,
    currency: data.currency,
  };
}

/**
 * Verify a Pesapal payment after redirect
 */
export async function verifyPesapalPayment(
  orderTrackingId: string,
  organizationId: string,
  planId?: string,
  billingCycle?: string,
): Promise<PaymentVerificationResult> {
  if (isDemoMode()) {
    return { success: true, verified: true };
  }
  try {
    return await callEdgeFunction<PaymentVerificationResult>('pesapal-checkout', {
      action: 'verify',
      orderTrackingId,
      organizationId,
      planId,
      billingCycle,
    });
  } catch (error: any) {
    return { success: false, verified: false, error: error.message };
  }
}

// ─────────────────────────────────────────
// Unified checkout entry point
// ─────────────────────────────────────────

export async function initiateCheckout(
  opts: CheckoutOptions,
  providerOverride?: PaymentProvider,
): Promise<CheckoutResult> {
  const provider = providerOverride ?? selectProvider(opts.currency);

  switch (provider) {
    case 'demo':          return demoCheckout(opts);
    case 'stripe':        return stripeCheckout(opts);
    case 'flutterwave':   return flutterwaveCheckout(opts);
    case 'paystack':      return paystackCheckout(opts);
    case 'pesapal':       return pesapalCheckout(opts);
    case 'mtn_momo':      return mtnMomoCheckout(opts);
    case 'airtel_money':  return airtelMoneyCheckout(opts);
    default:              return demoCheckout(opts);
  }
}

// ─────────────────────────────────────────
// Payment verification (after redirect)
// ─────────────────────────────────────────

/**
 * Verify a payment after returning from external checkout.
 * Called from the Billing page when URL params indicate a successful payment.
 */
export async function verifyPaymentFromRedirect(
  params: URLSearchParams,
  organizationId: string,
): Promise<PaymentVerificationResult> {
  const provider = params.get('provider');

  if (!provider || provider === 'demo') {
    return { success: true, verified: true };
  }

  try {
    if (provider === 'flutterwave') {
      const transactionId = params.get('transaction_id') || '';
      const txRef = params.get('tx_ref') || '';
      if (!transactionId && !txRef) {
        return { success: false, verified: false, error: 'Missing transaction reference' };
      }
      return await verifyFlutterwavePayment(transactionId, txRef, organizationId);
    }

    if (provider === 'paystack') {
      const reference = params.get('reference') || params.get('trxref') || '';
      if (!reference) {
        return { success: false, verified: false, error: 'Missing payment reference' };
      }
      return await verifyPaystackPayment(reference, organizationId);
    }

    if (provider === 'stripe') {
      // Stripe verification is handled by webhooks; redirect is sufficient
      return { success: true, verified: true };
    }

    if (provider === 'pesapal') {
      const orderTrackingId = params.get('OrderTrackingId') || params.get('orderTrackingId') || '';
      const planId = params.get('planId') || '';
      const billingCycle = params.get('billingCycle') || '';
      if (!orderTrackingId) {
        return { success: false, verified: false, error: 'Missing Pesapal order tracking ID' };
      }
      return await verifyPesapalPayment(orderTrackingId, organizationId, planId, billingCycle);
    }

    if (provider === 'mtn_momo' || provider === 'airtel_money') {
      const txRef = params.get('tx_ref') || params.get('referenceId') || '';
      const planId = params.get('planId') || '';
      const billingCycle = params.get('billingCycle') || '';
      if (!txRef) {
        return { success: false, verified: false, error: 'Missing mobile money transaction reference' };
      }
      return await verifyMomoPayment(txRef, organizationId, planId, billingCycle);
    }

    return { success: false, verified: false, error: `Unknown provider: ${provider}` };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return { success: false, verified: false, error: error.message };
  }
}

// ─────────────────────────────────────────
// Plan pricing helpers
// ─────────────────────────────────────────

/** Currency exchange rate multipliers (approximate) */
const CURRENCY_RATES: Record<string, number> = {
  USD: 1, EUR: 0.93, GBP: 0.80,
  NGN: 1600, GHS: 15, KES: 155, ZAR: 19,
  TZS: 2700, UGX: 3800, RWF: 1300,
  XOF: 620, XAF: 620, ETB: 57, EGP: 50, MAD: 10,
};

/** Return price in the smallest currency unit (kobo, pesewa, cents) */
export function getPlanAmountKobo(planId: PlanId, cycle: BillingCycle, currency: string = 'USD'): number {
  const plan = PLANS[planId];
  const usdAmount = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const rate = CURRENCY_RATES[currency.toUpperCase()] || 1;
  return Math.round(usdAmount * rate * 100);
}

/** Get display price for a plan in a specific currency */
export function getDisplayPrice(planId: PlanId, cycle: BillingCycle, currency: string = 'USD'): {
  amount: number;
  formatted: string;
  symbol: string;
} {
  const plan = PLANS[planId];
  const usdAmount = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const rate = CURRENCY_RATES[currency.toUpperCase()] || 1;
  const amount = Math.round(usdAmount * rate);

  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: 'GH₵',
    KES: 'KSh', ZAR: 'R', TZS: 'TSh', UGX: 'USh',
  };
  const symbol = symbols[currency.toUpperCase()] || currency;

  return {
    amount,
    formatted: `${symbol}${amount.toLocaleString()}`,
    symbol,
  };
}

// ─────────────────────────────────────────
// Cancel / Reactivate
// ─────────────────────────────────────────

/** Cancel a subscription at period end */
export async function cancelSubscription(
  organizationId: string,
  options?: { reason?: string; immediate?: boolean },
): Promise<{ effectiveEnd?: string; message?: string }> {
  if (isDemoMode()) {
    const sub = getDemoSubscription();
    if (sub) {
      if (options?.immediate) {
        sub.status = 'canceled' as SubStatus;
        sub.cancelAtPeriodEnd = false;
      } else {
        sub.cancelAtPeriodEnd = true;
      }
      setDemoSubscription(sub);
      addDemoBillingEvent({
        type: 'subscription_canceled',
        amount: 0,
        currency: 'USD',
        provider: 'demo',
      });
    }
    return {
      effectiveEnd: sub?.periodEnd,
      message: options?.immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at end of billing period',
    };
  }
  return await callEdgeFunction('cancel-subscription', {
    organizationId,
    reason: options?.reason,
    immediate: options?.immediate || false,
  });
}

/** Reactivate a canceled subscription */
export async function reactivateSubscription(organizationId: string): Promise<void> {
  if (isDemoMode()) {
    const sub = getDemoSubscription();
    if (sub) {
      sub.cancelAtPeriodEnd = false;
      sub.status = 'active';
      setDemoSubscription(sub);
      addDemoBillingEvent({
        type: 'subscription_reactivated',
        amount: 0,
        currency: 'USD',
        provider: 'demo',
      });
    }
    return;
  }
  await callEdgeFunction('reactivate-subscription', { organizationId });
}

// ─────────────────────────────────────────
// Billing History
// ─────────────────────────────────────────

/** Fetch billing invoices for display */
export async function fetchBillingHistory(organizationId: string) {
  if (isDemoMode()) {
    try {
      const history = JSON.parse(localStorage.getItem(DEMO_BILLING_HISTORY_KEY) || '[]');
      return history;
    } catch {
      return [];
    }
  }
  
  const { data } = await supabase
    .from('billing_events')
    .select('*')
    .eq('organization_id', organizationId)
    .in('type', ['payment_succeeded', 'payment_failed', 'subscription_canceled', 'subscription_reactivated'])
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

// ─────────────────────────────────────────
// Exports for other modules
// ─────────────────────────────────────────

/**
 * Get the current demo subscription (for OrganizationContext)
 */
export function getDemoSubscriptionData(): DemoSubscription | null {
  return getDemoSubscription();
}

/**
 * Check if running in demo mode (exported for other modules)
 */
export function isInDemoMode(): boolean {
  return isDemoMode();
}
