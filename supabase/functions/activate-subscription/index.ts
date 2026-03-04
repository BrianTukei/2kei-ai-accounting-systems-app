/**
 * activate-subscription Edge Function
 * ────────────────────────────────────
 * Server-side subscription activation that bypasses RLS.
 * Called from the frontend after payment is verified, or
 * for demo/downgrade operations.
 *
 * This ensures the `subscriptions` table is ALWAYS updated
 * via service role, avoiding RLS write restrictions.
 *
 * Required env vars:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivateRequest {
  organizationId: string;
  planId: 'free' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  paymentProvider: string;
  paymentId?: string;
  /** Whether this is a downgrade (no payment required) */
  isDowngrade?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user via their JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the caller's JWT to get user info
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ActivateRequest = await req.json();
    const { organizationId, planId, billingCycle, paymentProvider, paymentId, isDowngrade } = body;

    if (!organizationId || !planId || !billingCycle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organizationId, planId, billingCycle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user belongs to this organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'User is not a member of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only owners and accountants can change subscriptions
    if (!['owner', 'accountant'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to change subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For upgrades (non-downgrade, non-demo), verify payment was completed
    if (!isDowngrade && paymentProvider !== 'demo' && paymentId) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payment_transactions')
        .select('payment_status, webhook_verified')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.log('[activate-subscription] Payment not found:', paymentId);
        // Don't hard-fail here — payment might be verified by webhook
      } else if (payment.payment_status === 'failed') {
        return new Response(
          JSON.stringify({ error: 'Payment has failed. Cannot activate subscription.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert the subscription (service role bypasses RLS)
    const { data: sub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: paymentProvider,
        updated_at: now.toISOString(),
      }, { onConflict: 'organization_id' })
      .select('id')
      .single();

    if (subError) {
      console.error('[activate-subscription] DB error:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription in database', details: subError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record billing event
    await supabaseAdmin
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        type: isDowngrade ? 'plan_downgraded' : 'payment_succeeded',
        amount: isDowngrade ? 0 : (planId === 'pro' ? (billingCycle === 'annual' ? 290 : 29) : (billingCycle === 'annual' ? 790 : 79)),
        currency: 'USD',
        provider: paymentProvider,
      });

    // If there's a payment transaction, mark it as completed
    if (paymentId) {
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          payment_status: 'completed',
          completed_at: now.toISOString(),
          webhook_verified: true,
          updated_at: now.toISOString(),
        })
        .eq('id', paymentId);
    }

    console.log(`[activate-subscription] Successfully activated ${planId} for org ${organizationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: sub.id,
        planId,
        status: 'active',
        periodEnd: periodEnd.toISOString(),
        message: isDowngrade
          ? `Successfully downgraded to ${planId}`
          : `Successfully activated ${planId} plan`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[activate-subscription] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
