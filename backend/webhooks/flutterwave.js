/**
 * Flutterwave Webhook Handler
 * Handles payment notifications from Flutterwave API
 * This endpoint is called when a payment is completed/failed
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const billingService = require('../services/billingService');
const logger = require('../utils/logger');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Verify Flutterwave webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Webhook signature from header
 * @returns {boolean}
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!signature) {
    logger.error('Webhook signature missing');
    return false;
  }

  // Flutterwave uses SHA256 HMAC
  const hash = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const isValid = hash === signature;
  
  if (!isValid) {
    logger.warn('Invalid webhook signature attempt', {
      expectedHash: hash,
      receivedSignature: signature
    });
  }

  return isValid;
};

/**
 * Handle successful payment
 * @param {Object} payload - Flutterwave payload
 */
const handlePaymentSuccess = async (payload) => {
  try {
    const {
      id: transactionId,
      tx_ref: reference,
      amount,
    currency
  } = payload;

  if (!payload.customer?.email) throw new Error('Missing customer email in webhook');
  if (!payload.meta?.userId) throw new Error('Missing user ID in webhook metadata');

  const { email } = payload.customer;
  const { userId, planSlug } = payload.meta;
      userId,
      amount,
      planSlug
    });

    // Verify transaction reference format
    if (!reference || !reference.startsWith('BILLING-')) {
      logger.warn('Invalid transaction reference format', { reference });
      return {
        success: false,
        error: 'Invalid transaction reference'
      };
    }

    // Update payment status in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'success',
        transaction_reference: transactionId.toString(),
        metadata: {
          flutterwaveTransactionId: transactionId,
          originalReference: reference,
          amount,
          completedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('transaction_reference', reference)
      .select()
      .single();

    if (paymentError) {
      logger.error('Failed to update payment status', {
        error: paymentError,
        reference
      });
      throw paymentError;
    }

    // Get subscription to activate
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, plan_id')
      .eq('id', payment.subscription_id)
      .single();

    if (subError || !subscription) {
      logger.error('Subscription not found for payment', {
        subscriptionId: payment.subscription_id
      });
      throw new Error('Subscription not found');
    }

    // Activate subscription
    const activationResult = await billingService.activateSubscription(
      userId,
      subscription.plan_id
    );

    if (!activationResult) {
      throw new Error('Failed to activate subscription');
    }

    // Log billing history
    await supabase.from('billing_history').insert({
      user_id: userId,
      subscription_id: subscription.id,
      action: 'payment_success',
      notes: `Payment of ${amount} ${currency} completed via Flutterwave`,
      created_at: new Date().toISOString()
    });

    logger.info('Payment processed successfully', {
      userId,
      subscriptionId: subscription.id,
      amount
    });

    // TODO: Send confirmation email
    // await emailService.sendPaymentConfirmation(email, payment);

    return {
      success: true,
      message: 'Payment processed successfully',
      subscriptionId: subscription.id
    };
  } catch (error) {
    logger.error('Error handling successful payment', {
      error: error.message,
      payload
    });
    throw error;
  }
};

/**
 * Handle failed payment
 * @param {Object} payload - Flutterwave payload
 */
const handlePaymentFailed = async (payload) => {
  try {
    const {
      id: transactionId,
      tx_ref: reference,
      amount,
      status,
      customer: { email }
    } = payload;

    logger.warn('Payment failed', {
      transactionId,
      reference,
      status,
      amount
    });

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        transaction_reference: transactionId.toString(),
        metadata: {
          flutterwaveTransactionId: transactionId,
          failureReason: status,
          failedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('transaction_reference', reference);

    // TODO: Send failure notification email
    // await emailService.sendPaymentFailedNotification(email, reference);

    return {
      success: true,
      message: 'Payment failure recorded'
    };
  } catch (error) {
    logger.error('Error handling payment failure', {
      error: error.message,
      payload
    });
    throw error;
  }
};

/**
 * Process Flutterwave webhook
 * Called by: POST /api/billing/webhooks/flutterwave
 */
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verifications-hash'];
    const payload = req.body;

    // Verify webhook authenticity
    if (!verifyWebhookSignature(payload, signature)) {
      logger.error('Webhook signature verification failed');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    logger.info('Webhook received from Flutterwave', {
      transactionId: payload.id,
      status: payload.status,
      amount: payload.amount
    });

    // Process based on payment status
    let result;
    if (payload.status === 'successful') {
      result = await handlePaymentSuccess(payload);
    } else if (payload.status === 'failed' || payload.status === 'cancelled') {
      result = await handlePaymentFailed(payload);
    } else {
      logger.warn('Unhandled payment status', { status: payload.status });
      result = {
        success: true,
        message: 'Status recorded'
      };
    }

    // Return 200 to acknowledge receipt to Flutterwave
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      data: result
    });
  } catch (error) {
    logger.error('Error processing Flutterwave webhook', {
      error: error.message,
      body: req.body
    });

    // Return 200 to prevent Flutterwave from retrying
    // But log the error for manual review
    res.status(200).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    });
  }
};

/**
 * Webhook for MTN Mobile Money
 */
exports.handleMTNWebhook = async (req, res) => {
  try {
    const { transactionId, status, amount, reference } = req.body;

    logger.info('MTN webhook received', {
      transactionId,
      status,
      reference
    });

    if (status === 'success') {
      // Update payment and activate subscription
      const { data: payment } = await supabase
        .from('payments')
        .select('subscription_id, user_id')
        .eq('transaction_reference', reference)
        .single();

      if (payment) {
        await supabase
          .from('payments')
          .update({
            status: 'success',
            metadata: {
              mtnTransactionId: transactionId,
              completedAt: new Date().toISOString()
            }
          })
          .eq('id', payment.id);

        // Activate subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('id', payment.subscription_id)
          .single();

        if (subscription) {
          await billingService.activateSubscription(
            payment.user_id,
            subscription.plan_id
          );
        }
      }
    } else {
      // Mark as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            mtnTransactionId: transactionId,
            failureReason: status
          }
        })
        .eq('transaction_reference', reference);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing MTN webhook', { error: error.message });
    res.status(200).json({ success: false });
  }
};

/**
 * Webhook for Airtel Money
 */
exports.handleAirtelWebhook = async (req, res) => {
  try {
    const { id, state, amount, reference } = req.body;

    logger.info('Airtel webhook received', {
      transactionId: id,
      state,
      reference
    });

    if (state === 'Completed') {
      // Update payment and activate subscription
      const { data: payment } = await supabase
        .from('payments')
        .select('subscription_id, user_id')
        .eq('transaction_reference', reference)
        .single();

      if (payment) {
        await supabase
          .from('payments')
          .update({
            status: 'success',
            metadata: {
              airtelTransactionId: id,
              completedAt: new Date().toISOString()
            }
          })
          .eq('id', payment.id);

        // Activate subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('id', payment.subscription_id)
          .single();

        if (subscription) {
          await billingService.activateSubscription(
            payment.user_id,
            subscription.plan_id
          );
        }
      }
    } else {
      // Mark as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            airtelTransactionId: id,
            failureReason: state
          }
        })
        .eq('transaction_reference', reference);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing Airtel webhook', { error: error.message });
    res.status(200).json({ success: false });
  }
};
