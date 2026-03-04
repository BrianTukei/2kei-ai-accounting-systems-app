/**
 * pesapal-checkout Edge Function
 * ──────────────────────────────
 * Handles payments via Pesapal — supports:
 *   - MTN Mobile Money (Uganda)
 *   - Airtel Money (Uganda)
 *   - Visa / Mastercard
 *   - Bank Transfer
 *
 * Pesapal operates across East Africa (UG, KE, TZ, RW)
 * and is the best option for Ugandan merchants.
 *
 * Actions:
 *   - checkout:  Create a Pesapal order and return the redirect URL
 *   - verify:    Verify payment status via Order Tracking ID
 *
 * Required env vars:
 *   - PESAPAL_CONSUMER_KEY     (from Pesapal merchant dashboard)
 *   - PESAPAL_CONSUMER_SECRET  (from Pesapal merchant dashboard)
 *   - PESAPAL_ENVIRONMENT      ("sandbox" or "production", defaults to "sandbox")
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Pesapal API URLs ──

function getPesapalBaseUrl(): string {
  const env = Deno.env.get('PESAPAL_ENVIRONMENT') || 'sandbox';
  return env === 'production'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';
}

// ── Plan pricing ──

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 29, annual: 290 },
  enterprise: { monthly: 79, annual: 790 },
};

const CURRENCY_MULTIPLIERS: Record<string, number> = {
  UGX: 3800, KES: 155, TZS: 2700, RWF: 1300,
  USD: 1, EUR: 0.93, GBP: 0.80,
};

function getLocalAmount(usdAmount: number, currency: string): number {
  const m = CURRENCY_MULTIPLIERS[currency.toUpperCase()] || 1;
  return Math.round(usdAmount * m);
}

// ── Pesapal Auth Token ──

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getPesapalToken(): Promise<string> {
  // Return cached token if still valid (5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.token;
  }

  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');

  if (!consumerKey || !consumerSecret) {
    throw new Error('PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be set');
  }

  const baseUrl = getPesapalBaseUrl();
  const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pesapal auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Pesapal auth error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expiryDate).getTime(),
  };

  console.log('[pesapal] Auth token obtained, expires:', data.expiryDate);
  return data.token;
}

// ── Register IPN (Instant Payment Notification) URL ──

async function registerIPN(token: string, callbackUrl: string): Promise<string> {
  const baseUrl = getPesapalBaseUrl();
  const res = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      url: callbackUrl,
      ipn_notification_type: 'GET',
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`IPN registration failed: ${JSON.stringify(data.error)}`);
  }

  console.log('[pesapal] IPN registered:', data.ipn_id);
  return data.ipn_id;
}

// ── Main Handler ──

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const action = body.action || 'checkout';

    // ── Get Pesapal auth token ──
    const token = await getPesapalToken();
    const baseUrl = getPesapalBaseUrl();

    // ────────────────────────────────────────────
    // VERIFY: Check payment status
    // ────────────────────────────────────────────

    if (action === 'verify') {
      const { orderTrackingId, organizationId, planId, billingCycle } = body;

      if (!orderTrackingId) {
        throw new Error('orderTrackingId is required for verification');
      }

      console.log('[pesapal] Verifying order:', orderTrackingId);

      const statusRes = await fetch(
        `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        },
      );

      const statusData = await statusRes.json();
      console.log('[pesapal] Transaction status:', statusData);

      // Pesapal status_code: 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed
      const isCompleted = statusData.payment_status_description === 'Completed'
        || statusData.status_code === 1;

      if (!isCompleted) {
        // Update payment as failed
        await supabase.from('payment_transactions').update({
          payment_status: 'failed',
          error_message: statusData.payment_status_description || 'Payment not completed',
          updated_at: new Date().toISOString(),
        }).eq('transaction_ref', orderTrackingId);

        return new Response(JSON.stringify({
          success: false,
          verified: false,
          error: `Payment ${statusData.payment_status_description || 'not completed'}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Payment successful — activate subscription
      const periodStart = new Date().toISOString();
      const periodEnd = new Date();
      if (billingCycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const paymentMethod = statusData.payment_method || 'pesapal';

      // Activate subscription in DB
      await supabase.from('subscriptions').upsert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'pesapal',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' });

      // Update payment transaction
      await supabase.from('payment_transactions').update({
        payment_status: 'completed',
        webhook_verified: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('transaction_ref', orderTrackingId);

      // Log billing event
      await supabase.from('billing_events').insert({
        organization_id: organizationId,
        type: 'payment_succeeded',
        provider: 'pesapal',
        amount: statusData.amount || 0,
        currency: statusData.currency || 'UGX',
        metadata: {
          order_tracking_id: orderTrackingId,
          payment_method: paymentMethod,
          merchant_reference: statusData.merchant_reference,
          confirmation_code: statusData.confirmation_code,
          plan_id: planId,
          billing_cycle: billingCycle,
        },
      });

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        planId,
        billingCycle,
        periodEnd: periodEnd.toISOString(),
        paymentMethod,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ────────────────────────────────────────────
    // CHECKOUT: Create Pesapal order
    // ────────────────────────────────────────────

    const {
      organizationId, planId, billingCycle, email,
      currency, phoneNumber, successUrl, cancelUrl,
    } = body;

    if (!organizationId || !planId || !billingCycle || !email) {
      throw new Error('Missing required fields: organizationId, planId, billingCycle, email');
    }
    if (planId === 'free' || !PLAN_PRICES[planId]) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const targetCurrency = (currency || 'UGX').toUpperCase();
    const usdAmount = PLAN_PRICES[planId][billingCycle];
    const localAmount = getLocalAmount(usdAmount, targetCurrency);
    const merchantRef = `2kai_${organizationId}_${Date.now()}`;

    // Record pending payment
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: localAmount,
      currency: targetCurrency,
      payment_provider: 'pesapal',
      payment_status: 'pending',
      transaction_ref: merchantRef,
    });

    // Register IPN callback URL (Pesapal requires this)
    const ipnCallbackUrl = `${supabaseUrl}/functions/v1/pesapal-checkout`;
    const ipnId = await registerIPN(token, ipnCallbackUrl);

    // Build the callback URL that Pesapal redirects to after payment
    const callbackUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}` +
      `provider=pesapal&plan=${planId}&cycle=${billingCycle}`;

    // Submit order to Pesapal
    const orderPayload = {
      id: merchantRef,
      currency: targetCurrency,
      amount: localAmount,
      description: `2K AI Accounting — ${PLAN_PRICES[planId] ? planId.charAt(0).toUpperCase() + planId.slice(1) : planId} Plan (${billingCycle})`,
      callback_url: callbackUrl,
      cancellation_url: cancelUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: email,
        phone_number: phoneNumber || '',
        country_code: 'UG',
      },
    };

    console.log('[pesapal] Submitting order:', merchantRef, localAmount, targetCurrency);

    const orderRes = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();

    if (orderData.error) {
      await supabase.from('payment_transactions').update({
        payment_status: 'failed',
        error_message: JSON.stringify(orderData.error),
        updated_at: new Date().toISOString(),
      }).eq('transaction_ref', merchantRef);

      throw new Error(`Pesapal order failed: ${JSON.stringify(orderData.error)}`);
    }

    console.log('[pesapal] Order created:', orderData.order_tracking_id);

    // Update payment with Pesapal order tracking ID
    await supabase.from('payment_transactions').update({
      payment_status: 'processing',
      transaction_ref: orderData.order_tracking_id, // Use Pesapal's tracking ID
      updated_at: new Date().toISOString(),
    }).eq('transaction_ref', merchantRef);

    return new Response(JSON.stringify({
      status: 'success',
      checkoutUrl: orderData.redirect_url,
      orderTrackingId: orderData.order_tracking_id,
      merchantRef,
      amount: localAmount,
      currency: targetCurrency,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[pesapal] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
