import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';

export class SubscriptionController {
  // Get user's current subscription
  async getSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await subscriptionService.getSubscription(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        data: result.subscription,
        message: 'Subscription retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Upgrade subscription plan
  async upgradePlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { planId } = req.body;

      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          error: 'User ID and plan ID are required'
        });
      }

      const result = await subscriptionService.upgradePlan(userId, planId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: result.subscription,
        message: result.message || 'Plan upgraded successfully'
      });
    } catch (error) {
      console.error('Error upgrading plan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get all available plans
  async getAllPlans(req: Request, res: Response) {
    try {
      const plans = subscriptionService.getAllPlans();

      res.json({
        success: true,
        data: plans,
        message: 'Plans retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Check feature access
  async checkFeatureAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId as string;
      const feature = req.query.feature as string;

      if (!userId || !feature) {
        return res.status(400).json({
          success: false,
          error: 'User ID and feature are required'
        });
      }

      const result = await subscriptionService.checkFeatureAccess(userId, feature);

      res.json({
        success: result.success,
        data: {
          hasAccess: result.hasAccess
        },
        message: result.hasAccess ? 'Feature is accessible' : 'Feature requires plan upgrade'
      });
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
export default subscriptionController;
