import React, { useState, useEffect } from 'react';
import { Check, X, Star, Users, Zap, Shield, Headphones, TrendingUp, Award, ChevronRight, Phone, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { getPricingPlans, calculateSubscriptionCost } from '../services/billingService';
import MobileMoneyPayment from '../components/billing/MobileMoneyPayment';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [pricing, setPricing] = useState({});

  useEffect(() => {
    loadPlans();
  }, [billingCycle]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await getPricingPlans();
      
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    if (plan.name === 'FREE') {
      // Handle free plan signup
      window.location.href = '/signup';
      return;
    }

    try {
      setCalculating(true);
      const costResponse = await calculateSubscriptionCost(plan.name, billingCycle);
      
      if (costResponse.success) {
        setPricing(costResponse.data);
        setSelectedPlan(plan);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Failed to calculate pricing:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'FREE':
        return <Users className="w-8 h-8" />;
      case 'STARTER':
        return <Zap className="w-8 h-8" />;
      case 'BUSINESS':
        return <TrendingUp className="w-8 h-8" />;
      case 'ENTERPRISE':
        return <Award className="w-8 h-8" />;
      default:
        return <Star className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'FREE':
        return 'from-gray-500 to-gray-600';
      case 'STARTER':
        return 'from-blue-500 to-blue-600';
      case 'BUSINESS':
        return 'from-purple-500 to-purple-600';
      case 'ENTERPRISE':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (showPayment && selectedPlan) {
    return (
      <MobileMoneyPayment
        plan={selectedPlan}
        pricing={pricing}
        billingCycle={billingCycle}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          // Redirect to dashboard or success page
          window.location.href = '/dashboard';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Simple Pricing for Ugandan Businesses</h1>
                <p className="text-gray-600">Track your money. Avoid losses. Grow your business.</p>
              </div>
            </div>
            <a
              href="/demo"
              className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Demo</span>
            </a>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isPopular = plan.popular;
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  isPopular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-br ${getPlanColor(plan.name)} text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    {getPlanIcon(plan.name)}
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {plan.name === 'FREE' ? 'Free' : formatPrice(price)}
                      </div>
                      {plan.name !== 'FREE' && (
                        <div className="text-sm opacity-90">
                          {billingCycle === 'yearly' ? '/year' : '/month'}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{plan.displayName}</h3>
                  <p className="text-sm opacity-90">{plan.description}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {plan.features
                      .filter(feature => feature.included)
                      .map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-900 font-medium">{feature.name}</p>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                          </div>
                        </div>
                      ))}

                    {plan.features
                      .filter(feature => !feature.included)
                      .map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3 opacity-50">
                          <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-500 font-medium">{feature.name}</p>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-3">
                    {plan.name === 'FREE' ? (
                      <button
                        onClick={() => (window.location.href = '/signup')}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={calculating}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {calculating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Choose {plan.displayName}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </button>
                    )}

                    {plan.name !== 'FREE' && (
                      <div className="text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <Phone className="w-4 h-4" />
                          <span>Mobile Money Accepted</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Card Payments Available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare All Features</h2>
            <p className="text-gray-600">See exactly what you get with each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="text-center py-3 px-4 font-semibold text-gray-900">
                      {plan.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">Monthly Transactions</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.limits.maxTransactions === -1 ? 'Unlimited' : plan.limits.maxTransactions}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">AI Features</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.limits.aiFeatures ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">Mobile Money Tracking</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.limits.mobileMoneyTracking ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">Priority Support</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.limits.prioritySupport ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">Multi-user Access</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.limits.maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900 font-medium">AI Credits (Monthly)</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="text-center py-3 px-4">
                      {plan.aiCredits.monthlyCredits}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Ugandan Businesses</h2>
            <p className="text-gray-600">Join hundreds of businesses already using 2K AI Accounting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">Mobile money and card payments protected by industry-standard security</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Support</h3>
              <p className="text-gray-600">Ugandan-based support team available to help you succeed</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Setup</h3>
              <p className="text-gray-600">Get started in minutes with our simple onboarding process</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about our pricing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept MTN Mobile Money, Airtel Money, and major credit/debit cards.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a contract?</h3>
              <p className="text-gray-600">No contracts! You can cancel your subscription at any time with no penalties.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 7-day money-back guarantee for all paid plans.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
            <p className="text-blue-100 mb-8">Join hundreds of Ugandan businesses using 2K AI Accounting</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = '/signup')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </button>
              <a
                href="/demo"
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
