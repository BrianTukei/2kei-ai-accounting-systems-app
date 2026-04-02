/**
 * Subscription Management Jobs
 * ────────────────────────────
 * Automated tasks for subscription lifecycle management
 * - Daily subscription expiry checks
 * - Grace period auto-downgrade
 * - Auto-renewal processing
 * - Usage reset for new billing period
 */

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Job configuration
const GRACE_PERIOD_DAYS = parseInt(process.env.GRACE_PERIOD_DAYS || '5');
const CHECK_INTERVAL = process.env.SUBSCRIPTION_CHECK_INTERVAL_HOURS || '24';

// ─────────────────────────────────────────
// SUBSCRIPTION EXPIRY CHECK
// ─────────────────────────────────────────

/**
 * Check for expired subscriptions and apply grace period
 * Runs daily at 1:00 AM
 */
const checkSubscriptionExpiry = async () => {
  try {
    logger.info('🔄 Starting subscription expiry check...');

    const now = new Date();
    const graceStart = new Date();
    graceStart.setDate(graceStart.getDate() - 1); // Yesterday

    // Find subscriptions that expired yesterday/today
    const { data: expiredSubs, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id')
      .eq('status', 'active')
      .lt('end_date', now.toISOString().split('T')[0])
      .gte('end_date', graceStart.toISOString().split('T')[0]);

    if (error) throw error;

    if (expiredSubs && expiredSubs.length > 0) {
      logger.info(`📋 Found ${expiredSubs.length} expired subscriptions`);

      for (const sub of expiredSubs) {
        const graceEndDate = new Date(now);
        graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);

        // Update subscription to grace period
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            grace_period_end: graceEndDate.toISOString().split('T')[0],
          })
          .eq('id', sub.id);

        if (updateError) {
          logger.error(`Failed to update subscription ${sub.id}`, updateError);
          continue;
        }

        logger.info(`⏰ Subscription ${sub.id} entered grace period until ${graceEndDate.toISOString().split('T')[0]}`);

        // TODO: Send grace period notification email
        // await emailService.sendGracePeriodNotification(user.email, graceEndDate);
      }
    } else {
      logger.info('✅ No expired subscriptions found');
    }
  } catch (error) {
    logger.error('❌ Error checking subscription expiry', error);
  }
};

// ─────────────────────────────────────────
// GRACE PERIOD AUTO-DOWNGRADE
// ─────────────────────────────────────────

/**
 * Downgrade subscriptions that have passed grace period
 * Runs daily at 2:00 AM
 */
const processGracePeriodExpiry = async () => {
  try {
    logger.info('🔄 Starting grace period expiry check...');

    const now = new Date();

    // Find subscriptions in grace period that have expired
    const { data: gracedSubs, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan:pricing_plans(slug)')
      .eq('status', 'expired')
      .not('grace_period_end', 'is', null)
      .lt('grace_period_end', now.toISOString().split('T')[0]);

    if (error) throw error;

    if (gracedSubs && gracedSubs.length > 0) {
      logger.info(`📋 Found ${gracedSubs.length} subscriptions to downgrade`);

      // Get free plan ID
      const { data: freePlan, error: freePlanError } = await supabase
        .from('pricing_plans')
        .select('id')
        .eq('slug', 'free')
        .single();

      if (freePlanError) throw freePlanError;

      for (const sub of gracedSubs) {
        // Update to free plan
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: freePlan.id,
            status: 'active',
            grace_period_end: null,
          })
          .eq('id', sub.id);

        if (updateError) {
          logger.error(`Failed to downgrade subscription ${sub.id}`, updateError);
          continue;
        }

        logger.info(`📉 Subscription ${sub.id} downgraded to free plan`);

        // Log billing change
        await supabase.from('billing_history').insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          action: 'grace_period_ended',
          from_plan: sub.plan.slug,
          to_plan: 'free',
          notes: 'Grace period expired - automatic downgrade',
          created_at: new Date().toISOString(),
        });

        // TODO: Send downgrade notification email
        // await emailService.sendDowngradeNotification(user.email, 'free');
      }
    } else {
      logger.info('✅ No grace period downgrades needed');
    }
  } catch (error) {
    logger.error('❌ Error processing grace period expiry', error);
  }
};

// ─────────────────────────────────────────
// AUTO-RENEWAL PROCESSING
// ─────────────────────────────────────────

/**
 * Process auto-renewals for subscriptions
 * Runs daily at 3:00 AM
 */
