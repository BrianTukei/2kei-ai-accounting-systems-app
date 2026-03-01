/**
 * mobile-money-checkout Edge Function
 * ────────────────────────────────────
 * Handles MTN Mobile Money and Airtel Money payments via Flutterwave's
 * direct charge API for mobile money.
 * After successful payment, auto-settles funds to owner's MoMo wallet.
 *
 * Actions:
 *   - checkout:  Initiate a mobile money charge (sends USSD push to phone)
 *   - verify:    Verify a completed mobile money transaction
 *
 * Supported networks:  MTN, AIRTEL
 * Supported currencies: UGX, GHS, RWF, XOF, XAF, KES, TZS, ZMW
 *
 * Required env vars:
 *   - FLUTTERWAVE_SECRET_KEY
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - OWNER_MOMO_NUMBER (optional, defaults to +256753634290)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MomoCheckoutRequest {
  action?: 'checkout' | 'verify';
  organizationId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  currency: string;
  phoneNumber?: string;
  network?: 'MTN' | 'AIRTEL';
  chargeType?: string; // e.g. mobile_money_uganda
  successUrl: string;
  cancelUrl: string;
  // For verify
  txRef?: string;
  transactionId?: string;
}

// Plan pricing in USD
const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 29, annual: 290 },
  enterprise: { monthly: 79, annual: 790 },
};

// Approximate exchange rates
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  UGX: 3800, RWF: 1300, GHS: 15, KES: 155,
  TZS: 2700, XOF: 620,  XAF: 620, ZMW: 25,
  MWK: 1700, NGN: 1600, ZAR: 19,
  USD: 1, EUR: 0.93, GBP: 0.80,
};

function getLocalAmount(usdAmount: number, currency: string): number {
  const m = CURRENCY_MULTIPLIERS[currency.toUpperCase()] || 1;
  return Math.round(usdAmount * m * 100) / 100;
}

// ── Owner settlement configuration ────────────
// After each verified payment, funds are auto-transferred to the owner's MoMo wallet.
const OWNER_MOMO_NUMBER = '256753634290';       // +256753634290 (Uganda MTN)
const OWNER_MOMO_BANK   = 'MPS';                // Flutterwave bank code for Uganda Mobile Money
const OWNER_MOMO_NAME   = '2K AI Accounting';   // Beneficiary display name
const SETTLEMENT_CURRENCY = 'UGX';              // Settle in Ugandan Shillings

/**
 * Transfer collected payment to the owner's MTN MoMo wallet via Flutterwave.
 * Failures are logged but don't block subscription activation.
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

    await supabase.from('billing_events').insert({
      organization_id: orgId,
      type: 'owner_settlement',
      provider: 'mtn_momo',
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
    console.error('[settlement] MoMo transfer failed (non-critical):', err);
  }
}

/**
 * Map currency → Flutterwave mobile money charge type
 */
