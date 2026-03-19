const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const PricingPlan = require('../models/PricingPlan');
const Transaction = require('../models/Transaction');
const mobileMoneyService = require('./mobileMoneyService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Create subscription for new user
   */
  async createSubscription(userId, plan = 'FREE', billingCycle = 'monthly') {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if subscription already exists
      const existingSubscription = await Subscription.findByUser(userId);
      if (existingSubscription) {
        throw new Error('User already has a subscription');
      }

      // Get pricing plan
      const pricingPlan = await PricingPlan.getPlanByName(plan);
      if (!pricingPlan) {
        throw new Error('Pricing plan not found');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const nextBillingDate = new Date(endDate);

      // Calculate price
      const price = billingCycle === 'yearly' ? pricingPlan.yearlyPrice : pricingPlan.monthlyPrice;

      // Create subscription
      const subscription = new Subscription({
        user: userId,
        plan: plan,
        billingCycle,
        startDate,
        endDate,
        nextBillingDate,
        status: 'active',
        price,
        currency: 'UGX',
        paymentMethod: 'manual', // Will be updated when payment is made
        limits: {
          maxTransactions: pricingPlan.limits.maxTransactions,
          maxUsers: pricingPlan.limits.maxUsers,
          maxReports: pricingPlan.limits.maxReports,
          aiCredits: pricingPlan.aiCredits.monthlyCredits
        },
        aiCredits: {
          total: pricingPlan.aiCredits.monthlyCredits,
          used: 0,
          available: pricingPlan.aiCredits.monthlyCredits
        }
      });

      await subscription.save();

      // Update user with subscription reference
      user.subscription = subscription._id;
      user.plan = plan;
      await user.save();

      logger.info(`Subscription created for user ${userId}: ${plan} plan`);

      return {
        success: true,
        subscription,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgradeSubscription(userId, newPlan, billingCycle = 'monthly') {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const currentPlan = subscription.plan;
      
      // Get new pricing plan
      const pricingPlan = await PricingPlan.getPlanByName(newPlan);
      if (!pricingPlan) {
        throw new Error('Pricing plan not found');
      }

      // Calculate new price
      const newPrice = billingCycle === 'yearly' ? pricingPlan.yearlyPrice : pricingPlan.monthlyPrice;

      // Record plan change
      subscription.planChanges.push({
        fromPlan: currentPlan,
        toPlan: newPlan,
        changeDate: new Date(),
        reason: 'User requested upgrade',
        initiatedBy: 'user'
      });

      // Update subscription
      subscription.plan = newPlan;
      subscription.billingCycle = billingCycle;
      subscription.price = newPrice;
      subscription.limits = {
        maxTransactions: pricingPlan.limits.maxTransactions,
        maxUsers: pricingPlan.limits.maxUsers,
        maxReports: pricingPlan.limits.maxReports,
        aiCredits: pricingPlan.aiCredits.monthlyCredits
      };

      // Add additional AI credits if upgrading
      const additionalCredits = pricingPlan.aiCredits.monthlyCredits - subscription.aiCredits.total;
      if (additionalCredits > 0) {
        subscription.aiCredits.total += additionalCredits;
        subscription.aiCredits.available += additionalCredits;
      }

      // Extend subscription if payment is successful
      const now = new Date();
      subscription.endDate = new Date(now);
      subscription.nextBillingDate = new Date(now);
      
      if (billingCycle === 'yearly') {
        subscription.endDate.setFullYear(subscription.endDate.getFullYear() + 1);
        subscription.nextBillingDate.setFullYear(subscription.nextBillingDate.getFullYear() + 1);
      } else {
        subscription.endDate.setMonth(subscription.endDate.getMonth() + 1);
        subscription.nextBillingDate.setMonth(subscription.nextBillingDate.getMonth() + 1);
      }

      await subscription.save();

      // Update user plan
      await User.findByIdAndUpdate(userId, { plan: newPlan });

      logger.info(`Subscription upgraded for user ${userId}: ${currentPlan} -> ${newPlan}`);

      return {
        success: true,
        subscription,
        message: 'Subscription upgraded successfully'
      };
    } catch (error) {
      logger.error('Failed to upgrade subscription:', error);
      throw error;
    }
  }

  /**
   * Downgrade subscription plan
   */
  async downgradeSubscription(userId, newPlan, effectiveDate = null) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const currentPlan = subscription.plan;
      
      // Get new pricing plan
      const pricingPlan = await PricingPlan.getPlanByName(newPlan);
      if (!pricingPlan) {
        throw new Error('Pricing plan not found');
      }

      // Calculate new price
      const newPrice = subscription.billingCycle === 'yearly' ? pricingPlan.yearlyPrice : pricingPlan.monthlyPrice;

      // Record plan change
      subscription.planChanges.push({
        fromPlan: currentPlan,
        toPlan: newPlan,
        changeDate: new Date(),
        reason: 'User requested downgrade',
        initiatedBy: 'user'
      });

      // Update subscription
      subscription.plan = newPlan;
      subscription.price = newPrice;
      subscription.limits = {
        maxTransactions: pricingPlan.limits.maxTransactions,
        maxUsers: pricingPlan.limits.maxUsers,
        maxReports: pricingPlan.limits.maxReports,
        aiCredits: pricingPlan.aiCredits.monthlyCredits
      };

      // Adjust AI credits
      subscription.aiCredits.total = pricingPlan.aiCredits.monthlyCredits;
      subscription.aiCredits.available = Math.min(subscription.aiCredits.available, pricingPlan.aiCredits.monthlyCredits);

      // Set effective date for downgrade
      if (effectiveDate) {
        subscription.cancellationEffectiveDate = effectiveDate;
      }

      await subscription.save();

      // Update user plan
      await User.findByIdAndUpdate(userId, { plan: newPlan });

      logger.info(`Subscription downgraded for user ${userId}: ${currentPlan} -> ${newPlan}`);

      return {
        success: true,
        subscription,
        message: 'Subscription downgraded successfully'
      };
    } catch (error) {
      logger.error('Failed to downgrade subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, reason = '') {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancelReason = reason;
      subscription.autoRenew = false;
      subscription.cancellationEffectiveDate = subscription.endDate;

      await subscription.save();

      logger.info(`Subscription cancelled for user ${userId}: ${reason}`);

      return {
        success: true,
        subscription,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(userId, paymentMethod, paymentDetails) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate transaction reference
      const reference = mobileMoneyService.generateReference('SUB');

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        company: user.company,
        type: 'subscription_payment',
        amount: subscription.price,
        currency: 'UGX',
        paymentMethod,
        paymentDetails,
        description: `${subscription.plan} subscription (${subscription.billingCycle})`,
        status: 'pending',
        subscription: subscription._id,
        reference
      });

      await transaction.save();

      // Process payment via mobile money
      const paymentResults = await mobileMoneyService.processPayment(
        paymentDetails.phoneNumber,
        subscription.price,
        reference,
        paymentMethod === 'mtn_momo' ? 'mtn_momo' : paymentMethod === 'airtel_money' ? 'airtel_money' : 'flutterwave'
      );

      // Check if any payment was successful
      const successfulPayment = paymentResults.find(result => result.success);
      
      if (successfulPayment) {
        // Update transaction status
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.paymentDetails = {
          ...transaction.paymentDetails,
          transactionId: successfulPayment.reference,
          reference: successfulPayment.reference
        };
        await transaction.save();

        // Update subscription
        subscription.paymentMethod = paymentMethod;
        subscription.paymentDetails = paymentDetails;
        subscription.status = 'active';
        subscription.autoRenew = true;
        
        // Extend subscription
        await subscription.extendSubscription(subscription.billingCycle);

        // Add to billing history
        subscription.billingHistory.push({
          date: new Date(),
          amount: subscription.price,
          currency: 'UGX',
          status: 'paid',
          paymentMethod,
          transactionId: transaction._id,
          description: `${subscription.plan} subscription (${subscription.billingCycle})`
        });

        await subscription.save();

        // Send confirmation notification
        await notificationService.sendPaymentConfirmation(user, transaction, subscription);

        logger.info(`Subscription payment successful for user ${userId}: ${subscription.price} UGX`);

        return {
          success: true,
          transaction,
          subscription,
          message: 'Payment processed successfully'
        };
      } else {
        // Update transaction status to failed
        transaction.status = 'failed';
        transaction.failedAt = new Date();
        transaction.error = {
          code: 'PAYMENT_FAILED',
          message: 'All payment methods failed',
          details: paymentResults
        };
        await transaction.save();

        // Send failure notification
        await notificationService.sendPaymentFailure(user, transaction);

        logger.error(`Subscription payment failed for user ${userId}: ${subscription.price} UGX`);

        return {
          success: false,
          transaction,
          error: 'Payment failed. Please try again.',
          details: paymentResults
        };
      }
    } catch (error) {
      logger.error('Failed to process subscription payment:', error);
      throw error;
    }
  }

  /**
   * Check subscription status and usage
   */
  async checkSubscriptionStatus(userId) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        return {
          subscribed: false,
          plan: 'FREE',
          status: 'none',
          usage: null
        };
      }

      const now = new Date();
      const daysUntilExpiry = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));

      return {
        subscribed: true,
        plan: subscription.plan,
        status: subscription.status,
        daysUntilExpiry,
        isActive: subscription.isActive,
        inGracePeriod: subscription.inGracePeriod,
        autoRenew: subscription.autoRenew,
        nextBillingDate: subscription.nextBillingDate,
        usage: {
          transactions: subscription.currentUsage.transactions,
          aiCredits: {
            total: subscription.aiCredits.total,
            used: subscription.aiCredits.used,
            available: subscription.aiCredits.available
          },
          limits: subscription.limits,
          percentage: subscription.usagePercentage
        }
      };
    } catch (error) {
      logger.error('Failed to check subscription status:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform action based on subscription
   */
  async checkUsageLimit(userId, feature, currentUsage = null) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        // Free plan limits
        const freeLimits = {
          maxTransactions: 50,
          maxUsers: 1,
          maxReports: 10,
          aiCredits: 0
        };

        const usage = currentUsage !== null ? currentUsage : 0;
        const limit = freeLimits[feature] || 0;

        return {
          allowed: usage < limit,
          remaining: Math.max(0, limit - usage),
          percentageUsed: (usage / limit) * 100,
          limit,
          currentUsage: usage,
          plan: 'FREE',
          needsUpgrade: usage >= limit
        };
      }

      return subscription.checkUsageLimit(feature, currentUsage);
    } catch (error) {
      logger.error('Failed to check usage limit:', error);
      throw error;
    }
  }

  /**
   * Track usage increment
   */
  async trackUsage(userId, feature, increment = 1) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update usage
      if (feature === 'aiCredits') {
        await subscription.useAICredits(increment);
      } else {
        subscription.currentUsage[feature] = (subscription.currentUsage[feature] || 0) + increment;
        await subscription.save();
      }

      // Check if user is approaching limits
      const limitCheck = subscription.checkUsageLimit(feature);
      
      if (!limitCheck.allowed) {
        // Send usage limit notification
        const user = await User.findById(userId);
        await notificationService.sendUsageLimitNotification(user, feature, limitCheck);
      }

      return {
        success: true,
        usage: subscription.currentUsage[feature],
        limit: subscription.limits[feature],
        percentage: limitCheck.percentageUsed,
        needsUpgrade: !limitCheck.allowed
      };
    } catch (error) {
      logger.error('Failed to track usage:', error);
      throw error;
    }
  }

  /**
   * Purchase AI credits
   */
  async purchaseAICredits(userId, credits, paymentMethod, paymentDetails) {
    try {
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate cost (500 UGX per credit)
      const creditPrice = 500;
      const totalCost = credits * creditPrice;

      // Generate transaction reference
      const reference = mobileMoneyService.generateReference('AI');

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        company: user.company,
        type: 'ai_credit_purchase',
        amount: totalCost,
        currency: 'UGX',
        paymentMethod,
        paymentDetails,
        description: `Purchase ${credits} AI credits`,
        status: 'pending',
        reference
      });

      await transaction.save();

      // Process payment
      const paymentResults = await mobileMoneyService.processPayment(
        paymentDetails.phoneNumber,
        totalCost,
        reference,
        paymentMethod === 'mtn_momo' ? 'mtn_momo' : paymentMethod === 'airtel_money' ? 'airtel_money' : 'flutterwave'
      );

      const successfulPayment = paymentResults.find(result => result.success);
      
      if (successfulPayment) {
        // Update transaction
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        transaction.paymentDetails = {
          ...transaction.paymentDetails,
          transactionId: successfulPayment.reference,
          reference: successfulPayment.reference
        };
        await transaction.save();

        // Add credits to subscription
        await subscription.addAICredits(credits, `Purchase of ${credits} AI credits`);

        // Send confirmation
        await notificationService.sendAICreditsConfirmation(user, credits, totalCost, transaction);

        logger.info(`AI credits purchased for user ${userId}: ${credits} credits for ${totalCost} UGX`);

        return {
          success: true,
          transaction,
          creditsAdded: credits,
          totalCredits: subscription.aiCredits.total,
          message: 'AI credits purchased successfully'
        };
      } else {
        // Update transaction status
        transaction.status = 'failed';
        transaction.failedAt = new Date();
        await transaction.save();

        return {
          success: false,
          transaction,
          error: 'Payment failed. Please try again.',
          details: paymentResults
        };
      }
    } catch (error) {
      logger.error('Failed to purchase AI credits:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(dateFrom, dateTo) {
    try {
      const matchStage = {};
      if (dateFrom || dateTo) {
        matchStage.createdAt = {};
        if (dateFrom) matchStage.createdAt.$gte = dateFrom;
        if (dateTo) matchStage.createdAt.$lte = dateTo;
      }

      // Subscription distribution
      const subscriptionStats = await Subscription.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$price' },
            activeCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Revenue analytics
      const revenueStats = await Transaction.getRevenueStats(dateFrom, dateTo);

      // AI credits revenue
      const aiRevenueStats = await AIUsage.getRevenueFromAI(dateFrom, dateTo);

      // Churn analysis
      const churnStats = await Subscription.aggregate([
        {
          $match: {
            status: 'cancelled',
            cancelledAt: matchStage.createdAt || { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$cancelledAt' },
              month: { $month: '$cancelledAt' }
            },
            count: { $sum: 1 },
            plans: { $push: '$plan' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      return {
        subscriptionStats,
        revenueStats,
        aiRevenueStats,
        churnStats
      };
    } catch (error) {
      logger.error('Failed to get subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Process expiring subscriptions
   */
  async processExpiringSubscriptions() {
    try {
      // Find subscriptions expiring in next 7 days
      const expiringSubscriptions = await Subscription.findExpiringSoon(7);
      
      for (const subscription of expiringSubscriptions) {
        const user = await User.findById(subscription.user);
        if (user) {
          await notificationService.sendExpiryWarning(user, subscription);
        }
      }

      // Find overdue payments
      const overdueSubscriptions = await Subscription.findOverduePayments();
      
      for (const subscription of overdueSubscriptions) {
        const user = await User.findById(subscription.user);
        if (user) {
          await notificationService.sendPaymentReminder(user, subscription);
          
          // Update notification count
          subscription.notifications.lastPaymentReminder = new Date();
          subscription.notifications.paymentFailedCount += 1;
          
          // Suspend after 3 failed attempts
          if (subscription.notifications.paymentFailedCount >= 3) {
            subscription.status = 'suspended';
          }
          
          await subscription.save();
        }
      }

      return {
        expiringCount: expiringSubscriptions.length,
        overdueCount: overdueSubscriptions.length
      };
    } catch (error) {
      logger.error('Failed to process expiring subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get pricing plans for display
   */
  async getPricingPlans() {
    try {
      const plans = await PricingPlan.getAvailablePlans();
      
      return plans.map(plan => ({
        ...plan.toObject(),
        yearlySavings: plan.getYearlySavings(),
        features: plan.features.filter(f => f.included)
      }));
    } catch (error) {
      logger.error('Failed to get pricing plans:', error);
      throw error;
    }
  }

  /**
   * Calculate subscription cost
   */
  async calculateSubscriptionCost(plan, billingCycle = 'monthly', discountCode = null) {
    try {
      const pricingPlan = await PricingPlan.getPlanByName(plan);
      if (!pricingPlan) {
        throw new Error('Pricing plan not found');
      }

      let price = billingCycle === 'yearly' ? pricingPlan.yearlyPrice : pricingPlan.monthlyPrice;
      
      // Apply discount code if provided
      if (discountCode) {
        const discount = await this.applyDiscountCode(discountCode, price, plan);
        price = discount.discountedPrice;
      }

      return {
        plan,
        billingCycle,
        basePrice: pricingPlan.monthlyPrice,
        yearlyPrice: pricingPlan.yearlyPrice,
        price,
        currency: 'UGX',
        yearlySavings: pricingPlan.getYearlySavings()
      };
    } catch (error) {
      logger.error('Failed to calculate subscription cost:', error);
      throw error;
    }
  }

  /**
   * Apply discount code
   */
  async applyDiscountCode(code, price, plan) {
    // This would typically check against a discount codes database
    // For now, return no discount
    return {
      code,
      discountedPrice: price,
      discountAmount: 0,
      discountPercentage: 0
    };
  }
}

module.exports = new SubscriptionService();
