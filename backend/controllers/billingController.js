const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const AIUsage = require('../models/AIUsage');
const User = require('../models/User');
const subscriptionService = require('../services/subscriptionService');
const mobileMoneyService = require('../services/mobileMoneyService');
const logger = require('../utils/logger');

class BillingController {
  /**
   * Get available pricing plans
   */
  async getPricingPlans(req, res) {
    try {
      const plans = await PricingPlan.getAvailablePlans();
      
      res.json({
        success: true,
        data: plans.map(plan => ({
          ...plan.toObject(),
          yearlySavings: plan.getYearlySavings()
        }))
      });
    } catch (error) {
      logger.error('Failed to get pricing plans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load pricing plans'
      });
    }
  }

  /**
   * Calculate subscription cost
   */
  async calculateCost(req, res) {
    try {
      const { plan, billingCycle = 'monthly', discountCode } = req.body;

      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Plan is required'
        });
      }

      const cost = await subscriptionService.calculateSubscriptionCost(plan, billingCycle, discountCode);

      res.json({
        success: true,
        data: cost
      });
    } catch (error) {
      logger.error('Failed to calculate cost:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate cost'
      });
    }
  }

  /**
   * Create or update subscription
   */
  async createSubscription(req, res) {
    try {
      const { plan, billingCycle = 'monthly' } = req.body;
      const userId = req.user.id;

      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Plan is required'
        });
      }

      const result = await subscriptionService.createSubscription(userId, plan, billingCycle);

      res.json({
        success: true,
        data: result.subscription,
        message: result.message
      });
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create subscription'
      });
    }
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(req, res) {
    try {
      const { newPlan, billingCycle = 'monthly' } = req.body;
      const userId = req.user.id;

      if (!newPlan) {
        return res.status(400).json({
          success: false,
          error: 'New plan is required'
        });
      }

      const result = await subscriptionService.upgradeSubscription(userId, newPlan, billingCycle);

      res.json({
        success: true,
        data: result.subscription,
        message: result.message
      });
    } catch (error) {
      logger.error('Failed to upgrade subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upgrade subscription'
      });
    }
  }

  /**
   * Downgrade subscription
   */
  async downgradeSubscription(req, res) {
    try {
      const { newPlan, effectiveDate } = req.body;
      const userId = req.user.id;

      if (!newPlan) {
        return res.status(400).json({
          success: false,
          error: 'New plan is required'
        });
      }

      const result = await subscriptionService.downgradeSubscription(userId, newPlan, effectiveDate);

      res.json({
        success: true,
        data: result.subscription,
        message: result.message
      });
    } catch (error) {
      logger.error('Failed to downgrade subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to downgrade subscription'
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      const { reason } = req.body;
      const userId = req.user.id;

      const result = await subscriptionService.cancelSubscription(userId, reason);

      res.json({
        success: true,
        data: result.subscription,
        message: result.message
      });
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(req, res) {
    try {
      const userId = req.user.id;

      const status = await subscriptionService.checkSubscriptionStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get subscription status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subscription status'
      });
    }
  }

  /**
   * Check usage limits
   */
  async checkUsageLimits(req, res) {
    try {
      const { feature } = req.params;
      const userId = req.user.id;
      const currentUsage = req.body.currentUsage;

      const limitCheck = await subscriptionService.checkUsageLimit(userId, feature, currentUsage);

      res.json({
        success: true,
        data: limitCheck
      });
    } catch (error) {
      logger.error('Failed to check usage limits:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check usage limits'
      });
    }
  }

  /**
   * Track usage
   */
  async trackUsage(req, res) {
    try {
      const { feature, increment = 1 } = req.body;
      const userId = req.user.id;

      if (!feature) {
        return res.status(400).json({
          success: false,
          error: 'Feature is required'
        });
      }

      const result = await subscriptionService.trackUsage(userId, feature, increment);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Failed to track usage:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to track usage'
      });
    }
  }

  /**
   * Purchase AI credits
   */
  async purchaseAICredits(req, res) {
    try {
      const { credits, paymentMethod, paymentDetails } = req.body;
      const userId = req.user.id;

      if (!credits || !paymentMethod || !paymentDetails) {
        return res.status(400).json({
          success: false,
          error: 'Credits, payment method, and payment details are required'
        });
      }

      const result = await subscriptionService.purchaseAICredits(userId, credits, paymentMethod, paymentDetails);

      res.json({
        success: true,
        data: {
          transaction: result.transaction,
          creditsAdded: result.creditsAdded,
          totalCredits: result.totalCredits
        },
        message: result.message
      });
    } catch (error) {
      logger.error('Failed to purchase AI credits:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to purchase AI credits'
      });
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

      const query = { user: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('subscription', 'plan billingCycle');

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get billing history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get billing history'
      });
    }
  }

  /**
   * Get AI usage statistics
   */
  async getAIUsageStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      const stats = await AIUsage.getUserUsageStats(userId, period);

      res.json({
        success: true,
        data: stats[0] || {
          totalRequests: 0,
          totalCredits: 0,
          totalCost: 0,
          averageCreditsPerRequest: 0,
          averageCostPerRequest: 0
        }
      });
    } catch (error) {
      logger.error('Failed to get AI usage stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI usage stats'
      });
    }
  }

  /**
   * Process payment (for subscription or credits)
   */
  async processPayment(req, res) {
    try {
      const { plan, billingCycle, amount, paymentMethod, phoneNumber, currency = 'UGX' } = req.body;
      const userId = req.user.id;

      // Validate phone number
      const phoneValidation = mobileMoneyService.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          success: false,
          error: phoneValidation.error
        });
      }

      // Generate transaction reference
      const reference = mobileMoneyService.generateReference('PAY');

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: plan ? 'subscription_payment' : 'ai_credit_purchase',
        amount,
        currency,
        paymentMethod,
        paymentDetails: {
          phoneNumber: phoneValidation.normalizedNumber
        },
        description: plan ? `${plan} subscription (${billingCycle})` : 'AI credits purchase',
        status: 'pending',
        reference
      });

      await transaction.save();

      // Process payment via mobile money
      const paymentResults = await mobileMoneyService.processPayment(
        phoneValidation.normalizedNumber,
        amount,
        reference,
        paymentMethod
      );

      const successfulPayment = paymentResults.find(result => result.success);
      
      if (successfulPayment) {
        // Update transaction
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.paymentDetails.transactionId = successfulPayment.reference;
        await transaction.save();

        // If this is a subscription payment, activate subscription
        if (plan) {
          await subscriptionService.processSubscriptionPayment(userId, paymentMethod, {
            phoneNumber: phoneValidation.normalizedNumber
          });
        }

        res.json({
          success: true,
          data: {
            transaction,
            paymentReference: successfulPayment.reference,
            status: 'completed'
          },
          message: 'Payment processed successfully'
        });
      } else {
        // Update transaction status
        transaction.status = 'failed';
        transaction.failedAt = new Date();
        await transaction.save();

        res.status(400).json({
          success: false,
          error: 'Payment failed. Please try again.',
          details: paymentResults
        });
      }
    } catch (error) {
      logger.error('Failed to process payment:', error);
      res.status(500).json({
        success: false,
        error: 'Payment processing failed'
      });
    }
  }

  /**
   * Get supported payment methods
   */
  async getPaymentMethods(req, res) {
    try {
      const providers = mobileMoneyService.getSupportedProviders();

      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment methods'
      });
    }
  }

  /**
   * Handle payment webhooks
   */
  async handleWebhook(req, res) {
    try {
      const { provider } = req.params;
      const webhookData = req.body;

      // Process webhook based on provider
      const processedData = mobileMoneyService.handleWebhook(provider, webhookData);

      // Find and update transaction
      const transaction = await Transaction.findOne({ reference: processedData.reference });
      
      if (transaction) {
        transaction.status = processedData.status;
        
        if (processedData.status === 'completed') {
          transaction.completedAt = processedData.timestamp;
          
          // Activate subscription if this is a subscription payment
          if (transaction.type === 'subscription_payment') {
            await subscriptionService.processSubscriptionPayment(
              transaction.user,
              transaction.paymentMethod,
              transaction.paymentDetails
            );
          }
        } else if (processedData.status === 'failed') {
          transaction.failedAt = processedData.timestamp;
        }
        
        await transaction.save();
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Failed to handle webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }
}

module.exports = new BillingController();
