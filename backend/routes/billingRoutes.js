/**
 * Billing Routes & Controllers
 * ────────────────────────────
 * Subscription, payments, and usage management endpoints
 */

const express = require('express');
const { auth, admin } = require('../middleware/auth');
const {
  getUserSubscription,
  checkSubscriptionExpiry,
  createSubscription,
  upgradeSubscription,
  downgradeToFree,
  cancelSubscription,
  createPayment,
  updatePaymentStatus,
  getPaymentHistory,
  trackTransaction,
  getMonthlyUsage,
  getAICredits,
  useAICredits,
  purchaseAICredits,
  getAllSubscriptions,
  getRevenueMetrics,
  manuallyUpgradeUser,
  getDemoBookings,
  createDemoBooking,
  updateDemoBooking,
} = require('../services/billingService');

const {
  initiateMTNPayment,
  initiateAirtelPayment,
  verifyPayment,
  verifyWebhookSignature,
  handlePaymentWebhook,
  refundPayment,
} = require('../services/mobileMoneyService');

const router = express.Router();

// ─────────────────────────────────────────
// SUBSCRIPTION MANAGEMENT
// ─────────────────────────────────────────

/**
 * Get current user subscription
 * GET /api/billing/subscription
 */
router.get('/subscription', auth, async (req, res) => {
  try {
    const subscription = await getUserSubscription(req.user.id);
    const status = await checkSubscriptionExpiry(req.user.id);

    res.json({
      subscription,
      status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all pricing plans
 * GET /api/billing/plans
 */
router.get('/plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('display_order');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upgrade subscription
 * POST /api/billing/upgrade
 */
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { planSlug } = req.body;

    // Get plan ID
    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('id')
      .eq('slug', planSlug)
      .single();

    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    await upgradeSubscription(req.user.id, plan.id);

    res.json({ message: 'Subscription upgraded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel subscription
 * POST /api/billing/cancel
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    await cancelSubscription(req.user.id);
    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────

/**
 * Initiate payment via MTN Mobile Money
 * POST /api/billing/payment/mtn
 */
router.post('/payment/mtn', auth, async (req, res) => {
  try {
    const { phoneNumber, amount, planSlug } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount required' });
    }

    // Create payment record
    const payment = await createPayment(
      req.user.id,
      amount,
      'mobile_money',
      'mtn',
      phoneNumber
    );

    // Initiate MTN payment
    const result = await initiateMTNPayment(
      phoneNumber,
      amount,
      req.user.id,
      req.user.email,
      req.user.user_metadata?.company_name
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Update payment with reference
    await updatePaymentStatus(payment.id, 'pending', result.reference);

    res.json({
      paymentId: payment.id,
      transactionId: result.transactionId,
      reference: result.reference,
      message: 'Payment initiated successfully. Please complete the prompt on your phone.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initiate payment via Airtel Money
 * POST /api/billing/payment/airtel
 */
router.post('/payment/airtel', auth, async (req, res) => {
  try {
    const { phoneNumber, amount, planSlug } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount required' });
    }

    const payment = await createPayment(
      req.user.id,
      amount,
      'mobile_money',
      'airtel',
      phoneNumber
    );

    const result = await initiateAirtelPayment(
      phoneNumber,
      amount,
      req.user.id,
      req.user.email,
      req.user.user_metadata?.company_name
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await updatePaymentStatus(payment.id, 'pending', result.reference);

    res.json({
      paymentId: payment.id,
      transactionId: result.transactionId,
      reference: result.reference,
      message: 'Payment initiated successfully. Please complete the prompt on your phone.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify payment status
 * GET /api/billing/payment/:transactionId/verify
 */
router.get('/payment/:transactionId/verify', auth, async (req, res) => {
  try {
    const result = await verifyPayment(req.params.transactionId);

    if (result.success && result.status === 'successful') {
      // Update payment in database
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_reference', result.reference)
        .single();

      if (payment) {
        await updatePaymentStatus(payment.id, 'success', result.reference, {
          provider: result.provider,
          amount: result.amount,
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get payment history
 * GET /api/billing/payments
 */
router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await getPaymentHistory(req.user.id, 20);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// USAGE TRACKING
// ─────────────────────────────────────────

/**
 * Get monthly usage
 * GET /api/billing/usage
 */
router.get('/usage', auth, async (req, res) => {
  try {
    const usage = await getMonthlyUsage(req.user.id);
    const subscription = await getUserSubscription(req.user.id);

    res.json({
      usage,
      limit: subscription?.plan.features.transactions || 50,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// AI CREDITS
// ─────────────────────────────────────────

/**
 * Get AI credits balance
 * GET /api/billing/credits
 */
router.get('/credits', auth, async (req, res) => {
  try {
    const credits = await getAICredits(req.user.id);
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Use AI credits
 * POST /api/billing/credits/use
 */
router.post('/credits/use', auth, async (req, res) => {
  try {
    const { feature, creditsToUse } = req.body;

    await useAICredits(req.user.id, feature, creditsToUse);

    const credits = await getAICredits(req.user.id);
    res.json({ message: 'Credits used successfully', credits });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Purchase AI credits
 * POST /api/billing/credits/purchase
 */
router.post('/credits/purchase', auth, async (req, res) => {
  try {
    const { creditsAmount, phoneNumber } = req.body;

    // Calculate price (500 UGX per credit)
    const price = creditsAmount * 500;

    // Create payment
    const payment = await createPayment(req.user.id, price, 'mobile_money', 'mtn', phoneNumber);

    // Initiate payment
    const result = await initiateMTNPayment(
      phoneNumber,
      price,
      req.user.id,
      req.user.email
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      paymentId: payment.id,
      transactionId: result.transactionId,
      amount: price,
      credits: creditsAmount,
      message: 'Payment initiated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// DEMO BOOKING
// ─────────────────────────────────────────

/**
 * Book a demo
 * POST /api/billing/demo-booking
 */
router.post('/demo-booking', async (req, res) => {
  try {
    const { name, email, phone, businessName, preferredDate, timezone, notes } = req.body;

    if (!name || !email || !phone || !preferredDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = await createDemoBooking({
      name,
      email,
      phone,
      business_name: businessName,
      preferred_date: preferredDate,
      timezone,
      notes,
    });

    // Send email notification to admin
    // TODO: Send admin notification email

    res.json({
      message: 'Demo booking submitted successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────

/**
 * Get all subscriptions (admin)
 * GET /api/billing/admin/subscriptions
 */
router.get('/admin/subscriptions', admin, async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptions();
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get revenue metrics (admin)
 * GET /api/billing/admin/revenue
 */
router.get('/admin/revenue', admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date required' });
    }

    const metrics = await getRevenueMetrics(startDate, endDate);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get demo bookings (admin)
 * GET /api/billing/admin/demo-bookings
 */
router.get('/admin/demo-bookings', admin, async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await getDemoBookings(status);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update demo booking (admin)
 * PATCH /api/billing/admin/demo-bookings/:id
 */
router.patch('/admin/demo-bookings/:id', admin, async (req, res) => {
  try {
    const booking = await updateDemoBooking(req.params.id, req.body);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually upgrade user (admin)
 * POST /api/billing/admin/users/:userId/upgrade
 */
router.post('/admin/users/:userId/upgrade', admin, async (req, res) => {
  try {
    const { planSlug } = req.body;

    if (!planSlug) {
      return res.status(400).json({ error: 'Plan slug required' });
    }

    await manuallyUpgradeUser(req.params.userId, planSlug);
    res.json({ message: 'User upgraded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
