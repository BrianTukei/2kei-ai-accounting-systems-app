import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import api from '@/services/api';

/**
 * Billing Page
 * Subscription management and billing information
 */
export default function Billing() {
  const { user, subscription } = useAuth();
  const { company } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [usage, setUsage] = useState({});
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch current subscription
      const subResponse = await api.get('/subscription');
      
      // Fetch available plans
      const plansResponse = await api.get('/subscription/plans');
      
      // Fetch usage
      const usageResponse = await api.get('/subscription/usage');
      
      if (subResponse.data.success) {
        setCurrentPlan(subResponse.data.data.subscription);
      }
      
      if (plansResponse.data.success) {
        setAvailablePlans(plansResponse.data.data.plans);
      }
      
      if (usageResponse.data.success) {
        setUsage(usageResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setIsUpgrading(true);
    try {
      const response = await api.post('/subscription/upgrade', {
        plan: planId,
        billingCycle: 'monthly'
      });
      
      if (response.data.success) {
        toast.success('Subscription upgraded successfully!');
        fetchBillingData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upgrade subscription');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getUsagePercentage = (current, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'professional':
        return <TrendingUp className="w-6 h-6 text-purple-500" />;
      case 'enterprise':
        return <Users className="w-6 h-6 text-indigo-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            <Badge variant={currentPlan?.status === 'active' ? 'default' : 'secondary'}>
              {currentPlan?.status || 'Free'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getPlanIcon(currentPlan.plan)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentPlan.planDetails?.name}</h3>
                  <p className="text-gray-600">
                    ${currentPlan.planDetails?.price || 0}/{currentPlan.planDetails?.billingCycle || 'month'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Period</p>
                  <p className="font-medium">
                    {new Date(currentPlan.currentPeriod?.start).toLocaleDateString()} - {' '}
                    {new Date(currentPlan.currentPeriod?.end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Next Billing</p>
                  <p className="font-medium">
                    {new Date(currentPlan.currentPeriod?.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">You're on the Free plan</p>
              <p className="text-sm text-gray-500">Upgrade to unlock more features</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentPlan?.planDetails?.limits && Object.entries(currentPlan.planDetails.limits).map(([key, limit]) => {
              const current = usage[key] || 0;
              const percentage = getUsagePercentage(current, limit);
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm ${getUsageColor(percentage)}`}>
                      {current} / {limit === Infinity ? 'Unlimited' : limit}
                    </span>
                  </div>
                  {limit !== Infinity && (
                    <Progress value={percentage} className="h-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = plan.id === currentPlan?.plan;
            const canUpgrade = plan.canUpgrade;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${
                  isCurrent ? 'border-blue-500 border-2' : ''
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                    Current Plan
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getPlanIcon(plan.id)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-bold">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500 text-sm">
                      /month
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm text-center">
                    {plan.id === 'free' && 'Perfect for getting started'}
                    {plan.id === 'starter' && 'For small businesses'}
                    {plan.id === 'professional' && 'For growing businesses'}
                    {plan.id === 'enterprise' && 'For large organizations'}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || !canUpgrade || isUpgrading}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : !canUpgrade ? (
                      'Not Available'
                    ) : isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      'Upgrade Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-sm">Your payment history will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods added</p>
            <p className="text-sm">Add a payment method to upgrade your subscription</p>
            <Button className="mt-4">
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
