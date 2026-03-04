/**
 * stripe-webhook Edge Function (Production-Grade)
 * ────────────────────────────────────────────────
 * Handles ALL Stripe webhook events for the billing system.
 *
 * Events handled:
 *   - checkout.session.completed   → Activate subscription
 *   - invoice.payment_succeeded    → Renew / confirm payment
 *   - invoice.payment_failed       → Mark past_due, restrict access
 *   - customer.subscription.deleted → Cancel & downgrade to Free
 *   - customer.subscription.updated → Sync status changes
 *   - customer.subscription.trial_will_end → Notify upcoming charge
 *
 * Security:
 *   - HMAC-SHA256 webhook signature verification
 *   - Replay attack protection (5-minute tolerance)
 *   - Idempotent event processing (webhook_events table)
 *   - Raw body parsing for signature verification
 *
 * After successful payment, auto-settles funds to owner's
 * MoMo wallet via Flutterwave Transfer API.
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   FLUTTERWAVE_SECRET_KEY  (for MoMo settlement)
 *   OWNER_MOMO_NUMBER       (optional, defaults to 256753634290)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Owner MoMo settlement config ─────────────────────────────────────
const OWNER_MOMO_NUMBER = Deno.env.get('OWNER_MOMO_NUMBER') || '256753634290';
const OWNER_MOMO_BANK   = 'MPS';
const SETTLEMENT_CURRENCY = 'UGX';

const FX_RATES: Record<string, number> = {
  USD: 3750, EUR: 4100, GBP: 4750, KES: 29,
  NGN: 2.3,  GHS: 250,  ZAR: 200,  UGX: 1,
};

// ── Plan usage limits (kept in sync with plans.ts) ───────────────────
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free:       { invoices: 10, ai_queries: 20, team_members: 1, storage_mb: 100, reports: 3, bank_imports: 2 },
  pro:        { invoices: -1, ai_queries: 200, team_members: 5, storage_mb: 5120, reports: -1, bank_imports: 20 },
  enterprise: { invoices: -1, ai_queries: -1, team_members: -1, storage_mb: -1, reports: -1, bank_imports: -1 },
};

// ── Settlement helper ────────────────────────────────────────────────
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

// ── Stripe API helper ────────────────────────────────────────────────
async function stripeGet(endpoint: string, stripeKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` },
  });
  return res.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, supabaseKey);
  const stripeKey   = Deno.env.get('STRIPE_SECRET_KEY') || '';

  try {
    const webhookSecret  = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSignature = req.headers.get('stripe-signature');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }
    if (!stripeSignature) {
      throw new Error('Missing stripe-signature header');
    }

    // ── 1. Read raw body for signature verification ──────
    const body = await req.text();

    // ── 2. Verify Stripe webhook signature (HMAC-SHA256) ─
    const elements  = stripeSignature.split(',');
    const timestamp = elements.find((e: string) => e.startsWith('t='))?.slice(2);
    const signature = elements.find((e: string) => e.startsWith('v1='))?.slice(3);

    if (!timestamp || !signature) {
      throw new Error('Invalid Stripe signature format');
    }

    // Reject events older than 5 minutes (replay protection)
    const tolerance = 300;
    const eventAge = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (eventAge > tolerance) {
      console.error(`[webhook] Event age ${eventAge}s exceeds ${tolerance}s tolerance`);
      throw new Error('Stripe webhook timestamp too old – possible replay attack');
    }

    // HMAC-SHA256 verification
    const signedPayload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSig !== signature) {
      console.error('[webhook] Signature mismatch');
      throw new Error('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(body);
    console.log(`[webhook] Processing: ${event.type} (${event.id})`);

    // ── 3. Idempotency check ─────────────────────────────
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', event.id)
      .single();

    if (existingEvent?.processed) {
      console.log(`[webhook] Event ${event.id} already processed – skipping`);
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Record event for idempotency
    if (!existingEvent) {
      await supabase.from('webhook_events').insert({
        provider: 'stripe',
        event_id: event.id,
        event_type: event.type,
        processed: false,
        payload: event,
      });
    }

    // ── 4. Handle events ─────────────────────────────────
    try {
      switch (event.type) {

        // ────────────────────────────────────────────────
        // CHECKOUT COMPLETED → Activate subscription
        // ────────────────────────────────────────────────
        case 'checkout.session.completed': {
          const session = event.data.object;
          const organizationId = session.metadata?.organization_id;
          const planId         = session.metadata?.plan_id    || 'pro';
          const billingCycle   = session.metadata?.billing_cycle || 'monthly';
          const txRef          = session.metadata?.tx_ref;

          if (!organizationId) {
            console.error('[webhook] checkout.session.completed missing organization_id');
            break;
          }

          // Calculate period
          const now = new Date();
          const periodEnd = new Date(now);
          if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Check if Stripe subscription has a trial
          let trialEnd: string | null = null;
          let trialStart: string | null = null;
          let subStatus: string = 'active';

          if (session.subscription && stripeKey) {
            const stripeSub = await stripeGet(`/subscriptions/${session.subscription}`, stripeKey);
            if (stripeSub.trial_end) {
              trialEnd = new Date(stripeSub.trial_end * 1000).toISOString();
              trialStart = new Date(stripeSub.trial_start * 1000).toISOString();
              subStatus = 'trialing';
            }
            if (stripeSub.current_period_end) {
              periodEnd.setTime(stripeSub.current_period_end * 1000);
            }
          }

          // Get usage limits for the plan
          const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

          // Upsert subscription
          const { error: subErr } = await supabase.from('subscriptions').upsert({
            organization_id:      organizationId,
            plan_id:              planId,
            status:               subStatus,
            billing_cycle:        billingCycle,
            stripe_customer_id:   session.customer,
            stripe_subscription_id: session.subscription,
            payment_provider:     'stripe',
            current_period_start: now.toISOString(),
            current_period_end:   periodEnd.toISOString(),
            trial_start_date:     trialStart,
            trial_ends_at:        trialEnd,
            cancel_at_period_end: false,
            usage_limits:         limits,
            usage_counters:       { invoices: 0, ai_queries: 0, team_members: 0, storage_mb: 0, reports: 0, bank_imports: 0 },
            updated_at:           now.toISOString(),
          }, { onConflict: 'organization_id' });

          if (subErr) {
            console.error('[webhook] Subscription upsert error:', subErr);
          }

          // Update payment method info
          if (session.payment_intent && stripeKey) {
            try {
              const pi = await stripeGet(`/payment_intents/${session.payment_intent}`, stripeKey);
              if (pi.payment_method) {
                const pm = await stripeGet(`/payment_methods/${pi.payment_method}`, stripeKey);
                if (pm.card) {
                  await supabase.from('subscriptions').update({
                    payment_method_last4: pm.card.last4,
                    payment_method_brand: pm.card.brand,
                  }).eq('organization_id', organizationId);
                }
              }
            } catch (e) {
              console.warn('[webhook] Could not fetch payment method:', e);
            }
          }

          // Log billing event
          await supabase.from('billing_events').insert({
            organization_id: organizationId,
            type: subStatus === 'trialing' ? 'trial_started' : 'payment_succeeded',
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            provider: 'stripe',
            provider_event_id: event.id,
            metadata: {
              plan_id: planId,
              billing_cycle: billingCycle,
              stripe_session_id: session.id,
              stripe_subscription_id: session.subscription,
              has_trial: !!trialEnd,
            },
          });

          // Mark payment transaction as completed
          if (txRef) {
            await supabase.from('payment_transactions').update({
              payment_status: 'completed',
              completed_at: now.toISOString(),
              webhook_verified: true,
            }).eq('transaction_ref', txRef);
          }

          // Auto-settle to owner MoMo (only if actual payment, not trial)
          if (session.amount_total > 0) {
            await settleToOwnerMoMo(
              session.amount_total / 100,
              session.currency || 'USD',
              event.id,
              supabase,
              organizationId,
            );
          }

          console.log(`[webhook] ✅ Subscription activated: org=${organizationId} plan=${planId} status=${subStatus}`);
          break;
        }

        // ────────────────────────────────────────────────
        // INVOICE PAYMENT SUCCEEDED → Renew subscription
        // ────────────────────────────────────────────────
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId) break;

          // Find our subscription by Stripe subscription ID
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('organization_id, plan_id, billing_cycle, status')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (!sub) {
            console.warn(`[webhook] No subscription found for stripe_subscription_id: ${subscriptionId}`);
            break;
          }

          // Get current period from Stripe
          let periodStart = new Date().toISOString();
          let periodEnd = new Date();

          if (stripeKey) {
            const stripeSub = await stripeGet(`/subscriptions/${subscriptionId}`, stripeKey);
            if (stripeSub.current_period_start) {
              periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
            }
            if (stripeSub.current_period_end) {
              periodEnd = new Date(stripeSub.current_period_end * 1000);
            }
          } else {
            if (sub.billing_cycle === 'annual') {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }
          }

          // Update subscription: mark active, reset usage counters
          await supabase.from('subscriptions').update({
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd.toISOString(),
            usage_counters: { invoices: 0, ai_queries: 0, team_members: 0, storage_mb: 0, reports: 0, bank_imports: 0 },
            last_usage_reset: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);

          // Update payment method
          if (invoice.payment_intent && stripeKey) {
            try {
              const pi = await stripeGet(`/payment_intents/${invoice.payment_intent}`, stripeKey);
              if (pi.payment_method) {
                const pm = await stripeGet(`/payment_methods/${pi.payment_method}`, stripeKey);
                if (pm.card) {
                  await supabase.from('subscriptions').update({
                    payment_method_last4: pm.card.last4,
                    payment_method_brand: pm.card.brand,
                  }).eq('stripe_subscription_id', subscriptionId);
                }
              }
            } catch (e) {
              console.warn('[webhook] Could not update payment method:', e);
            }
          }

          // Log billing event
          await supabase.from('billing_events').insert({
            organization_id: sub.organization_id,
            type: 'payment_succeeded',
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency?.toUpperCase() || 'USD',
            provider: 'stripe',
            provider_event_id: event.id,
            metadata: {
              invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
              billing_reason: invoice.billing_reason,
            },
          });

          // Auto-settle to owner MoMo
          if (invoice.amount_paid > 0) {
            await settleToOwnerMoMo(
              invoice.amount_paid / 100,
              invoice.currency || 'USD',
              event.id,
              supabase,
              sub.organization_id,
            );
          }

          console.log(`[webhook] ✅ Payment succeeded: org=${sub.organization_id} amount=${invoice.amount_paid / 100}`);
          break;
        }

        // ────────────────────────────────────────────────
        // INVOICE PAYMENT FAILED → Mark past_due
        // ────────────────────────────────────────────────
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId) break;

          const { data: sub } = await supabase
            .from('subscriptions')
            .select('organization_id, plan_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (!sub) break;

          // Mark as past_due → restricts premium access
          await supabase.from('subscriptions').update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);

          // Log billing event
          await supabase.from('billing_events').insert({
            organization_id: sub.organization_id,
            type: 'payment_failed',
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency?.toUpperCase() || 'USD',
            provider: 'stripe',
            provider_event_id: event.id,
            metadata: {
              invoice_id: invoice.id,
              attempt_count: invoice.attempt_count,
              next_payment_attempt: invoice.next_payment_attempt,
              billing_reason: invoice.billing_reason,
            },
          });

          console.log(`[webhook] ⚠️ Payment failed: org=${sub.organization_id} plan=${sub.plan_id}`);
          break;
        }

        // ────────────────────────────────────────────────
        // SUBSCRIPTION DELETED → Downgrade to Free
        // ────────────────────────────────────────────────
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const organizationId = subscription.metadata?.organization_id;

          // Find by Stripe subscription ID
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('organization_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          const orgId = organizationId || sub?.organization_id;
          if (!orgId) break;

          // Downgrade to free plan with free limits
          await supabase.from('subscriptions').update({
            status: 'canceled',
            plan_id: 'free',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            usage_limits: PLAN_LIMITS.free,
            updated_at: new Date().toISOString(),
          }).eq('organization_id', orgId);

          // Log event
          await supabase.from('billing_events').insert({
            organization_id: orgId,
            type: 'subscription_canceled',
            amount: 0,
            currency: 'USD',
            provider: 'stripe',
            provider_event_id: event.id,
            metadata: {
              cancellation_reason: subscription.cancellation_details?.reason,
              feedback: subscription.cancellation_details?.feedback,
            },
          });

          console.log(`[webhook] ❌ Subscription deleted: org=${orgId} → downgraded to free`);
          break;
        }

        // ────────────────────────────────────────────────
        // SUBSCRIPTION UPDATED → Sync status
        // ────────────────────────────────────────────────
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const organizationId = subscription.metadata?.organization_id;

          const updateData: Record<string, any> = {
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          };

          if (subscription.current_period_end) {
            updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
          if (subscription.current_period_start) {
            updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
          }
          if (subscription.trial_end) {
            updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
          }

          // If trialing → active transition, update plan status
          if (subscription.status === 'active') {
            const planId = subscription.metadata?.plan_id;
            if (planId && PLAN_LIMITS[planId]) {
              updateData.usage_limits = PLAN_LIMITS[planId];
            }
          }

          // If past_due too long, downgrade
          if (subscription.status === 'unpaid') {
            updateData.status = 'past_due';
          }

          if (organizationId) {
            await supabase.from('subscriptions').update(updateData).eq('organization_id', organizationId);
          } else {
            await supabase.from('subscriptions').update(updateData).eq('stripe_subscription_id', subscription.id);
          }

          console.log(`[webhook] 🔄 Subscription updated: ${subscription.id} → ${subscription.status}`);
          break;
        }

        // ────────────────────────────────────────────────
        // TRIAL WILL END → Notify (3 days before)
        // ────────────────────────────────────────────────
        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object;
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            await supabase.from('billing_events').insert({
              organization_id: organizationId,
              type: 'trial_ending_soon',
              amount: 0,
              currency: 'USD',
              provider: 'stripe',
              provider_event_id: event.id,
              metadata: {
                trial_end: subscription.trial_end
                  ? new Date(subscription.trial_end * 1000).toISOString()
                  : null,
              },
            });
          }
          console.log(`[webhook] ⏰ Trial ending soon for subscription: ${subscription.id}`);
          break;
        }

        default:
          console.log(`[webhook] Unhandled event type: ${event.type}`);
      }

      // ── 5. Mark event as processed ─────────────────────
      await supabase.from('webhook_events').update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq('event_id', event.id);

    } catch (processingError) {
      // Log processing error but still return 200 to avoid Stripe retries for bad logic
      console.error(`[webhook] Processing error for ${event.type}:`, processingError);
      await supabase.from('webhook_events').update({
        error: processingError instanceof Error ? processingError.message : String(processingError),
      }).eq('event_id', event.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('[webhook] Verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