const processAutoRenewals = async () => {
  try {
    logger.info('🔄 Starting auto-renewal processing...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find subscriptions that expire today and have auto-renew enabled
    const { data: renewingSubs, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        billing_cycle,
        plan:pricing_plans(monthly_price, yearly_price),
        user:auth.users(email)
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .eq('end_date', now.toISOString().split('T')[0]);

    if (error) throw error;

    if (renewingSubs && renewingSubs.length > 0) {
      logger.info(`💳 Found ${renewingSubs.length} subscriptions to renew`);

      for (const sub of renewingSubs) {
        try {
          // Calculate new end date
          const newEndDate = new Date(now);
          if (sub.billing_cycle === 'yearly') {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          } else {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          }

          // Create auto-renewal payment record
          const amount = sub.billing_cycle === 'yearly'
            ? sub.plan.yearly_price
            : sub.plan.monthly_price;

          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
              user_id: sub.user_id,
              subscription_id: sub.id,
              amount,
              currency: 'UGX',
              payment_method: 'auto_renewal',
              status: 'pending',
              transaction_reference: `AUTO-RENEWAL-${sub.id}-${Date.now()}`,
              metadata: {
                autoRenewal: true,
                billingCycle: sub.billing_cycle,
              },
            })
            .select()
            .single();

          if (paymentError) {
            logger.warn(`Failed to create renewal payment for ${sub.id}`, paymentError);
            continue;
          }

          // TODO: Attempt charge with saved payment method
          // For now, mark as pending and require manual processing
          logger.info(`✅ Auto-renewal payment created for subscription ${sub.id}`, {
            amount,
            paymentId: payment.id,
          });

          // If in test mode, auto-approve
          if (process.env.AUTO_APPROVE_RENEWALS === 'true') {
            await supabase
              .from('payments')
              .update({ status: 'success' })
              .eq('id', payment.id);

            await supabase
              .from('subscriptions')
              .update({
                end_date: newEndDate.toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);

            logger.info(`🔄 Auto-renewal processed for subscription ${sub.id}`);
          }
        } catch (error) {
          logger.error(`Error processing renewal for subscription ${sub.id}`, error);
        }
      }
    } else {
      logger.info('✅ No auto-renewals to process');
    }
  } catch (error) {
    logger.error('❌ Error processing auto-renewals', error);
  }
};

// ─────────────────────────────────────────
// MONTHLY USAGE RESET
// ─────────────────────────────────────────

/**
 * Reset monthly usage counters at month boundaries
 * Runs on the 1st of each month at 00:00
 */
const resetMonthlyUsage = async () => {
  try {
    logger.info('🔄 Starting monthly usage reset...');

    // This is handled by the trackTransaction function in billingService
    // Monthly usage is auto-created when user makes a transaction
    logger.info('✅ Monthly usage reset check complete');
  } catch (error) {
    logger.error('❌ Error resetting monthly usage', error);
  }
};

// ─────────────────────────────────────────
// FAILED RENEWAL RETRY
// ─────────────────────────────────────────

/**
 * Retry failed payment collections
 * Runs twice daily at 9:00 AM and 6:00 PM
 */
const retryFailedRenewals = async () => {
  try {
    logger.info('🔄 Starting failed renewal retry...');

    const retryDays = parseInt(process.env.AUTO_RENEWAL_RETRY_DAYS || '3');
    const retryBefore = new Date();
    retryBefore.setDate(retryBefore.getDate() - retryDays);

    // Find failed auto-renewal payments from last N days
    const { data: failedPayments, error } = await supabase
      .from('payments')
      .select('id, user_id, subscription_id, amount, metadata')
      .eq('status', 'failed')
      .eq('payment_method', 'auto_renewal')
      .gt('created_at', retryBefore.toISOString())
      .limit(10); // Process max 10 per run to avoid overwhelming

    if (error) throw error;

    if (failedPayments && failedPayments.length > 0) {
      logger.info(`🔄 Retrying ${failedPayments.length} failed renewals`);

      for (const payment of failedPayments) {
        try {
          // TODO: Attempt payment retry with payment provider
          // For now, just log
          logger.info(`Pending retry for payment ${payment.id}`, {
            userId: payment.user_id,
            amount: payment.amount,
          });
        } catch (error) {
          logger.error(`Error retrying payment ${payment.id}`, error);
        }
      }
    } else {
      logger.info('✅ No failed renewals to retry');
    }
  } catch (error) {
    logger.error('❌ Error retrying failed renewals', error);
  }
};

// ─────────────────────────────────────────
// INITIALIZE JOBS
// ─────────────────────────────────────────

/**
 * Initialize all scheduled jobs
 * Call from server.js after database connection
 */
exports.initializeSubscriptionJobs = () => {
  try {
    if (!supabase) {
      logger.warn('Skipping subscription jobs: Supabase configuration missing.');
      return;
    }

    logger.info('📅 Initializing subscription jobs...\n');

    // Subscription expiry check - Daily at 1:00 AM
    cron.schedule('0 1 * * *', checkSubscriptionExpiry);
    logger.info('✅ Subscription expiry check scheduled (daily at 01:00)');

    // Grace period auto-downgrade - Daily at 2:00 AM
    cron.schedule('0 2 * * *', processGracePeriodExpiry);
    logger.info('✅ Grace period expiry check scheduled (daily at 02:00)');

    // Auto-renewal processing - Daily at 3:00 AM
    cron.schedule('0 3 * * *', processAutoRenewals);
    logger.info('✅ Auto-renewal processing scheduled (daily at 03:00)');

    // Monthly usage reset - 1st of month at 00:00
    cron.schedule('0 0 1 * *', resetMonthlyUsage);
    logger.info('✅ Monthly usage reset scheduled (1st at 00:00)');

    // Failed renewal retry - 9:00 AM and 6:00 PM daily
    cron.schedule('0 9,18 * * *', retryFailedRenewals);
    logger.info('✅ Failed renewal retry scheduled (daily at 09:00 and 18:00)\n');

    logger.info('🎉 All subscription jobs initialized successfully!');
  } catch (error) {
    logger.error('❌ Error initializing subscription jobs', error);
    process.exit(1);
  }
};

// Export for testing
exports.checkSubscriptionExpiry = checkSubscriptionExpiry;
exports.processGracePeriodExpiry = processGracePeriodExpiry;
exports.processAutoRenewals = processAutoRenewals;
exports.resetMonthlyUsage = resetMonthlyUsage;
exports.retryFailedRenewals = retryFailedRenewals;
