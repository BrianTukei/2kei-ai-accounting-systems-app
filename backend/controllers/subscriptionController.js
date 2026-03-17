const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Subscription Controller
 * Handles plan upgrades, downgrades, billing, and subscription management
 */
class SubscriptionController {
  /**
   * Get current subscription
   * GET /api/subscription
   */
  async getSubscription(req, res) {
    try {
      const userId = req.user.id;

      let subscription = await Subscription.findOne({ user: userId })
        .populate('user', 'email firstName lastName')
        .populate('company', 'name baseCurrency');

      if (!subscription) {
        // Create free subscription if none exists
        subscription = await this.createFreeSubscription(userId);
      }

      return res.status(200).json({
        success: true,
        data: { subscription }
      });
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Upgrade subscription plan
   * POST /api/subscription/upgrade
   */
  async upgrade(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { plan, billingCycle, paymentProvider } = req.body;

      // Get current subscription
      let subscription = await Subscription.findOne({ user: userId });

      if (!subscription) {
        subscription = await this.createFreeSubscription(userId);
      }

      // Check if already on this plan
      if (subscription.plan === plan) {
        return res.status(400).json({
          success: false,
          message: `You are already on the ${plan} plan`
        });
      }

      // Check if trying to downgrade
      if (!subscription.canUpgrade(plan)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot downgrade through upgrade endpoint. Use cancel and resubscribe.'
        });
      }

      // Get plan pricing
      const pricing = Subscription.getPlanPricing()[plan];
      if (!pricing) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected'
        });
      }

      // Calculate amount
      const amount = billingCycle === 'annual' ? pricing.annual : pricing.monthly;

      // Update subscription
      const planLimits = this.getPlanLimits(plan);
      
      subscription.plan = plan;
      subscription.planDetails = {
        name: pricing.name,
        price: amount,
        currency: 'USD',
        billingCycle: billingCycle || 'monthly',
        features: pricing.features,
        limits: planLimits
      };

      // Set billing period
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      subscription.currentPeriod = {
        start: now,
        end: periodEnd
      };
      subscription.status = 'active';
      subscription.cancelAtPeriodEnd = false;

      // Store payment provider info
      if (paymentProvider) {
        subscription.billingInfo.provider = paymentProvider;
      }

      await subscription.save();

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      logger.info(`Subscription upgraded: User ${userId} to ${plan} plan`);

      return res.status(200).json({
        success: true,
        message: `Successfully upgraded to ${pricing.name} plan`,
        data: {
          subscription: {
            plan: subscription.plan,
            planDetails: subscription.planDetails,
            currentPeriod: subscription.currentPeriod,
            status: subscription.status
          }
        }
      });
    } catch (error) {
      logger.error('Error upgrading subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upgrade subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get available plans
   * GET /api/subscription/plans
   */
  async getPlans(req, res) {
    try {
      const userId = req.user.id;
      const currentSubscription = await Subscription.findOne({ user: userId });
      const currentPlan = currentSubscription?.plan || 'free';

      const plans = Subscription.getPlanPricing();

      // Add upgrade eligibility
      const plansWithEligibility = Object.entries(plans).map(([key, plan]) => ({
        id: key,
        ...plan,
        monthlyPrice: plan.monthly,
        annualPrice: plan.annual,
        savings: plan.monthly * 12 - plan.annual,
        isCurrentPlan: key === currentPlan,
        canUpgrade: this.canUpgrade(currentPlan, key)
      }));

      return res.status(200).json({
        success: true,
        data: {
          currentPlan,
          plans: plansWithEligibility
        }
      });
    } catch (error) {
      logger.error('Error fetching plans:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch plans',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/subscription/cancel
   */
  async cancel(req, res) {
    try {
      const userId = req.user.id;
      const { reason, immediate } = req.body;

      const subscription = await Subscription.findOne({ user: userId });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found'
        });
      }

      if (subscription.plan === 'free') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel free plan'
        });
      }

      if (immediate) {
        // Immediate cancellation - downgrade to free
        subscription.plan = 'free';
        subscription.planDetails = {
          name: 'Free',
          price: 0,
          currency: 'USD',
          billingCycle: 'monthly',
          features: ['Basic accounting', 'Up to 100 transactions', 'Up to 10 invoices'],
          limits: this.getPlanLimits('free')
        };
        subscription.status = 'active';
        subscription.canceledAt = new Date();
        subscription.cancellationReason = reason;
      } else {
        // Cancel at period end
        subscription.cancelAtPeriodEnd = true;
        subscription.cancellationReason = reason;
      }

      await subscription.save();

      logger.info(`Subscription canceled: User ${userId}, immediate: ${immediate}`);

      return res.status(200).json({
        success: true,
        message: immediate 
          ? 'Subscription canceled and downgraded to free'
          : 'Subscription will be canceled at the end of the billing period',
        data: { subscription }
      });
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get usage statistics
   * GET /api/subscription/usage
   */
  async getUsage(req, res) {
    try {
      const userId = req.user.id;
      const companyId = req.user.company;

      const subscription = await Subscription.findOne({ user: userId });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found'
        });
      }

      // Get transaction count
      const Transaction = require('../models/Transaction');
      const transactionCount = await Transaction.countDocuments({ 
        company: companyId,
        createdAt: { $gte: subscription.currentPeriod?.start || new Date() }
      });

      // Get invoice count
      const Invoice = require('../models/Invoice');
      const invoiceCount = await Invoice.countDocuments({
        company: companyId,
        createdAt: { $gte: subscription.currentPeriod?.start || new Date() }
      });

      const limits = subscription.planDetails?.limits || {};
      const usage = subscription.usage || {};

      return res.status(200).json({
        success: true,
        data: {
          plan: subscription.plan,
          limits,
          currentUsage: {
            transactions: transactionCount,
            invoices: invoiceCount,
            aiRequests: usage.aiRequests || 0,
            storage: usage.storageUsed || 0
          },
          percentages: {
            transactions: limits.transactions ? (transactionCount / limits.transactions) * 100 : 0,
            invoices: limits.invoices ? (invoiceCount / limits.invoices) * 100 : 0,
            aiRequests: limits.aiRequests ? ((usage.aiRequests || 0) / limits.aiRequests) * 100 : 0,
            storage: limits.storage ? ((usage.storageUsed || 0) / (limits.storage * 1024)) * 100 : 0
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching usage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Start trial
   * POST /api/subscription/trial
   */
  async startTrial(req, res) {
    try {
      const userId = req.user.id;
      const { days = 14 } = req.body;

      let subscription = await Subscription.findOne({ user: userId });

      if (!subscription) {
        subscription = await this.createFreeSubscription(userId);
      }

      if (subscription.trial?.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Trial is already active'
        });
      }

      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + days);

      subscription.trial = {
        isActive: true,
        startedAt: now,
        endsAt: trialEnd,
        daysRemaining: days
      };

      subscription.status = 'trialing';
      subscription.plan = 'professional'; // Give full access during trial
      subscription.planDetails = {
        name: 'Professional (Trial)',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['All Professional features'],
        limits: this.getPlanLimits('professional')
      };

      await subscription.save();

      logger.info(`Trial started: User ${userId} for ${days} days`);

      return res.status(200).json({
        success: true,
        message: `Trial started successfully. ${days} days remaining.`,
        data: {
          trial: subscription.trial,
          plan: subscription.plan
        }
      });
    } catch (error) {
      logger.error('Error starting trial:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start trial',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Helper: Create free subscription
  async createFreeSubscription(userId) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return await Subscription.create({
      user: userId,
      plan: 'free',
      planDetails: {
        name: 'Free',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        features: ['Basic accounting', 'Up to 100 transactions', 'Up to 10 invoices', 'Email support'],
        limits: this.getPlanLimits('free')
      },
      currentPeriod: {
        start: now,
        end: periodEnd
      },
      status: 'active'
    });
  }

  // Helper: Get plan limits
  getPlanLimits(plan) {
    const limits = {
      free: {
        transactions: 100,
        invoices: 10,
        users: 1,
        storage: 1, // GB
        aiRequests: 50
      },
      starter: {
        transactions: Infinity,
        invoices: Infinity,
        users: 3,
        storage: 10,
        aiRequests: 500
      },
      professional: {
        transactions: Infinity,
        invoices: Infinity,
        users: 5,
        storage: 50,
        aiRequests: 2000
      },
      enterprise: {
        transactions: Infinity,
        invoices: Infinity,
        users: Infinity,
        storage: 500,
        aiRequests: 10000
      }
    };

    return limits[plan] || limits.free;
  }

  // Helper: Check upgrade eligibility
  canUpgrade(currentPlan, targetPlan) {
    const hierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
    return hierarchy[targetPlan] > hierarchy[currentPlan];
  }
}

module.exports = new SubscriptionController();
