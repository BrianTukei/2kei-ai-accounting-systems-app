/**
 * Pricing Page Component
 * ──────────────────────
 * Displays all pricing plans with clear value propositions
 * Mobile-first design for SME users in Uganda
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Check, ArrowRight, Zap, Users, BarChart3, Bot, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: {
    transactions: number;
    reports: string[];
    support: string;
    ai_features: boolean;
    multi_user: number;
    ai_credits?: number;
    crm?: boolean;
  };
}

export default function PricingPage() {
  const { user } = useAuth();
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/billing/plans');
        const data = await response.json();
        setPlans(data);

        // Get current user's plan
        if (user) {
          const subResponse = await fetch('/api/billing/subscription');
          const subData = await subResponse.json();
          setCurrentPlan(subData.subscription?.plan.slug || 'free');
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast.error('Failed to load pricing plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user]);

  const handleSelectPlan = (planSlug: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (planSlug === 'free') {
      toast.info('You are already on the Free plan');
      return;
    }

    navigate('/billing/payment', { state: { planSlug, billingCycle } });
  };

  const getPrice = (plan: PricingPlan) => {
    return billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
  };

  const getPricePerDay = (plan: PricingPlan) => {
    const price = convertAmount(getPrice(plan), 'UGX', selectedCurrency.code);
    const daysInCycle = billingCycle === 'monthly' ? 30 : 365;
    return (price / daysInCycle).toFixed(0);
  };

  if (loading) {
    return (
      <PageLayout title="Pricing" subtitle="Choose the right plan for your business">
        <div className="text-center py-12">Loading pricing plans...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Pricing"
      subtitle="Simple, transparent pricing for Ugandan businesses"
      showBackButton={false}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center gap-4">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <Badge className="ml-2 bg-green-500">Save 10%</Badge>
          </Button>
        </div>

        {/* Free Plan Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold">Get started free!</p>
              <p>Track up to 50 transactions per month at no cost. No credit card required.</p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.slug;
            const isFeatured = ['starter', 'business'].includes(plan.slug);

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative',
                  isFeatured && 'lg:scale-105'
                )}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={cn(
                    'h-full flex flex-col transition-all duration-300',
                    isFeatured && 'border-purple-300 dark:border-purple-700 shadow-lg',
                    isCurrentPlan && 'ring-2 ring-green-500'
                  )}
                >
                  {/* Header */}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-2">{plan.description}</p>

                    {/* Price */}
                    <div className="mt-4">
                      {plan.monthly_price === 0 ? (
                        <div className="text-3xl font-bold">Free</div>
                      ) : (
                        <div>
                          <div className="text-3xl font-bold">
                            {formatCurrency(getPrice(plan), 'UGX')}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            ≈{formatCurrency(Number(getPricePerDay(plan)), selectedCurrency.code)}/day
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="flex-1 space-y-6">
                    {/* Features */}
                    <ul className="space-y-3">
                      {/* Transactions */}
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold">
                            {plan.features.transactions === 999999
                              ? 'Unlimited'
                              : plan.features.transactions.toLocaleString()}
                          </span>
                          {' '}transactions/month
                        </div>
                      </li>

                      {/* Reports */}
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <BarChart3 className="w-3 h-3 inline mr-1" />
                          <span className="font-semibold">{plan.features.reports.join(', ')}</span>
                        </div>
                      </li>

                      {/* Support */}
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold capitalize">{plan.features.support}</span>
                          {' '}support
                        </div>
                      </li>

                      {/* AI Features */}
                      {plan.features.ai_features && (
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <Bot className="w-3 h-3 inline mr-1" />
                            <span className="font-semibold">AI-powered insights</span>
                          </div>
                        </li>
                      )}

                      {/* Multi-user */}
                      {plan.features.multi_user > 1 && (
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <Users className="w-3 h-3 inline mr-1" />
                            <span className="font-semibold">{plan.features.multi_user}</span>
                            {' '}team members
                          </div>
                        </li>
                      )}

                      {/* AI Credits */}
                      {plan.features.ai_credits && (
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                            <span className="font-semibold">
                              {(plan.features.ai_credits / 1000).toFixed(0)}k AI credits
                            </span>
                          </div>
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : isFeatured ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.slug)}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto space-y-4 mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan anytime. Changes take effect immediately.',
              },
              {
                q: 'What happens if I exceed my transaction limit?',
                a: 'We\'ll notify you when you\'re close to your limit. You can upgrade anytime to continue tracking.',
              },
              {
                q: 'Do you offer discounts for annual billing?',
                a: 'Yes! Annual plans include a 10% discount compared to monthly billing.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept MTN Mobile Money, Airtel Money, and card payments (Visa/Mastercard).',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, the Free plan is always available. No credit card required to start!',
              },
            ].map((faq, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
