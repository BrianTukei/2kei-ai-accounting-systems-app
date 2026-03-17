import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Sparkles, Zap, Building2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

/**
 * Subscription/Plan Upgrade Component
 * Displays available plans and handles upgrades
 */
export function PlanUpgrade() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscription/plans');
      if (response.data.success) {
        setPlans(response.data.data.plans);
        setCurrentPlan(response.data.data.currentPlan);
      }
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setIsUpgrading(true);
    setSelectedPlan(planId);

    try {
      const response = await api.post('/subscription/upgrade', {
        plan: planId,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        paymentProvider: 'stripe' // Default provider
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh page or redirect to dashboard
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'professional':
        return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'enterprise':
        return <Building2 className="w-6 h-6 text-indigo-500" />;
      default:
        return <Check className="w-6 h-6 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">
          Upgrade to unlock more features and grow your business
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-gray-500'}`}>
            Annual
            <Badge variant="secondary" className="ml-2 text-xs">
              Save up to 17%
            </Badge>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const isCurrent = plan.id === currentPlan;
          const canUpgrade = plan.canUpgrade;

          return (
            <Card 
              key={plan.id}
              className={`relative ${
                isCurrent 
                  ? 'border-blue-500 border-2' 
                  : plan.id === 'professional'
                    ? 'border-purple-200 shadow-lg'
                    : ''
              }`}
            >
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                  Current Plan
                </Badge>
              )}
              
              {plan.id === 'professional' && !isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>
                  {plan.id === 'free' && 'Perfect for getting started'}
                  {plan.id === 'starter' && 'For small businesses'}
                  {plan.id === 'professional' && 'For growing businesses'}
                  {plan.id === 'enterprise' && 'For large organizations'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center">
                  <span className="text-3xl font-bold">
                    ${price}
                  </span>
                  <span className="text-gray-500 text-sm">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                  
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      Save ${plan.savings}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading}
                  >
                    {isUpgrading && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled
                  >
                    Not Available
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>All plans include secure data storage and bank-level encryption.</p>
        <p className="mt-1">
          Questions? <a href="/support" className="text-blue-600 hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}

export default PlanUpgrade;
