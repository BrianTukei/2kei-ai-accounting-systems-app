import express from 'express';

const router = express.Router();

// Simple pricing plans endpoint - no authentication required for testing
router.get('/plans', (req, res) => {
  const plans = [
    {
      name: 'FREE',
      displayName: 'Free Plan',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: {
        maxTransactions: 50,
        maxUsers: 1,
        maxReports: 10,
        aiCredits: 0,
        mobileMoneyTracking: false,
        aiFeatures: false
      }
    },
    {
      name: 'STARTER',
      displayName: 'Starter Plan',
      description: 'Great for small businesses',
      monthlyPrice: 10000,
      yearlyPrice: 100000,
      features: {
        maxTransactions: -1,
        maxUsers: 1,
        maxReports: 25,
        aiCredits: 10,
        mobileMoneyTracking: true,
        aiFeatures: false
      }
    },
    {
      name: 'BUSINESS',
      displayName: 'Business Plan',
      description: 'Perfect for growing businesses',
      monthlyPrice: 50000,
      yearlyPrice: 500000,
      features: {
        maxTransactions: -1,
        maxUsers: 5,
        maxReports: -1,
        aiCredits: 100,
        mobileMoneyTracking: true,
        aiFeatures: true
      }
    },
    {
      name: 'ENTERPRISE',
      displayName: 'Enterprise Plan',
      description: 'For large organizations',
      monthlyPrice: 150000,
      yearlyPrice: 1500000,
      features: {
        maxTransactions: -1,
        maxUsers: -1,
        maxReports: -1,
        aiCredits: -1,
        mobileMoneyTracking: true,
        aiFeatures: true
      }
    }
  ];

  res.json({
    success: true,
    data: plans,
    message: 'Pricing plans retrieved successfully'
  });
});

// Simple payment methods endpoint
router.get('/payment-methods', (req, res) => {
  const methods = [
    {
      name: 'MTN Mobile Money',
      code: 'mtn_momo',
      logo: '/assets/mtn-logo.png',
      description: 'Uganda\'s largest mobile money provider',
      supported: true
    },
    {
      name: 'Airtel Money',
      code: 'airtel_money',
      logo: '/assets/airtel-logo.png',
      description: 'Fast and reliable mobile money service',
      supported: true
    },
    {
      name: 'Flutterwave',
      code: 'flutterwave',
      logo: '/assets/flutterwave-logo.png',
      description: 'Universal payment gateway (fallback)',
      supported: true
    }
  ];

  res.json({
    success: true,
    data: methods,
    message: 'Payment methods retrieved successfully'
  });
});

// Simple subscription status endpoint
router.get('/subscription/status', (req, res) => {
  // Mock subscription status
  const status = {
    subscribed: true,
    plan: 'BUSINESS',
    status: 'active',
    daysUntilExpiry: 30,
    isActive: true,
    inGracePeriod: false,
    autoRenew: true,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usage: {
      transactions: 245,
      aiCredits: {
        total: 100,
        used: 45,
        available: 55
      },
      limits: {
        maxTransactions: -1,
        maxUsers: 5,
        maxReports: -1,
        aiCredits: 100
      },
      percentage: 45
    }
  };

  res.json({
    success: true,
    data: status,
    message: 'Subscription status retrieved successfully'
  });
});

export default router;
