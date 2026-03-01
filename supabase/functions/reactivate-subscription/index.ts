/**
 * reactivate-subscription Edge Function
 * Reactivates a subscription that was set to cancel at period end.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReactivateRequest {
  organizationId: string;
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ReactivateRequest = await req.json();
    const { organizationId } = body;

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('organization_id', organizationId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      throw new Error('No subscription found');
    }

    // Reactivate subscription (remove cancel_at_period_end)
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'cancel_at_period_end': 'false',
        }).toString(),
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Update local database
    await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: false,
        status: 'active',
      })
      .eq('organization_id', organizationId);

    // Log billing event
    await supabase.from('billing_events').insert({
      organization_id: organizationId,
      type: 'subscription_reactivated',
      provider: 'stripe',
      metadata: { subscription_id: subscription.stripe_subscription_id },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