function resolveChargeType(currency: string, override?: string): string {
  if (override) return override;
  switch (currency.toUpperCase()) {
    case 'UGX': return 'mobile_money_uganda';
    case 'GHS': return 'mobile_money_ghana';
    case 'XOF':
    case 'XAF': return 'mobile_money_franco';
    case 'RWF': return 'mobile_money_rwanda';
    case 'ZMW': return 'mobile_money_zambia';
    case 'KES': return 'mpesa';
    case 'TZS': return 'mobile_money_tanzania';
    default:    return 'mobile_money_uganda';
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

    const body: MomoCheckoutRequest = await req.json();
    const action = body.action || 'checkout';

    // ── Verify Transaction ────────────────────────

    if (action === 'verify') {
      const { txRef, transactionId, organizationId } = body;

      if (!txRef && !transactionId) {
        throw new Error('txRef or transactionId is required for verification');
      }

      const verifyUrl = transactionId
        ? `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`;

      const verifyRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${flutterwaveKey}` },
      });
      const verifyResult = await verifyRes.json();

      if (verifyResult.status !== 'success' || verifyResult.data?.status !== 'successful') {
        if (txRef) {
          await supabase.from('payment_transactions').update({
            payment_status: 'failed',
            error_message: verifyResult.message || 'Mobile money verification failed',
            updated_at: new Date().toISOString(),
          }).eq('transaction_ref', txRef);
        }
        throw new Error(verifyResult.message || 'Mobile money payment verification failed');
      }

      const txData = verifyResult.data;
      const meta = txData.meta || {};
      const orgId = meta.organization_id || organizationId;
      const planId = meta.plan_id || body.planId;
      const billingCycle = meta.billing_cycle || body.billingCycle;
      const network = meta.network || body.network || 'MTN';

      // Verify amount
      const expectedUsd = PLAN_PRICES[planId]?.[billingCycle];
      if (expectedUsd) {
        const expectedLocal = getLocalAmount(expectedUsd, txData.currency);
        if (txData.amount < expectedLocal * 0.95) {
          throw new Error(
            `Amount mismatch: paid ${txData.amount} ${txData.currency}, expected ~${expectedLocal}`
          );
        }
      }

      // Calculate period dates
      const periodStart = new Date().toISOString();
      const periodEnd = new Date();
      if (billingCycle === 'annual') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      const providerName = network === 'AIRTEL' ? 'airtel_money' : 'mtn_momo';

      // Activate subscription
      await supabase.from('subscriptions').upsert({
        organization_id: orgId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: providerName,
        stripe_subscription_id: String(txData.id),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' });

      // Update payment transaction
      if (txRef || txData.tx_ref) {
        await supabase.from('payment_transactions').update({
          payment_status: 'completed',
          webhook_verified: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('transaction_ref', txRef || txData.tx_ref);
      }

      // Log billing event
      await supabase.from('billing_events').insert({
        organization_id: orgId,
        type: 'payment_succeeded',
        provider: providerName,
        metadata: {
          transaction_id: txData.id,
          tx_ref: txData.tx_ref,
          amount: txData.amount,
          currency: txData.currency,
          plan_id: planId,
          billing_cycle: billingCycle,
          network,
          phone: txData.meta?.phone_number,
          customer_email: txData.customer?.email,
          flw_ref: txData.flw_ref,
        },
      });

      // Auto-settle to owner's MTN MoMo wallet
      await settleToOwnerMoMo(
        flutterwaveKey, txData.amount, txData.currency,
        txData.tx_ref || txRef, supabase, orgId,
      );

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        planId,
        billingCycle,
        periodEnd: periodEnd.toISOString(),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Initiate Mobile Money Charge ──────────────

    const {
      organizationId, planId, billingCycle, email,
      currency, phoneNumber, network, successUrl, cancelUrl, chargeType,
    } = body;

    if (!organizationId || !planId || !billingCycle || !email) {
      throw new Error('Missing required fields: organizationId, planId, billingCycle, email');
    }
    if (!phoneNumber) {
      throw new Error('Phone number is required for mobile money payments');
    }
    if (planId === 'free' || !PLAN_PRICES[planId]) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const targetCurrency = currency || 'UGX';
    const usdAmount = PLAN_PRICES[planId][billingCycle];
    const localAmount = getLocalAmount(usdAmount, targetCurrency);
    const momoChargeType = resolveChargeType(targetCurrency, chargeType);
    const txRef = `momo_${organizationId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const providerTag = (network || 'MTN') === 'AIRTEL' ? 'airtel_money' : 'mtn_momo';

    // Record pending payment
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: localAmount,
      currency: targetCurrency,
      payment_provider: providerTag,
      payment_status: 'pending',
      transaction_ref: txRef,
    });

    // Build Flutterwave mobile money charge request
    const chargeBody: Record<string, unknown> = {
      tx_ref: txRef,
      amount: localAmount,
      currency: targetCurrency,
      email,
      phone_number: phoneNumber,
      network: network || 'MTN',
      redirect_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}tx_ref=${txRef}&provider=${providerTag}&plan=${planId}`,
      meta: {
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        network: network || 'MTN',
        phone_number: phoneNumber,
      },
    };

    // For Francophone mobile money (XOF/XAF), Flutterwave requires `order_id` instead of `network`
    if (momoChargeType === 'mobile_money_franco') {
      chargeBody.order_id = txRef;
    }

    const chargeUrl = `https://api.flutterwave.com/v3/charges?type=${momoChargeType}`;
    console.log(`[mobile-money-checkout] Charging via ${momoChargeType}, amount: ${localAmount} ${targetCurrency}, phone: ${phoneNumber}`);

    const response = await fetch(chargeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargeBody),
    });

    const result = await response.json();

    if (result.status !== 'success') {
      await supabase.from('payment_transactions').update({
        payment_status: 'failed',
        error_message: result.message || 'Mobile money charge initiation failed',
        updated_at: new Date().toISOString(),
      }).eq('transaction_ref', txRef);

      throw new Error(result.message || 'Failed to initiate mobile money charge');
    }

    // Update payment to processing
    await supabase.from('payment_transactions').update({
      payment_status: 'processing',
      updated_at: new Date().toISOString(),
    }).eq('transaction_ref', txRef);

    // Mobile money charges may return a redirect URL or just a pending status
    // (the user receives a USSD push on their phone)
    const redirectUrl = result.meta?.authorization?.redirect || result.data?.link || '';

    return new Response(JSON.stringify({
      status: result.status,
      txRef,
      amount: localAmount,
      currency: targetCurrency,
      redirectUrl,
      message: result.data?.processor_response
        || result.message
        || 'Please approve the payment prompt on your phone',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Mobile money checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
