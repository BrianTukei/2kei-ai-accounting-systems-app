/**
 * cancel-subscription Edge Function
 * ─────────────────────────────────
 * Cancels a subscription at the end of the current billing period.
 * Supports multiple payment providers: Stripe, Flutterwave, Paystack.
 *
 * Required env vars:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - STRIPE_SECRET_KEY        (if provider = stripe)
 *   - FLUTTERWAVE_SECRET_KEY   (if provider = flutterwave)
 *   - PAYSTACK_SECRET_KEY      (if provider = paystack)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelRequest {
  organizationId: string;
  reason?: string;
  immediate?: boolean; // true = cancel now, false = cancel at period end
}

// ── Stripe cancellation ─────────────────────────────

async function cancelStripe(subscriptionId: string, immediate: boolean): Promise<void> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

  if (immediate) {
    // Immediately cancel
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      }
    );
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
  } else {
    // Cancel at period end
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ 'cancel_at_period_end': 'true' }).toString(),
      }
    );
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
  }
}

// ── Flutterwave cancellation ────────────────────────

async function cancelFlutterwave(subscriptionId: string): Promise<void> {
  const flutterwaveKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!flutterwaveKey) throw new Error('FLUTTERWAVE_SECRET_KEY not configured');

  const response = await fetch(
    `https://api.flutterwave.com/v3/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const result = await response.json();
  if (result.status !== 'success') {
    throw new Error(result.message || 'Failed to cancel Flutterwave subscription');
  }
}

// ── Paystack cancellation ───────────────────────────

async function cancelPaystack(subscriptionCode: string, emailToken: string): Promise<void> {
  const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackKey) throw new Error('PAYSTACK_SECRET_KEY not configured');

  const response = await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${paystackKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token: emailToken,
    }),
  });
  const result = await response.json();
  if (!result.status) {
    throw new Error(result.message || 'Failed to cancel Paystack subscription');
  }
}

// ── Main handler ────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const body: CancelRequest = await req.json();
    const { organizationId, reason, immediate = false } = body;

    if (!organizationId) throw new Error('organizationId is required');

    // Verify user belongs to this organization
    const { data: membership } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!membership) throw new Error('You do not belong to this organization');
    if (!['owner', 'accountant'].includes(membership.role)) {
      throw new Error('Only owners and accountants can cancel subscriptions');
    }

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, payment_provider, status, plan_id, current_period_end')
      .eq('organization_id', organizationId)
      .single();

    if (subError || !subscription) {
      throw new Error('No active subscription found');
    }

    if (subscription.status === 'canceled') {
      throw new Error('Subscription is already canceled');
    }

    const provider = subscription.payment_provider || 'stripe';

    // Cancel with the appropriate provider
    switch (provider) {
      case 'stripe':
        if (subscription.stripe_subscription_id) {
          await cancelStripe(subscription.stripe_subscription_id, immediate);
        }
        break;

      case 'flutterwave':
        if (subscription.stripe_subscription_id) {
          await cancelFlutterwave(subscription.stripe_subscription_id);
        }
        break;

      case 'paystack':
        if (subscription.stripe_subscription_id) {
          // Fetch email_token from Paystack API (required for cancellation)
          const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
          if (!paystackKey) throw new Error('PAYSTACK_SECRET_KEY not configured');
          
          const subRes = await fetch(
            `https://api.paystack.co/subscription/${subscription.stripe_subscription_id}`,
            { headers: { 'Authorization': `Bearer ${paystackKey}` } }
          );
          const subData = await subRes.json();
          const emailToken = subData.data?.email_token || '';
          
          if (!emailToken) {
            throw new Error('Could not retrieve Paystack email token for cancellation');
          }
          
          await cancelPaystack(
            subscription.stripe_subscription_id,
            emailToken
          );
        }
        break;

      case 'demo':
        // No external API call for demo mode
        break;

      default:
        console.log(`Unknown provider "${provider}", updating DB only`);
    }

    // Update database
    if (immediate) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);
    } else {
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);
    }

    // Log billing event
    await supabase.from('billing_events').insert({
      organization_id: organizationId,
      type: immediate ? 'subscription_canceled_immediately' : 'subscription_canceled',
      provider,
      metadata: {
        subscription_id: subscription.stripe_subscription_id,
        plan_id: subscription.plan_id,
        reason: reason || 'user_requested',
        immediate,
        canceled_by: user.id,
        period_end: subscription.current_period_end,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        canceledAt: immediate ? new Date().toISOString() : undefined,
        effectiveEnd: immediate ? new Date().toISOString() : subscription.current_period_end,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at end of billing period',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
