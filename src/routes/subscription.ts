import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

// GET /api/subscription - Get user's subscription
router.get('/', subscriptionController.getSubscription.bind(subscriptionController));

// POST /api/subscription/upgrade - Upgrade subscription plan
router.post('/upgrade', subscriptionController.upgradePlan.bind(subscriptionController));

// GET /api/subscription/plans - Get all available plans
router.get('/plans', subscriptionController.getAllPlans.bind(subscriptionController));

// GET /api/subscription/check-feature - Check feature access
router.get('/check-feature', subscriptionController.checkFeatureAccess.bind(subscriptionController));

export default router;
