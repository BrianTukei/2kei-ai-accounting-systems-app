/**
 * paystack-checkout Edge Function
 * ────────────────────────────────
 * Creates a Paystack payment for Nigeria/Ghana markets.
 * Handles checkout initialization, transaction verification,
 * and subscription plan management.
 * After successful payment, auto-settles funds to owner's MoMo wallet.
 *
 * Actions:
 *   - checkout:     Initialize a new transaction
 *   - verify:       Verify a completed transaction and activate subscription
 *   - create-plan:  Create a recurring payment plan in Paystack
 *
 * Required env vars:
 *   - PAYSTACK_SECRET_KEY
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - FLUTTERWAVE_SECRET_KEY (for MoMo settlement)
 *   - OWNER_MOMO_NUMBER (optional, defaults to +256753634290)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  action?: 'checkout' | 'verify' | 'create-plan';
  organizationId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  // For verify action
  reference?: string;
}

// Plan pricing in NGN (kobo) – 1 NGN = 100 kobo
const PLAN_PRICES_KOBO: Record<string, Record<string, Record<string, number>>> = {
  NGN: {
    pro: {
      monthly: 29 * 100 * 1600,  // ~29 USD in kobo
      annual: 290 * 100 * 1600,
    },
    enterprise: {
      monthly: 79 * 100 * 1600,
      annual: 790 * 100 * 1600,
    },
  },
  GHS: {
    pro: {
      monthly: 29 * 100 * 15,  // ~29 USD in pesewas
      annual: 290 * 100 * 15,
    },
    enterprise: {
      monthly: 79 * 100 * 15,
      annual: 790 * 100 * 15,
    },
  },
  ZAR: {
    pro: {
      monthly: 29 * 100 * 19,
      annual: 290 * 100 * 19,
    },
    enterprise: {
      monthly: 79 * 100 * 19,
      annual: 790 * 100 * 19,
    },
  },
  KES: {
    pro: {
      monthly: 29 * 100 * 155,
      annual: 290 * 100 * 155,
    },
    enterprise: {
      monthly: 79 * 100 * 155,
      annual: 790 * 100 * 155,
    },
  },
  USD: {
    pro: {
      monthly: 29 * 100,
      annual: 290 * 100,
    },
    enterprise: {
      monthly: 79 * 100,
      annual: 790 * 100,
    },
  },
};

function getAmount(planId: string, billingCycle: string, currency: string): number {
  const curr = currency.toUpperCase();
  const prices = PLAN_PRICES_KOBO[curr] || PLAN_PRICES_KOBO.NGN;
  return prices[planId]?.[billingCycle] || 0;
}

// ── Owner settlement configuration ────────────
const OWNER_MOMO_NUMBER = '256753634290';       // +256753634290 (Uganda MTN)
const OWNER_MOMO_BANK   = 'MPS';                // Flutterwave bank code for Uganda Mobile Money
const OWNER_MOMO_NAME   = '2K AI Accounting';   // Beneficiary display name
const SETTLEMENT_CURRENCY = 'UGX';              // Settle in Ugandan Shillings

// Approx exchange rates for settlement conversion
const FX_RATES: Record<string, number> = {
  NGN: 1600, GHS: 15, KES: 155, ZAR: 19, UGX: 3800,
  USD: 1, EUR: 0.93, GBP: 0.80,
};

/**
 * Transfer collected payment to the owner's MTN MoMo wallet via Flutterwave.
 * Uses Flutterwave Transfer API even for Paystack payments because
 * Paystack doesn't natively support UG MoMo transfers.
 * Failures are logged but don't block subscription activation.
 */
async function settleToOwnerMoMo(
  paidAmount: number,  // in main currency unit (not kobo)
  paidCurrency: string,
  reference: string,
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<void> {
  try {
    const flutterwaveKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!flutterwaveKey) {
      console.log('[settlement] FLUTTERWAVE_SECRET_KEY not set, skipping MoMo settlement');
      return;
    }

    const settlePhone = Deno.env.get('OWNER_MOMO_NUMBER') || OWNER_MOMO_NUMBER;

    // Convert to UGX
    const fromRate = FX_RATES[paidCurrency.toUpperCase()] || 1;
    const toRate   = FX_RATES[SETTLEMENT_CURRENCY] || 3800;
    const settleAmount = Math.round((paidAmount / fromRate) * toRate);

    console.log(`[settlement] Transferring ${settleAmount} ${SETTLEMENT_CURRENCY} to MoMo ${settlePhone}`);

    const transferRes = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: OWNER_MOMO_BANK,
        account_number: settlePhone,
        amount: settleAmount,
        currency: SETTLEMENT_CURRENCY,
        narration: `Ledgerly subscription — ${reference}`,
        beneficiary_name: OWNER_MOMO_NAME,
        reference: `settle_ps_${reference}`,
        debit_currency: paidCurrency.toUpperCase(),
        meta: [
          { sender: 'Ledgerly', sender_country: 'UG', mobile_number: settlePhone },
        ],
      }),
    });

    const transferResult = await transferRes.json();
    console.log('[settlement] Transfer result:', transferResult.status, transferResult.message);

    await supabase.from('billing_events').insert({
      organization_id: orgId,
      type: 'owner_settlement',
      provider: 'paystack_to_momo',
      metadata: {
        settle_to: settlePhone,
        amount: settleAmount,
        currency: SETTLEMENT_CURRENCY,
        original_amount: paidAmount,
        original_currency: paidCurrency,
        reference,
        transfer_status: transferResult.status,
        transfer_message: transferResult.message,
        transfer_id: transferResult.data?.id,
      },
    });
  } catch (err) {
    console.error('[settlement] MoMo transfer failed (non-critical):', err);
  }
}

