/**
 * mtn-momo-checkout Edge Function
 * ───────────────────────────────
 * Direct integration with MTN MoMo Open API (no Flutterwave).
 *
 * Uses the MTN Mobile Money API Collections product to:
 *   1. Request payment (sends USSD push to subscriber's phone)
 *   2. Verify payment status
 *
 * MTN MoMo API Portal: https://momodeveloper.mtn.com
 *
 * Actions:
 *   - checkout:  Initiate a RequestToPay
 *   - verify:    Check payment status by referenceId
 *
 * Required env vars:
 *   - MTN_MOMO_SUBSCRIPTION_KEY   (Primary key from MTN Developer Portal)
 *   - MTN_MOMO_API_USER           (API User UUID)
 *   - MTN_MOMO_API_KEY            (API Key for the user)
 *   - MTN_MOMO_ENVIRONMENT        ("sandbox" or "production", defaults to "sandbox")
 *   - MTN_MOMO_CALLBACK_HOST      (Your public URL for callbacks, optional)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── MTN MoMo API URLs ──

function getMomoBaseUrl(): string {
  const env = Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox';
  return env === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com';
}

function getTargetEnvironment(): string {
  const env = Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox';
  return env === 'production' ? 'mtnuganda' : 'sandbox';
}

// ── Plan Pricing ──

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 29, annual: 290 },
  enterprise: { monthly: 79, annual: 790 },
};

const UGX_RATE = 3800;

function getUGXAmount(usdAmount: number): number {
  return Math.round(usdAmount * UGX_RATE);
}

// ── Get OAuth2 Token ──

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getMomoToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const apiUser = Deno.env.get('MTN_MOMO_API_USER');
  const apiKey = Deno.env.get('MTN_MOMO_API_KEY');
  const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');

  if (!apiUser || !apiKey || !subscriptionKey) {
    throw new Error('MTN MoMo API credentials not configured (MTN_MOMO_API_USER, MTN_MOMO_API_KEY, MTN_MOMO_SUBSCRIPTION_KEY)');
  }

  const baseUrl = getMomoBaseUrl();
  const credentials = btoa(`${apiUser}:${apiKey}`);

  const res = await fetch(`${baseUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN MoMo token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  console.log('[mtn-momo] Token obtained');
  return data.access_token;
}

// ── Main Handler ──

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');
    if (!subscriptionKey) {
      throw new Error('MTN_MOMO_SUBSCRIPTION_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const action = body.action || 'checkout';
    const baseUrl = getMomoBaseUrl();

    // ────────────────────────────────────────────
    // VERIFY: Check RequestToPay status
    // ────────────────────────────────────────────

    if (action === 'verify') {
      const { referenceId, organizationId, planId, billingCycle } = body;

      if (!referenceId) {
        throw new Error('referenceId is required for verification');
      }

      const token = await getMomoToken();

      console.log('[mtn-momo] Checking payment status:', referenceId);

      const statusRes = await fetch(
        `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': getTargetEnvironment(),
            'Ocp-Apim-Subscription-Key': subscriptionKey,
          },
        },
      );

      if (!statusRes.ok) {
        const text = await statusRes.text();
        throw new Error(`Status check failed (${statusRes.status}): ${text}`);
      }

      const statusData = await statusRes.json();
      console.log('[mtn-momo] Payment status:', statusData.status);

      // MTN MoMo statuses: SUCCESSFUL, FAILED, PENDING, REJECTED, TIMEOUT, EXPIRED
      const isSuccess = statusData.status === 'SUCCESSFUL';

      if (!isSuccess) {
        await supabase.from('payment_transactions').update({
          payment_status: statusData.status === 'PENDING' ? 'processing' : 'failed',
          error_message: statusData.reason || `Status: ${statusData.status}`,
          updated_at: new Date().toISOString(),
        }).eq('transaction_ref', referenceId);

        return new Response(JSON.stringify({
          success: false,
          verified: false,
          status: statusData.status,
          error: statusData.status === 'PENDING'
            ? 'Payment is still processing. Please approve on your phone.'
            : `Payment ${statusData.status.toLowerCase()}. ${statusData.reason || ''}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Payment successful — activate subscription
      const periodStart = new Date().toISOString();
      const periodEnd = new Date();
      if (billingCycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from('subscriptions').upsert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'mtn_momo',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' });

      await supabase.from('payment_transactions').update({
        payment_status: 'completed',
        webhook_verified: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('transaction_ref', referenceId);

      await supabase.from('billing_events').insert({
        organization_id: organizationId,
        type: 'payment_succeeded',
        provider: 'mtn_momo',
        amount: Number(statusData.amount) || 0,
        currency: statusData.currency || 'UGX',
        metadata: {
          reference_id: referenceId,
          payer: statusData.payer,
          financial_transaction_id: statusData.financialTransactionId,
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
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ────────────────────────────────────────────
    // CHECKOUT: Send RequestToPay
    // ────────────────────────────────────────────

    const {
      organizationId, planId, billingCycle, email,
      phoneNumber, successUrl,
    } = body;

    if (!organizationId || !planId || !billingCycle) {
      throw new Error('Missing required fields: organizationId, planId, billingCycle');
    }
    if (!phoneNumber) {
      throw new Error('Phone number is required for MTN Mobile Money');
    }
    if (planId === 'free' || !PLAN_PRICES[planId]) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const token = await getMomoToken();

    const usdAmount = PLAN_PRICES[planId][billingCycle];
    const amount = getUGXAmount(usdAmount);

    // Generate a UUID for the request (MTN requires UUID v4)
    const referenceId = crypto.randomUUID();

    // Normalize phone number (MTN expects MSISDN format: 256XXXXXXXXX)
    let msisdn = phoneNumber.replace(/[\s\-+]/g, '');
    if (msisdn.startsWith('0')) {
      msisdn = '256' + msisdn.substring(1);
    }
    if (!msisdn.startsWith('256')) {
      msisdn = '256' + msisdn;
    }

    // Record pending payment
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount,
      currency: 'UGX',
      payment_provider: 'mtn_momo',
      payment_status: 'pending',
      transaction_ref: referenceId,
    });

    // Callback URL for MTN to notify us (optional, we also poll)
    const callbackUrl = Deno.env.get('MTN_MOMO_CALLBACK_HOST')
      ? `${Deno.env.get('MTN_MOMO_CALLBACK_HOST')}/functions/v1/mtn-momo-checkout`
      : `${supabaseUrl}/functions/v1/mtn-momo-checkout`;

    // Send RequestToPay
    console.log(`[mtn-momo] Requesting ${amount} UGX from ${msisdn}, ref: ${referenceId}`);

    const payRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': getTargetEnvironment(),
        'X-Callback-Url': callbackUrl,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'UGX',
        externalId: `2kai_${organizationId}_${Date.now()}`,
        payer: {
          partyIdType: 'MSISDN',
          partyId: msisdn,
        },
        payerMessage: `2K AI Accounting - ${planId} plan (${billingCycle})`,
        payeeNote: `Subscription: ${planId} ${billingCycle}`,
      }),
    });

    // MTN returns 202 Accepted (async processing)
    if (payRes.status !== 202 && payRes.status !== 200) {
      const errorText = await payRes.text();
      console.error('[mtn-momo] RequestToPay failed:', payRes.status, errorText);

      await supabase.from('payment_transactions').update({
        payment_status: 'failed',
        error_message: `MTN API error (${payRes.status}): ${errorText}`,
        updated_at: new Date().toISOString(),
      }).eq('transaction_ref', referenceId);

      throw new Error(`MTN MoMo payment request failed: ${errorText}`);
    }

    // Update to processing
    await supabase.from('payment_transactions').update({
      payment_status: 'processing',
      updated_at: new Date().toISOString(),
    }).eq('transaction_ref', referenceId);

    console.log('[mtn-momo] RequestToPay accepted, waiting for approval on phone');

    // Build redirect URL with reference for verification
    const redirectUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}` +
      `provider=mtn_momo&tx_ref=${referenceId}&plan=${planId}&cycle=${billingCycle}`;

    return new Response(JSON.stringify({
      status: 'success',
      txRef: referenceId,
      amount,
      currency: 'UGX',
      redirectUrl: '',  // No redirect — user approves on phone, then we verify
      message: `Payment request sent to ${msisdn}. Please check your phone and enter your MoMo PIN to approve.`,
      verifyUrl: redirectUrl,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[mtn-momo] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
