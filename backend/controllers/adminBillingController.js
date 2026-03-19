const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const AIUsage = require('../models/AIUsage');
const User = require('../models/User');
const PricingPlan = require('../models/PricingPlan');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

class AdminBillingController {
  /**
   * Get billing analytics and statistics
   */
  async getBillingStats(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      // Parse dates
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const toDate = dateTo ? new Date(dateTo) : new Date();

      // Get subscription analytics
      const subscriptionStats = await Subscription.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate, $lte: toDate }
          }
        },
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

      // Get revenue stats
      const revenueStats = await Transaction.getRevenueStats(fromDate, toDate);

      // Get AI credits revenue
      const aiRevenueStats = await AIUsage.getRevenueFromAI(fromDate, toDate);

      // Get churn stats
      const churnStats = await Subscription.aggregate([
        {
          $match: {
            status: 'cancelled',
            cancelledAt: { $gte: fromDate, $lte: toDate }
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

      // Calculate growth metrics
      const previousPeriodStart = new Date(fromDate.getTime() - (toDate - fromDate));
      const previousRevenue = await Transaction.getRevenueStats(previousPeriodStart, fromDate);
      
      const currentTotalRevenue = revenueStats[0]?.totalRevenue || 0;
      const previousTotalRevenue = previousRevenue[0]?.totalRevenue || 0;
      const revenueGrowth = previousTotalRevenue > 0 
        ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue * 100).toFixed(1)
        : 0;

      // Get active subscriptions count
      const activeSubscriptions = await Subscription.countDocuments({ 
        status: 'active',
        endDate: { $gt: new Date() }
      });

      // Get failed payments
      const failedPayments = await Transaction.countDocuments({
        status: 'failed',
        createdAt: { $gte: fromDate, $lte: toDate }
      });

      const totalPayments = await Transaction.countDocuments({
        createdAt: { $gte: fromDate, $lte: toDate }
      });

      const paymentFailureRate = totalPayments > 0 
        ? (failedPayments / totalPayments * 100).toFixed(1)
        : 0;

      // Get AI credits sold
      const creditsSold = await AIUsage.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: { $gte: fromDate, $lte: toDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$creditsUsed' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalRevenue: currentTotalRevenue,
          revenueGrowth: parseFloat(revenueGrowth),
          activeSubscriptions,
          aiCreditsRevenue: aiRevenueStats[0]?.totalRevenue || 0,
          creditsSold: creditsSold[0]?.totalCredits || 0,
          failedPayments,
          paymentFailureRate: parseFloat(paymentFailureRate),
          subscriptionStats,
          revenueStats: revenueStats[0] || {},
          aiRevenueStats: aiRevenueStats[0] || {},
          churnStats,
          period: {
            from: fromDate,
            to: toDate
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get billing stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get billing statistics'
      });
    }
  }

  /**
   * Get all subscriptions with filtering
   */
  async getSubscriptions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        plan, 
        dateFrom, 
        dateTo, 
        search 
      } = req.query;

      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (plan) {
        query.plan = plan;
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      if (search) {
        query.$or = [
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } },
          { 'user.company': { $regex: search, $options: 'i' } }
        ];
      }

      // Get subscriptions with pagination
      const subscriptions = await Subscription.find(query)
        .populate('user', 'name email company')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Subscription.countDocuments(query);

      res.json({
        success: true,
        data: {
          subscriptions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get subscriptions'
      });
    }
  }

  /**
   * Get all transactions with filtering
   */
  async getTransactions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        type, 
        paymentMethod, 
        dateFrom, 
        dateTo, 
        search 
      } = req.query;

      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (type) {
        query.type = type;
      }
      
      if (paymentMethod) {
        query.paymentMethod = paymentMethod;
      }
      
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      if (search) {
        query.$or = [
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } },
          { reference: { $regex: search, $options: 'i' } }
        ];
      }

      // Get transactions with pagination
      const transactions = await Transaction.find(query)
        .populate('user', 'name email company')
        .populate('subscription', 'plan billingCycle')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

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
      logger.error('Failed to get transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions'
      });
    }
  }

  /**
   * Update user subscription (admin override)
   */
  async updateUserSubscription(req, res) {
    try {
      const { userId } = req.params;
      const { plan, billingCycle, action, reason } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      let result;

      switch (action) {
        case 'upgrade':
          result = await subscriptionService.upgradeSubscription(userId, plan, billingCycle);
          break;
        
        case 'downgrade':
          result = await subscriptionService.downgradeSubscription(userId, plan);
          break;
        
        case 'cancel':
          result = await subscriptionService.cancelSubscription(userId, reason || 'Admin cancelled');
          break;
        
        case 'activate':
          // Manually activate subscription
          const subscription = await Subscription.findByUser(userId);
          if (!subscription) {
            return res.status(404).json({
              success: false,
              error: 'Subscription not found'
            });
          }
          
          subscription.status = 'active';
          subscription.inGracePeriod = false;
          subscription.gracePeriodEnds = null;
          await subscription.save();
          
          result = { subscription };
          break;
        
        case 'suspend':
          // Suspend subscription
          const suspendSubscription = await Subscription.findByUser(userId);
          if (!suspendSubscription) {
            return res.status(404).json({
              success: false,
              error: 'Subscription not found'
            });
          }
          
          suspendSubscription.status = 'suspended';
          await suspendSubscription.save();
          
          result = { subscription: suspendSubscription };
          break;
        
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action'
          });
      }

      res.json({
        success: true,
        data: result.subscription,
        message: `Subscription ${action}d successfully`
      });
    } catch (error) {
      logger.error('Failed to update user subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update subscription'
      });
    }
  }

  /**
   * Get detailed user billing information
   */
  async getUserBillingDetails(req, res) {
    try {
      const { userId } = req.params;

      // Get user subscription
      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      // Get user transactions
      const transactions = await Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(50);

      // Get AI usage
      const aiUsage = await AIUsage.findByUser(userId, { limit: 100 });

      // Calculate usage statistics
      const usageStats = await AIUsage.getUserUsageStats(userId, 'month');

      res.json({
        success: true,
        data: {
          subscription,
          transactions,
          aiUsage,
          usageStats: usageStats[0] || {
            totalRequests: 0,
            totalCredits: 0,
            totalCost: 0
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get user billing details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user billing details'
      });
    }
  }

  /**
   * Add AI credits to user (admin)
   */
  async addAICredits(req, res) {
    try {
      const { userId } = req.params;
      const { credits, reason } = req.body;

      if (!userId || !credits || credits <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid user ID and positive credit amount are required'
        });
      }

      const subscription = await Subscription.findByUser(userId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      // Add credits
      await subscription.addAICredits(credits, reason || 'Admin bonus');

      res.json({
        success: true,
        data: {
          creditsAdded: credits,
          totalCredits: subscription.aiCredits.total,
          availableCredits: subscription.aiCredits.available
        },
        message: `Added ${credits} AI credits to user account`
      });
    } catch (error) {
      logger.error('Failed to add AI credits:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add AI credits'
      });
    }
  }

  /**
   * Get revenue by payment method
   */
  async getRevenueByPaymentMethod(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const matchStage = {
        status: 'completed',
        createdAt: {}
      };
      
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);

      const revenueByMethod = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            totalRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      res.json({
        success: true,
        data: revenueByMethod
      });
    } catch (error) {
      logger.error('Failed to get revenue by payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get revenue by payment method'
      });
    }
  }

  /**
   * Export billing data
   */
  async exportBillingData(req, res) {
    try {
      const { format = 'json', dateFrom, dateTo } = req.query;
      
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = dateTo ? new Date(dateTo) : new Date();

      // Get all transactions in date range
      const transactions = await Transaction.find({
        createdAt: { $gte: fromDate, $lte: toDate }
      })
        .populate('user', 'name email company')
        .populate('subscription', 'plan billingCycle')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // Convert to CSV
        const csv = [
          'Date,User,Email,Company,Type,Amount,Currency,Payment Method,Status,Reference'
        ];
        
        transactions.forEach(transaction => {
          csv.push([
            transaction.createdAt.toISOString(),
            transaction.user?.name || '',
            transaction.user?.email || '',
            transaction.user?.company || '',
            transaction.type,
            transaction.amount,
            transaction.currency,
            transaction.paymentMethod,
            transaction.status,
            transaction.reference
          ].join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="billing-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv.join('\n'));
      } else {
        // Return JSON
        res.json({
          success: true,
          data: {
            transactions,
            period: {
              from: fromDate,
              to: toDate
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to export billing data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export billing data'
      });
    }
  }

  /**
   * Process expiring subscriptions (admin task)
   */
  async processExpiringSubscriptions(req, res) {
    try {
      const result = await subscriptionService.processExpiringSubscriptions();

      res.json({
        success: true,
        data: result,
        message: 'Processed expiring subscriptions successfully'
      });
    } catch (error) {
      logger.error('Failed to process expiring subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process expiring subscriptions'
      });
    }
  }
}

module.exports = new AdminBillingController();
