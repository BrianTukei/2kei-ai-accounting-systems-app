/**
 * stripe-checkout Edge Function
 * Creates a Stripe Checkout Session for subscription payments.
 * 
 * Required env vars:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - STRIPE_PRICE_PRO_MONTHLY      (optional, from Stripe Dashboard)
 *   - STRIPE_PRICE_PRO_ANNUAL        (optional)
 *   - STRIPE_PRICE_ENTERPRISE_MONTHLY (optional)
 *   - STRIPE_PRICE_ENTERPRISE_ANNUAL  (optional)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  organizationId: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  email: string;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

// Price IDs from Stripe Dashboard — configurable via env vars
const PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || 'price_pro_monthly',
    annual:  Deno.env.get('STRIPE_PRICE_PRO_ANNUAL')  || 'price_pro_annual',
  },
  enterprise: {
    monthly: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') || 'price_enterprise_monthly',
    annual:  Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL')  || 'price_enterprise_annual',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const body: CheckoutRequest = await req.json();
    const { organizationId, planId, billingCycle, email, successUrl, cancelUrl } = body;

    // Supabase client for audit trail
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get price ID
    const priceId = PRICE_IDS[planId]?.[billingCycle];
    if (!priceId || planId === 'free') {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Create payment_transactions audit record
    const txRef = `stripe_${organizationId}_${Date.now()}`;
    await supabase.from('payment_transactions').insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount: 0, // Stripe calculates from price ID
      currency: body.currency || 'USD',
      payment_provider: 'stripe',
      payment_status: 'pending',
      transaction_ref: txRef,
    }).then(({ error: txErr }) => {
      if (txErr) console.warn('payment_transactions insert warning:', txErr.message);
    });

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': email,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'metadata[organization_id]': organizationId,
        'metadata[plan_id]': planId,
        'metadata[billing_cycle]': billingCycle,
        'subscription_data[metadata][organization_id]': organizationId,
      }).toString(),
    });

    const session = await response.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
