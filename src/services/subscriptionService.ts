import { supabase } from './supabaseBackend';

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_id: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_method?: string;
  last_payment_date?: string;
  next_payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number;
    transactions: number;
    storage: number;
    support: string;
  };
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic accounting for startups',
    price: 0,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Up to 100 transactions', 'Basic reports', 'Email support', 'Single user'],
    limits: {
      users: 1,
      transactions: 100,
      storage: 100, // MB
      support: 'email'
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    price: 9.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Up to 1,000 transactions', 'Advanced reports', 'Priority email support', 'Up to 3 users', 'Receipt scanning', 'AI insights'],
    limits: {
      users: 3,
      transactions: 1000,
      storage: 1000, // MB
      support: 'priority_email'
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    price: 29.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Unlimited transactions', 'Custom reports', '24/7 phone support', 'Up to 10 users', 'API access', 'Multi-currency', 'Advanced AI', 'Team collaboration'],
    limits: {
      users: 10,
      transactions: -1, // unlimited
      storage: 10000, // MB
      support: '24_7_phone'
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Everything in Professional', 'Unlimited users', 'Dedicated account manager', 'Custom integrations', 'White-label option', 'On-premise deployment', 'SLA guarantee'],
    limits: {
      users: -1, // unlimited
      transactions: -1, // unlimited
      storage: -1, // unlimited
      support: 'dedicated'
    }
  }
};

class SubscriptionService {
  // Get user's current subscription
  async getSubscription(userId: string): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found, create free plan
          return await this.createFreeSubscription(userId);
        }
        return {
          success: false,
          error: 'Failed to fetch subscription: ' + error.message
        };
      }

      return {
        success: true,
        subscription: subscription as Subscription
      };
    } catch (error) {
      console.error('Exception fetching subscription:', error);
      return {
        success: false,
        error: 'Exception fetching subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Create free subscription for new users
  async createFreeSubscription(userId: string): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10); // 10 years for free plan

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: 'free',
          plan_id: 'free',
          price: 0,
          currency: 'USD',
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          billing_cycle: 'monthly'
        })
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: 'Failed to create free subscription: ' + error.message
        };
      }

      return {
        success: true,
        subscription: subscription as Subscription
      };
    } catch (error) {
      console.error('Exception creating free subscription:', error);
      return {
        success: false,
        error: 'Exception creating free subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Upgrade subscription plan
  async upgradePlan(userId: string, planId: string): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    try {
      // Validate plan exists
      const plan = PLANS[planId];
      if (!plan) {
        return {
          success: false,
          error: 'Invalid plan ID: ' + planId
        };
      }

      // Get current subscription
      const currentSub = await this.getSubscription(userId);
      
      // Calculate dates
      const now = new Date();
      const endDate = new Date();
      
      if (plan.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      let subscription;
      
      if (currentSub.success && currentSub.subscription) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            plan_name: plan.name,
            plan_id: planId,
            price: plan.price,
            currency: plan.currency,
            billing_cycle: plan.billing_cycle,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', currentSub.subscription.id)
          .select('*')
          .single();

        if (error) {
          return {
            success: false,
            error: 'Failed to upgrade subscription: ' + error.message
          };
        }

        subscription = data;
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_name: plan.name,
            plan_id: planId,
            price: plan.price,
            currency: plan.currency,
            status: 'active',
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            billing_cycle: plan.billing_cycle
          })
          .select('*')
          .single();

        if (error) {
          return {
            success: false,
            error: 'Failed to create subscription: ' + error.message
          };
        }

        subscription = data;
      }

      return {
        success: true,
        subscription: subscription as Subscription,
        message: `Successfully upgraded to ${plan.name} plan`
      };
    } catch (error) {
      console.error('Exception upgrading plan:', error);
      return {
        success: false,
        error: 'Exception upgrading plan: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Check if user has access to feature based on plan
  async checkFeatureAccess(userId: string, feature: string): Promise<{ success: boolean; hasAccess: boolean; error?: string }> {
    try {
      const subResult = await this.getSubscription(userId);
      
      if (!subResult.success || !subResult.subscription) {
        return {
          success: false,
          hasAccess: false,
          error: 'No active subscription found'
        };
      }

      const plan = PLANS[subResult.subscription.plan_id];
      
      if (!plan) {
        return {
          success: false,
          hasAccess: false,
          error: 'Invalid subscription plan'
        };
      }

      // Check if feature is in plan features
      const hasAccess = plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));

      return {
        success: true,
        hasAccess
      };
    } catch (error) {
      console.error('Exception checking feature access:', error);
      return {
        success: false,
        hasAccess: false,
        error: 'Exception checking feature access'
      };
    }
  }

  // Get all available plans
  getAllPlans(): Plan[] {
    return Object.values(PLANS);
  }

  // Check if subscription is active
  isSubscriptionActive(subscription: Subscription): boolean {
    if (subscription.status !== 'active') return false;
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    
    return now <= endDate;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