// Helper to call Paystack API
async function paystackFetch(
  endpoint: string,
  secretKey: string,
  method: string = 'GET',
  body?: object,
): Promise<any> {
  const res = await fetch(`https://api.paystack.co${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    const action = body.action || 'checkout';

    // ── Verify Transaction ────────────────────────

    if (action === 'verify') {
      const { reference, organizationId } = body;

      if (!reference) {
        throw new Error('Transaction reference is required for verification');
      }

      // Verify with Paystack
      const verifyResult = await paystackFetch(
        `/transaction/verify/${reference}`,
        paystackKey
      );

      if (!verifyResult.status || verifyResult.data?.status !== 'success') {
        // Update payment as failed
        await supabase
          .from('payment_transactions')
          .update({
            payment_status: 'failed',
            error_message: verifyResult.message || 'Payment verification failed',
            updated_at: new Date().toISOString(),
          })
          .eq('transaction_ref', reference);

        throw new Error(verifyResult.message || 'Payment verification failed');
      }

      const txData = verifyResult.data;
      const meta = txData.metadata || {};
      const orgId = meta.organization_id || organizationId;
      const planId = meta.plan_id || body.planId;
      const billingCycle = meta.billing_cycle || body.billingCycle;

      // Verify expected amount (within 5% tolerance for exchange rate changes)
      const expectedAmount = getAmount(planId, billingCycle, txData.currency);
      if (txData.amount < expectedAmount * 0.95) {
        throw new Error(
          `Payment amount mismatch: paid ${txData.amount}, expected ~${expectedAmount}`
        );
      }

      // Calculate period dates
      const periodStart = new Date().toISOString();
      const periodEnd = new Date();
      if (billingCycle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Activate subscription in database
      await supabase
        .from('subscriptions')
        .upsert({
          organization_id: orgId,
          plan_id: planId,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'paystack',
          stripe_subscription_id: txData.authorization?.authorization_code || reference,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

      // Update payment transaction
      await supabase
        .from('payment_transactions')
        .update({
          payment_status: 'completed',
          webhook_verified: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_ref', reference);

      // Log billing event
      await supabase.from('billing_events').insert({
        organization_id: orgId,
        type: 'payment_succeeded',
        provider: 'paystack',
        metadata: {
          reference: txData.reference,
          amount: txData.amount / 100, // convert from kobo
          currency: txData.currency,
          plan_id: planId,
          billing_cycle: billingCycle,
          customer_email: txData.customer?.email,
          authorization_code: txData.authorization?.authorization_code,
          channel: txData.channel,
          ip_address: txData.ip_address,
        },
      });

      // Auto-settle to owner's MTN MoMo wallet
      await settleToOwnerMoMo(
        txData.amount / 100, // convert kobo → main unit
        txData.currency,
        txData.reference || reference,
        supabase,
        orgId,
      );

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          planId,
          billingCycle,
          periodEnd: periodEnd.toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Create Plan (for recurring subscriptions) ─

    if (action === 'create-plan') {
      const { planId, billingCycle, currency } = body;
      const amount = getAmount(planId, billingCycle, currency);
      const interval = billingCycle === 'annual' ? 'annually' : 'monthly';

      const planResult = await paystackFetch('/plan', paystackKey, 'POST', {
        name: `Ledgerly ${planId.charAt(0).toUpperCase() + planId.slice(1)} - ${billingCycle}`,
        amount,
        interval,
        currency: currency || 'NGN',
        description: `Ledgerly ${planId} plan, billed ${billingCycle}`,
      });

      if (!planResult.status) {
        throw new Error(planResult.message || 'Failed to create Paystack plan');
      }

      return new Response(
        JSON.stringify({
          success: true,
          planCode: planResult.data.plan_code,
          planId: planResult.data.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Initialize Checkout ───────────────────────

    const { organizationId, planId, billingCycle, email, currency, successUrl } = body;

    if (!organizationId || !planId || !billingCycle || !email) {
      throw new Error('Missing required fields: organizationId, planId, billingCycle, email');
    }

    if (planId === 'free' || !getAmount(planId, billingCycle, currency || 'NGN')) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const targetCurrency = currency || 'NGN';
    const amount = getAmount(planId, billingCycle, targetCurrency);
    const reference = `led_${organizationId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create payment transaction record
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: amount / 100, // store in main currency unit
      currency: targetCurrency,
      payment_provider: 'paystack',
      payment_status: 'pending',
      transaction_ref: reference,
    });

    // Build callback URL with reference
    const callbackUrl = new URL(successUrl);
    callbackUrl.searchParams.set('reference', reference);
    callbackUrl.searchParams.set('provider', 'paystack');
    callbackUrl.searchParams.set('plan', planId);

    // Initialize Paystack transaction
    const result = await paystackFetch('/transaction/initialize', paystackKey, 'POST', {
      email,
      amount,
      currency: targetCurrency,
      reference,
      callback_url: callbackUrl.toString(),
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: `${planId.charAt(0).toUpperCase() + planId.slice(1)} (${billingCycle})`,
          },
        ],
      },
    });

    if (!result.status) {
      // Update payment as failed
      await supabase
        .from('payment_transactions')
        .update({
          payment_status: 'failed',
          error_message: result.message || 'Failed to initialize payment',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_ref', reference);

      throw new Error(result.message || 'Failed to initialize payment');
    }

    // Update to processing status
    await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_ref', reference);

    return new Response(
      JSON.stringify({
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference,
        amount: amount / 100,
        currency: targetCurrency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Paystack checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
