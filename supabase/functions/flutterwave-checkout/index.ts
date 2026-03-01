/**
 * flutterwave-checkout Edge Function
 * ───────────────────────────────────
 * Creates a Flutterwave payment link for African markets (NGN, GHS, KES, ZAR, etc.)
 * Handles both initial checkout and payment verification callbacks.
 * After successful payment, auto-settles funds to owner's MoMo wallet.
 *
 * Actions:
 *   - checkout:  Create a new payment link
 *   - verify:    Verify a completed transaction and activate subscription
 *
 * Required env vars:
 *   - FLUTTERWAVE_SECRET_KEY
 *   - FLUTTERWAVE_WEBHOOK_SECRET  (for webhook hash verification)
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - OWNER_MOMO_NUMBER (optional, defaults to +256753634290)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  action?: 'checkout' | 'verify';
  organizationId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  // For verify action
  transactionId?: string;
  txRef?: string;
}

// Plan pricing in USD — converted by Flutterwave based on currency
const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro: {
    monthly: 29,
    annual: 290,
  },
  enterprise: {
    monthly: 79,
    annual: 790,
  },
};

// Currency-specific exchange rates (approximate, Flutterwave handles actual conversion)
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  NGN: 1600,
  GHS: 15,
  KES: 155,
  ZAR: 19,
  TZS: 2700,
  UGX: 3800,
  RWF: 1300,
  XOF: 620,
  XAF: 620,
  ETB: 57,
  EGP: 50,
  MAD: 10,
  USD: 1,
  EUR: 0.93,
  GBP: 0.80,
};

function getLocalAmount(usdAmount: number, currency: string): number {
  const multiplier = CURRENCY_MULTIPLIERS[currency.toUpperCase()] || 1;
  return Math.round(usdAmount * multiplier * 100) / 100;
}

// ── Owner settlement configuration ────────────
// After each verified payment, funds are auto-transferred to the owner's MoMo wallet.
const OWNER_MOMO_NUMBER = '256753634290';       // +256753634290 (Uganda MTN)
const OWNER_MOMO_BANK   = 'MPS';                // Flutterwave bank code for Uganda Mobile Money
const OWNER_MOMO_NAME   = '2K AI Accounting';   // Beneficiary display name
const SETTLEMENT_CURRENCY = 'UGX';              // Settle in Ugandan Shillings

/**
 * Transfer collected payment to the owner's MTN MoMo wallet via Flutterwave.
 * This runs after successful payment verification — failures are logged but
 * don't block the user's subscription activation.
 */
