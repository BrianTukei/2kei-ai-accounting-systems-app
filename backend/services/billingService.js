/**
 * Backend Billing Service
 * ─────────────────────
 * Core business logic for subscriptions, payments, and usage tracking
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─────────────────────────────────────────
// SUBSCRIPTION MANAGEMENT
// ─────────────────────────────────────────

async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:pricing_plans(*)
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'paused'])
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function checkSubscriptionExpiry(userId) {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return { plan: 'free', expired: false };

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const graceEndDate = subscription.grace_period_end ? new Date(subscription.grace_period_end) : null;

  if (now > endDate) {
    if (graceEndDate && now <= graceEndDate) {
      return { plan: subscription.plan.slug, expired: false, inGracePeriod: true };
    }
    // Grace period expired - downgrade to free
    await downgradeToFree(userId);
    return { plan: 'free', expired: true };
  }

  return { plan: subscription.plan.slug, expired: false };
}

async function createSubscription(userId, planId, billingCycle) {
  const plan = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (plan.error || !plan.data) throw new Error('Plan not found');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(
    endDate.getMonth() + (billingCycle === 'monthly' ? 1 : 12)
  );

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      auto_renew: true,
    })
    .select();

  if (error || !data || data.length === 0) throw new Error('Failed to create subscription');
  return data[0];
}

async function upgradeSubscription(userId, newPlanId) {
  const currentSub = await getUserSubscription(userId);
  if (!currentSub) throw new Error('No active subscription');

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ plan_id: newPlanId, updated_at: new Date().toISOString() })
    .eq('id', currentSub.id)
    .select();

  if (error) throw error;

  // Log in billing history
  await logBillingHistory(userId, currentSub.id, 'upgraded', currentSub.plan.slug, null);

  return data[0];
}

async function downgradeToFree(userId) {
  const currentSub = await getUserSubscription(userId);
  if (!currentSub) return;

  const freePlan = await supabase
    .from('pricing_plans')
    .select('id')
    .eq('slug', 'free')
    .single();

  if (freePlan.error || !freePlan.data) throw new Error('Free plan not found');

  await supabase
    .from('subscriptions')
    .update({
      plan_id: freePlan.data.id,
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentSub.id);

  await logBillingHistory(userId, currentSub.id, 'downgraded', currentSub.plan.slug, 'free');
}

async function cancelSubscription(userId) {
  const currentSub = await getUserSubscription(userId);
  if (!currentSub) throw new Error('No active subscription');

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentSub.id);

  if (error) throw error;

  await logBillingHistory(userId, currentSub.id, 'canceled', currentSub.plan.slug, null);
}

/**
 * Activate a subscription after successful payment
 * Called by: Webhook handler on payment success
 */
