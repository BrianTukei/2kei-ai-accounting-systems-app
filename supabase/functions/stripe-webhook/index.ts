/**
 * stripe-webhook Edge Function
 * Handles Stripe webhook events for subscription updates.
 * After successful checkout, auto-settles funds to owner's MoMo wallet.
 * 
 * Required env vars:
 *   - STRIPE_WEBHOOK_SECRET
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - FLUTTERWAVE_SECRET_KEY  (for MoMo settlement)
 *   - OWNER_MOMO_NUMBER       (optional, defaults to 256753634290)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Owner MoMo settlement config ─────────────────────────────────────
const OWNER_MOMO_NUMBER = Deno.env.get('OWNER_MOMO_NUMBER') || '256753634290';
const OWNER_MOMO_BANK   = 'MPS';          // Uganda Mobile Money (Flutterwave code)
const SETTLEMENT_CURRENCY = 'UGX';

// Rough FX → UGX (used only when Stripe charges in non-UGX currency)
const FX_RATES: Record<string, number> = {
  USD: 3750,
  EUR: 4100,
  GBP: 4750,
  KES: 29,
  NGN: 2.3,
  GHS: 250,
  ZAR: 200,
  UGX: 1,
};

/**
 * After a successful payment, transfer the funds to the owner's MTN MoMo
 * wallet via the Flutterwave Transfer API.  Failures are logged but never
 * block the webhook response so Stripe doesn't retry.
 */
async function settleToOwnerMoMo(
  amount: number,
  currency: string,
  reference: string,
  supabase: any,
  organizationId?: string,
) {
  try {
    const flwSecret = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!flwSecret) {
      console.warn('[settlement] FLUTTERWAVE_SECRET_KEY not set – skipping MoMo settlement');
      return;
    }

    const cur = currency.toUpperCase();
    const rate = FX_RATES[cur] ?? FX_RATES['USD'];
    const ugxAmount = cur === 'UGX' ? amount : Math.round(amount * rate);

    console.log(`[settlement] Transferring UGX ${ugxAmount} (from ${amount} ${cur}) → MoMo ${OWNER_MOMO_NUMBER}`);

    const res = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: OWNER_MOMO_BANK,
        account_number: OWNER_MOMO_NUMBER,
        amount: ugxAmount,
        currency: SETTLEMENT_CURRENCY,
        narration: `2K AI settlement – ${reference}`,
        beneficiary_name: '2K AI Accounting',
        reference: `settle_stripe_${reference}_${Date.now()}`,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook`,
        meta: [{ key: 'source', value: 'stripe-webhook' }],
      }),
    });

    const data = await res.json();
    console.log('[settlement] Flutterwave transfer response:', data.status, data.message);

    // Log settlement attempt
    if (organizationId) {
      await supabase.from('billing_events').insert({
        organization_id: organizationId,
        type: 'owner_settlement',
        amount: ugxAmount,
        currency: SETTLEMENT_CURRENCY,
        provider: 'flutterwave_transfer',
        provider_event_id: data.data?.id?.toString() || reference,
        metadata: {
          original_amount: amount,
          original_currency: cur,
          momo_number: OWNER_MOMO_NUMBER,
          transfer_status: data.status,
          source_provider: 'stripe',
        },
      });
    }
  } catch (err) {
    console.error('[settlement] MoMo settlement failed (non-blocking):', err);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSignature = req.headers.get('stripe-signature');
    
    if (!webhookSecret || !stripeSignature) {
      throw new Error('Missing webhook configuration');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    
    // Verify Stripe signature using HMAC-SHA256
    const sigHeader = stripeSignature!;
    const elements = sigHeader.split(',');
    const timestamp = elements.find((e: string) => e.startsWith('t='))?.slice(2);
    const signature = elements.find((e: string) => e.startsWith('v1='))?.slice(3);

    if (!timestamp || !signature) {
      throw new Error('Invalid Stripe signature format');
    }

    // Reject old events (> 5 minutes) to prevent replay attacks
    const tolerance = 300;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) {
      throw new Error('Stripe webhook timestamp too old');
    }

    const signedPayload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSig !== signature) {
      throw new Error('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(body);

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const organizationId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;
        const billingCycle = session.metadata?.billing_cycle;
        
        if (organizationId && planId) {
          // Calculate period end based on billing cycle
          const periodEnd = new Date();
          if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Create or update subscription
          await supabase.from('subscriptions').upsert({
            organization_id: organizationId,
            plan_id: planId,
            status: 'active',
            billing_cycle: billingCycle || 'monthly',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            payment_provider: 'stripe',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          }, { onConflict: 'organization_id' });

          // Log billing event
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            type: 'payment_succeeded',
            amount: session.amount_total / 100,
            currency: session.currency?.toUpperCase(),
            provider: 'stripe',
            provider_event_id: event.id,
          });

          // Auto-settle to owner MoMo wallet
          await settleToOwnerMoMo(
            session.amount_total / 100,
            session.currency || 'USD',
            event.id,
            supabase,
            organizationId,
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const organizationId = subscription.metadata?.organization_id;
        
        if (organizationId) {
          await supabase.from('subscriptions').update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await supabase.from('subscriptions').update({
          status: 'canceled',
          plan_id: 'free',
        }).eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('organization_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (sub) {
            await supabase.from('subscriptions').update({
              status: 'past_due',
            }).eq('stripe_subscription_id', subscriptionId);

            await supabase.from('billing_events').insert({
              organization_id: sub.organization_id,
              type: 'payment_failed',
              amount: invoice.amount_due / 100,
              currency: invoice.currency?.toUpperCase(),
              provider: 'stripe',
              provider_event_id: event.id,
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