async function settleToOwnerMoMo(
  flutterwaveKey: string,
  amount: number,
  currency: string,
  txRef: string,
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<void> {
  try {
    const settlePhone = Deno.env.get('OWNER_MOMO_NUMBER') || OWNER_MOMO_NUMBER;

    // Convert to UGX if paid in a different currency
    let settleAmount = amount;
    if (currency.toUpperCase() !== SETTLEMENT_CURRENCY) {
      const fromRate = CURRENCY_MULTIPLIERS[currency.toUpperCase()] || 1;
      const toRate   = CURRENCY_MULTIPLIERS[SETTLEMENT_CURRENCY] || 3800;
      settleAmount = Math.round((amount / fromRate) * toRate);
    }

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
        narration: `2K AI Accounting subscription — ${txRef}`,
        beneficiary_name: OWNER_MOMO_NAME,
        reference: `settle_${txRef}`,
        debit_currency: currency.toUpperCase(),
        meta: [
          { sender: '2K AI Accounting', sender_country: 'UG', mobile_number: settlePhone },
        ],
      }),
    });

    const transferResult = await transferRes.json();
    console.log('[settlement] Transfer result:', transferResult.status, transferResult.message);

    // Log the settlement event
    await supabase.from('billing_events').insert({
      organization_id: orgId,
      type: 'owner_settlement',
      provider: 'flutterwave',
      metadata: {
        settle_to: settlePhone,
        amount: settleAmount,
        currency: SETTLEMENT_CURRENCY,
        original_amount: amount,
        original_currency: currency,
        tx_ref: txRef,
        transfer_status: transferResult.status,
        transfer_message: transferResult.message,
        transfer_id: transferResult.data?.id,
      },
    });
  } catch (err) {
    // Settlement failure should NOT break the subscription activation
    console.error('[settlement] MoMo transfer failed (non-critical):', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flutterwaveKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!flutterwaveKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    const action = body.action || 'checkout';

    // ── Verify Transaction ────────────────────────

    if (action === 'verify') {
      const { transactionId, txRef, organizationId } = body;

      if (!transactionId && !txRef) {
        throw new Error('transactionId or txRef is required for verification');
      }

      // Verify with Flutterwave API
      const verifyUrl = transactionId
        ? `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`;

      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${flutterwaveKey}` },
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.status !== 'success' || verifyResult.data?.status !== 'successful') {
        // Update payment transaction as failed
        if (txRef) {
          await supabase
            .from('payment_transactions')
            .update({
              payment_status: 'failed',
              error_message: verifyResult.message || 'Payment verification failed',
              updated_at: new Date().toISOString(),
            })
            .eq('transaction_ref', txRef);
        }
        throw new Error(verifyResult.message || 'Payment verification failed');
      }

      const txData = verifyResult.data;

      // Extract metadata
      const meta = txData.meta || {};
      const orgId = meta.organization_id || organizationId;
      const planId = meta.plan_id || body.planId;
      const billingCycle = meta.billing_cycle || body.billingCycle;

      // Verify amount matches expected plan price
      const expectedAmount = PLAN_PRICES[planId]?.[billingCycle];
      const paidCurrency = txData.currency;
      const expectedLocal = getLocalAmount(expectedAmount, paidCurrency);

      // Allow 5% tolerance for exchange rate fluctuations
      if (txData.amount < expectedLocal * 0.95) {
        throw new Error(
          `Payment amount mismatch: paid ${txData.amount} ${paidCurrency}, expected ~${expectedLocal} ${paidCurrency}`
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
          payment_provider: 'flutterwave',
          stripe_subscription_id: String(txData.id), // store Flutterwave tx ID
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

      // Update payment transaction record
      if (txRef || txData.tx_ref) {
        await supabase
          .from('payment_transactions')
          .update({
            payment_status: 'completed',
            webhook_verified: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('transaction_ref', txRef || txData.tx_ref);
      }

      // Log billing event
      await supabase.from('billing_events').insert({
        organization_id: orgId,
        type: 'payment_succeeded',
        provider: 'flutterwave',
        metadata: {
          transaction_id: txData.id,
          tx_ref: txData.tx_ref,
          amount: txData.amount,
          currency: txData.currency,
          plan_id: planId,
          billing_cycle: billingCycle,
          customer_email: txData.customer?.email,
          flw_ref: txData.flw_ref,
        },
      });

      // Auto-settle to owner's MTN MoMo wallet
      await settleToOwnerMoMo(
        flutterwaveKey, txData.amount, txData.currency,
        txData.tx_ref || txRef, supabase, orgId,
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

    // ── Create Checkout ───────────────────────────

    const { organizationId, planId, billingCycle, email, currency, successUrl, cancelUrl } = body;

    if (!organizationId || !planId || !billingCycle || !email) {
      throw new Error('Missing required fields: organizationId, planId, billingCycle, email');
    }

    if (planId === 'free' || !PLAN_PRICES[planId]) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const usdAmount = PLAN_PRICES[planId][billingCycle];
    const targetCurrency = currency || 'NGN';
    const localAmount = getLocalAmount(usdAmount, targetCurrency);
    const txRef = `led_${organizationId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create payment transaction record in DB
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: localAmount,
      currency: targetCurrency,
      payment_provider: 'flutterwave',
      payment_status: 'pending',
      transaction_ref: txRef,
    }).select('id').single();

    // Build success URL with tx_ref for verification
    const successUrlWithRef = new URL(successUrl);
    successUrlWithRef.searchParams.set('tx_ref', txRef);
    successUrlWithRef.searchParams.set('provider', 'flutterwave');
    successUrlWithRef.searchParams.set('plan', planId);

    // Create Flutterwave payment link
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: localAmount,
        currency: targetCurrency,
        redirect_url: successUrlWithRef.toString(),
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customer: {
          email,
          name: email.split('@')[0],
        },
        meta: {
          organization_id: organizationId,
          plan_id: planId,
          billing_cycle: billingCycle,
        },
        customizations: {
          title: '2K AI Accounting Subscription',
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - ${billingCycle} billing`,
          logo: 'https://2kai-accounting.com/logo.png',
        },
      }),
    });

    const result = await response.json();

    if (result.status !== 'success') {
      // Update payment as failed
      await supabase
        .from('payment_transactions')
        .update({
          payment_status: 'failed',
          error_message: result.message || 'Failed to create payment link',
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_ref', txRef);

      throw new Error(result.message || 'Failed to create payment link');
    }

    // Update payment transaction to processing
    await supabase
      .from('payment_transactions')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_ref', txRef);

    return new Response(
      JSON.stringify({
        link: result.data.link,
        txRef,
        amount: localAmount,
        currency: targetCurrency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Flutterwave checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