async function activateSubscription(userId, planId) {
  try {
    const plan = await supabase
      .from('pricing_plans')
      .select('slug')
      .eq('id', planId)
      .single();

    if (plan.error) throw plan.error;

    // Get or create subscription
    const currentSub = await getUserSubscription(userId);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Monthly cycle

    if (currentSub) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          grace_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id);

      if (error) throw error;

      await logBillingHistory(userId, currentSub.id, 'upgraded', currentSub.plan.slug, plan.data.slug);
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          billing_cycle: 'monthly',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          auto_renew: true,
        });

      if (error) throw error;

      await logBillingHistory(userId, null, 'created', null, plan.data.slug);
    }

    // Initialize AI credits if not exists
    const existingCredits = await supabase
      .from('ai_credits')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingCredits.error && existingCredits.error.code === 'PGRST116') {
      // Don't have credits yet - initialize based on plan
      const creditMap = {
        free: 0,
        starter: 100000,
        business: 1000000,
        enterprise: 5000000,
      };

  if (!creditMap.hasOwnProperty(plan.data.slug)) {
    throw new Error(`Unknown plan slug: ${plan.data.slug}`);
  }
  const credits = creditMap[plan.data.slug];
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to activate subscription: ${error.message}`);
  }
}

// ─────────────────────────────────────────
// PAYMENT PROCESSING
// ─────────────────────────────────────────

async function createPayment(
  userId,
  amount,
  paymentMethod,
  provider,
  phoneNumber
) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      amount,
      currency: 'UGX',
      payment_method: paymentMethod,
      provider,
      phone_number: phoneNumber,
      status: 'pending',
    })
    .select();

  if (error) throw error;
  return data[0];
}

async function updatePaymentStatus(
  paymentId,
  status,
  reference,
  metadata
) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      transaction_reference: reference,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select();

  if (error || !data || data.length === 0) throw new Error('Payment not found or update failed');

  if (status === 'success') {
    const payment = data[0];
    // Activate subscription
    await createSubscription(payment.user_id, 'starter', 'monthly');
  }

  return data[0];
}

async function getPaymentHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────
// USAGE TRACKING
// ─────────────────────────────────────────

async function trackTransaction(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: existing } = await supabase
    .from('monthly_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('monthly_usage')
      .update({
        transaction_count: existing.transaction_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('monthly_usage')
      .insert({
        user_id: userId,
        year,
        month,
        transaction_count: 1,
      });

    if (error) throw error;
  }

  // Check if exceeded limit for free tier
  const subscription = await getUserSubscription(userId);
  if (subscription?.plan.slug === 'free') {
    const usage = await getMonthlyUsage(userId);
    if (usage.transaction_count > subscription.plan.features.transactions) {
      // Trigger upgrade prompt
      return { limited: true, limit: subscription.plan.features.transactions };
    }
  }

  return { limited: false };
}

async function getMonthlyUsage(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data, error } = await supabase
    .from('monthly_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error && error.code === 'PGRST116') {
    return { transaction_count: 0, ai_requests_count: 0 };
  }

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────
// AI CREDITS SYSTEM
// ─────────────────────────────────────────

async function getAICredits(userId) {
  let { data, error } = await supabase
    .from('ai_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Initialize AI credits for new user
    const { data: newCredits, error: insertError } = await supabase
      .from('ai_credits')
      .insert({ user_id: userId, balance: 0 })
      .select()
      .single();

    if (insertError) throw insertError;
    return newCredits;
  }

  if (error) throw error;
  return data;
}

async function useAICredits(userId, feature, creditsToUse) {
  const credits = await getAICredits(userId);

  if (credits.balance < creditsToUse) {
    throw new Error('Insufficient AI credits');
  }

  // Deduct credits
  await supabase
    .from('ai_credits')
    .update({
      balance: credits.balance - creditsToUse,
      total_used: (credits.total_used || 0) + creditsToUse,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Log usage
  await supabase
    .from('ai_usage_history')
    .insert({
      user_id: userId,
      feature,
      credits_used: creditsToUse,
      status: 'completed',
    });

  return true;
}

async function purchaseAICredits(userId, amount, paymentId) {
  const credits = await getAICredits(userId);

  const { error } = await supabase
    .from('ai_credits')
    .update({
      balance: credits.balance + amount,
      total_purchased: (credits.total_purchased || 0) + amount,
      last_refilled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;

  // Log transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      amount,
      transaction_type: 'credit_purchase',
      status: 'completed',
      provider_reference: paymentId,
    });
}

// ─────────────────────────────────────────
// ADMIN FUNCTIONS
// ─────────────────────────────────────────

async function getAllSubscriptions(limit = 100) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:pricing_plans(*),
      user:auth.users(id, email, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

async function getRevenueMetrics(startDate, endDate) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'success')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  const totalRevenue = data.reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentsByProvider = data.reduce((acc, p) => {
    acc[p.provider] = (acc[p.provider] || 0) + Number(p.amount);
    return acc;
  }, {});

  return { totalRevenue, transactionCount: data.length, paymentsByProvider };
}

async function manuallyUpgradeUser(userId, planSlug) {
  const plan = await supabase
    .from('pricing_plans')
    .select('id')
    .eq('slug', planSlug)
    .single();

  if (plan.error) throw plan.error;

  await upgradeSubscription(userId, plan.data.id);

  // Log billing history
  const currentSub = await getUserSubscription(userId);
  await logBillingHistory(userId, currentSub?.id, 'upgraded', null, planSlug, 0, 'Admin manual upgrade');
}

const logBillingHistory = async (
  userId,
  subscriptionId,
  action,
  fromPlan,
  toPlan,
  amount,
  notes
) => {
  await supabase
    .from('billing_history')
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      action,
      from_plan: fromPlan,
      to_plan: toPlan,
      amount: amount || null,
      notes: notes || null,
    });
};

async function getDemoBookings(status) {
  let query = supabase.from('demo_bookings').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('preferred_date', { ascending: true });

  if (error) throw error;
  return data;
}

async function createDemoBooking(booking) {
  const { data, error } = await supabase
    .from('demo_bookings')
    .insert([booking])
    .select();

  if (error) throw error;
  return data[0];
}

async function updateDemoBooking(bookingId, updates) {
  const { data, error } = await supabase
    .from('demo_bookings')
    .update(updates)
    .eq('id', bookingId)
    .select();

  if (error) throw error;
  return data[0];
}

// ─────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────

module.exports = {
  // Subscription Management
  getUserSubscription,
  checkSubscriptionExpiry,
  createSubscription,
  upgradeSubscription,
  downgradeToFree,
  cancelSubscription,
  activateSubscription,
  
  // Payment Processing
  createPayment,
  updatePaymentStatus,
  getPaymentHistory,
  
  // Usage Tracking
  trackTransaction,
  getMonthlyUsage,
  
  // AI Credits System
  getAICredits,
  useAICredits,
  purchaseAICredits,
  
  // Admin Functions
  getAllSubscriptions,
  getRevenueMetrics,
  manuallyUpgradeUser,
  logBillingHistory,
  
  // Demo Bookings
  getDemoBookings,
  createDemoBooking,
  updateDemoBooking,
};
