/**
 * stripe-checkout Edge Function (Production-Grade)
 * ─────────────────────────────────────────────────
 * Creates a Stripe Checkout Session for subscription payments.
 * Supports:
 *   - Subscription mode with VISA, Mastercard, AMEX
 *   - 7-day free trial for Pro & Enterprise plans
 *   - Proper metadata for webhook handling
 *   - Idempotency / double-activation protection
 *   - Existing Stripe customer detection
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STRIPE_PRICE_PRO_MONTHLY
 *   STRIPE_PRICE_PRO_ANNUAL
 *   STRIPE_PRICE_ENTERPRISE_MONTHLY
 *   STRIPE_PRICE_ENTERPRISE_ANNUAL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Plan configuration ─────────────────────────────────────
const PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')       || '',
    annual:  Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')        || '',
  },
  enterprise: {
    monthly: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') || '',
    annual:  Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL')  || '',
  },
};

const TRIAL_DAYS: Record<string, number> = {
  pro: 7,
  enterprise: 7,
};

interface CheckoutRequest {
  organizationId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}

// ── Stripe API helper ──────────────────────────────────────
async function stripeRequest(
  endpoint: string,
  method: string,
  body: Record<string, string> | null,
  stripeKey: string,
) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${stripeKey}`,
  };
  const options: RequestInit = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams(body).toString();
  }

  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: CheckoutRequest = await req.json();
    const { organizationId, planId, billingCycle, email, successUrl, cancelUrl } = body;

    // ── Input validation ─────────────────────────────────
    if (!organizationId || !planId || !billingCycle || !email || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!['pro', 'enterprise'].includes(planId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan. Free plan does not require checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing cycle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify user membership
    const { data: membership } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'accountant'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to manage billing' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get price ID
    const priceId = PRICE_IDS[planId]?.[billingCycle];
    if (!priceId) {
      throw new Error(`Stripe Price ID not configured for ${planId}/${billingCycle}. Set STRIPE_PRICE_${planId.toUpperCase()}_${billingCycle.toUpperCase()} env var.`);
    }

    // ── Check for existing Stripe customer ───────────────
    let stripeCustomerId: string | null = null;
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('organization_id', organizationId)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    }

    // Prevent double activation
    if (existingSub?.status === 'active' && existingSub?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({
          error: 'Organization already has an active subscription. Use the billing portal to change plans.',
          billingPortal: true,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Create audit trail ───────────────────────────────
    const txRef = `stripe_${organizationId}_${Date.now()}`;
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      user_id: user.id,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: 0,
      currency: body.currency || 'USD',
      payment_provider: 'stripe',
      payment_status: 'pending',
      transaction_ref: txRef,
    });

    // ── Build checkout session params ────────────────────
    const trialDays = TRIAL_DAYS[planId] || 0;

    const params: Record<string, string> = {
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancelUrl,
      'metadata[organization_id]': organizationId,
      'metadata[plan_id]': planId,
      'metadata[billing_cycle]': billingCycle,
      'metadata[user_id]': user.id,
      'metadata[tx_ref]': txRef,
      'subscription_data[metadata][organization_id]': organizationId,
      'subscription_data[metadata][plan_id]': planId,
      'subscription_data[metadata][billing_cycle]': billingCycle,
      // Accept VISA, Mastercard, AMEX
      'payment_method_types[0]': 'card',
      // Allow promotion codes
      'allow_promotion_codes': 'true',
      // Collect billing address for tax compliance
      'billing_address_collection': 'auto',
    };

    // Use existing customer or pre-fill email
    if (stripeCustomerId) {
      params['customer'] = stripeCustomerId;
    } else {
      params['customer_email'] = email;
    }

    // Add 7-day trial if applicable and user hasn't had a trial before
    if (trialDays > 0 && existingSub?.status !== 'canceled') {
      params['subscription_data[trial_period_days]'] = trialDays.toString();
      params['payment_method_collection'] = 'always';
    }

    // ── Create Stripe Checkout Session ───────────────────
    const session = await stripeRequest('/checkout/sessions', 'POST', params, stripeKey);

    if (session.error) {
      console.error('[stripe-checkout] Stripe API error:', session.error);
      throw new Error(session.error.message || 'Stripe checkout creation failed');
    }

    console.log(`[stripe-checkout] Session created: ${session.id} for org ${organizationId}, plan ${planId}/${billingCycle}`);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('[stripe-checkout] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
