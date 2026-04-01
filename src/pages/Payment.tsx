/**
 * Payment & Checkout Component
 * ────────────────────────────
 * Mobile money payment flow for subscriptions and credit purchases
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Smartphone, Loader, CheckCircle2, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentState {
  planSlug: string;
  billingCycle: 'monthly' | 'yearly';
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = (location.state as PaymentState) || {};
  const { planSlug = 'starter', billingCycle = 'monthly' } = state;

  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  const planPrices: Record<string, number> = {
    starter: billingCycle === 'monthly' ? 15000 : 150000,
    business: billingCycle === 'monthly' ? 75000 : 750000,
  };

  const amount = planPrices[planSlug] || 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const endpoint = paymentMethod === 'mtn' ? '/api/billing/payment/mtn' : '/api/billing/payment/airtel';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          amount,
          planSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      setTransactionRef(data.reference);
      setPaymentStatus('success');
      toast.success(data.message);

      // Poll for payment status
      setTimeout(() => {
        pollPaymentStatus(data.transactionId);
      }, 3000);
    } catch (error: any) {
      setPaymentStatus('failed');
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/billing/payment/${transactionId}/verify`);
      const data = await response.json();

      if (data.success && data.status === 'successful') {
        setPaymentStatus('success');
        toast.success('Payment successful! Your subscription is activated.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else if (data.status === 'pending') {
        // Continue polling
        setTimeout(() => pollPaymentStatus(transactionId), 3000);
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  };

  return (
    <PageLayout
      title="Complete Your Payment"
      subtitle="Choose a payment method to activate your subscription"
    >
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Plan</span>
                  <span className="font-semibold capitalize">{planSlug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Billing Cycle</span>
                  <span className="font-semibold capitalize">{billingCycle}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {amount.toLocaleString('en-UG', { style: 'currency', currency: 'UGX' })}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>✓ Auto-renews on next billing cycle</p>
                <p>✓ Cancel anytime</p>
                <p>✓ Instant activation</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label className="font-semibold">Select Provider</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    {[
                      { value: 'mtn', label: 'MTN Mobile Money', description: 'Dial *165# or use MTN app' },
                      { value: 'airtel', label: 'Airtel Money', description: 'Dial *185# or use Airtel app' },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                        <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={opt.value} className="font-semibold cursor-pointer">
                            <Smartphone className="w-4 h-4 inline mr-2" />
                            {opt.label}
                          </Label>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+256756123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    className="text-lg"
                  />
                  <p className="text-xs text-slate-500">Enter your phone number registered with {paymentMethod.toUpperCase()}</p>
                </div>

                {/* Status Messages */}
                {paymentStatus === 'success' && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-2">
                    <div className="flex gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">Payment Successful!</p>
                        <p className="text-sm text-green-800 dark:text-green-200">Your subscription is now active. Redirecting...</p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Payment Failed</p>
                        <p className="text-sm text-red-800 dark:text-red-200">Please try again with a valid number.</p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'processing' && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="flex gap-2">
                      <Loader className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Processing Payment...</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">Please complete the prompt on your phone.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full text-base"
                  size="lg"
                  disabled={loading || paymentStatus === 'success'}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay {amount.toLocaleString('en-UG', { style: 'currency', currency: 'UGX' })}
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="text-xs text-slate-500 space-y-1 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                  <p>💳 Your payment is secured and encrypted</p>
                  <p>📱 You'll receive a prompt on your phone</p>
                  <p>✅ Instant activation upon confirmation</p>
                  <p>🔄 Auto-renews on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
