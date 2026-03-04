/**
 * BillingDashboard.tsx
 * ─────────────────────
 * Production-grade billing management page component.
 * Displays:
 *   - Current plan badge with status
 *   - Trial countdown timer
 *   - Renewal/period info
 *   - Usage meter bars (invoices, AI queries, team, storage, reports, bank imports)
 *   - Upgrade / Downgrade CTA
 *   - Cancel subscription button
 *   - Payment method display (last 4 + brand)
 *   - Loading states and error handling
 *
 * This component is rendered within the existing Billing page
 * as a summary card at the top.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBilling, type UsageMeter } from '@/hooks/useBilling';
import {
  PLANS, PLAN_ORDER, type PlanId,
  trialDaysRemaining, formatLimit, formatStorageLimit,
} from '@/lib/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SubscriptionStatusBadge, TrialCountdown, PastDueBanner,
} from '@/components/SubscriptionGuard';
import {
  CreditCard, Calendar, TrendingUp, Zap, Shield, Sparkles,
  Clock, AlertTriangle, CheckCircle2, BarChart3, Users, Database,
  FileText, Bot, Building2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Usage Meter Component
// ─────────────────────────────────────────

function UsageMeterBar({
  meter,
  className,
}: {
  meter: UsageMeter;
  className?: string;
}) {
  const isUnlimited = meter.limit === -1;
  const isAtLimit = meter.isAtLimit;
  const pct = isUnlimited ? 0 : meter.percentUsed;

  const getColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (pct > 80) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  const ICONS: Record<string, React.ReactNode> = {
    'Invoices':     <FileText className="w-4 h-4 text-indigo-500" />,
    'AI Queries':   <Bot className="w-4 h-4 text-purple-500" />,
    'Team Members': <Users className="w-4 h-4 text-blue-500" />,
    'Storage':      <Database className="w-4 h-4 text-emerald-500" />,
    'Reports':      <BarChart3 className="w-4 h-4 text-orange-500" />,
    'Bank Imports': <Building2 className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {ICONS[meter.name]}
          {meter.name}
        </span>
        <span className={cn(
          'font-medium tabular-nums',
          isAtLimit ? 'text-red-500' : 'text-slate-700 dark:text-slate-200',
        )}>
          {isUnlimited
            ? `${meter.current} / Unlimited`
            : meter.name === 'Storage'
              ? `${meter.current} / ${formatStorageLimit(meter.limit)}`
              : `${meter.current} / ${meter.limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={pct}
          className={cn('h-2', `[&>div]:${getColor()}`)}
        />
      )}
      {isUnlimited && (
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-green-400/50 w-0" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Payment Method Display
// ─────────────────────────────────────────

function PaymentMethodCard({
  last4,
  brand,
}: {
  last4: string | null;
  brand: string | null;
}) {
  if (!last4) return null;

  const brandLabels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };

  const brandIcons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <CreditCard className="w-5 h-5 text-slate-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {brandLabels[brand || ''] || 'Card'} ending in {last4}
        </p>
        <p className="text-xs text-slate-500">Default payment method</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Billing Summary Dashboard
// ─────────────────────────────────────────

export default function BillingDashboard() {
  const { subscription, plan } = useOrganization();
  const { loading, billingInfo, usageMeters } = useBilling();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PLAN_ICONS = { free: Shield, pro: Zap, enterprise: Sparkles } as const;
  const PlanIcon = PLAN_ICONS[billingInfo.planId] || Shield;

  return (
    <div className="space-y-6">
      {/* Past Due Warning */}
      <PastDueBanner />

      {/* Trial Countdown */}
      <TrialCountdown />

      {/* Current Plan Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlanIcon className="w-5 h-5 text-indigo-500" />
              Current Plan
            </CardTitle>
            <SubscriptionStatusBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Name & Price */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {billingInfo.planName}
                {billingInfo.billingCycle === 'annual' && (
                  <span className="text-sm font-normal text-slate-500 ml-2">(Annual)</span>
                )}
              </h3>
              {billingInfo.currentPrice > 0 && (
                <p className="text-slate-500 text-sm">
                  ${billingInfo.currentPrice}/{billingInfo.billingCycle === 'annual' ? 'year' : 'month'}
                </p>
              )}
            </div>
            {billingInfo.planId !== 'enterprise' && (
              <Button
                className="gap-2"
                onClick={() => navigate('/billing')}
              >
                <Zap className="w-4 h-4" />
                {billingInfo.planId === 'free' ? 'Upgrade' : 'Change Plan'}
              </Button>
            )}
          </div>

          {/* Trial Info */}
          {billingInfo.isTrialing && billingInfo.trialDaysLeft > 0 && (
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              billingInfo.trialDaysLeft <= 2
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700',
            )}>
              <Clock className={cn('w-5 h-5', billingInfo.trialDaysLeft <= 2 ? 'text-red-500' : 'text-blue-500')} />
              <div>
                <p className={cn('text-sm font-medium', billingInfo.trialDaysLeft <= 2 ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300')}>
                  {billingInfo.trialDaysLeft} day{billingInfo.trialDaysLeft !== 1 ? 's' : ''} remaining in trial
                </p>
                {billingInfo.trialEndDate && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trial ends {new Date(billingInfo.trialEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Renewal Date */}
          {billingInfo.renewalDate && billingInfo.isActive && (
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>
                {billingInfo.cancelAtPeriodEnd
                  ? `Access until ${new Date(billingInfo.renewalDate).toLocaleDateString()}`
                  : `Renews ${new Date(billingInfo.renewalDate).toLocaleDateString()}`}
              </span>
            </div>
          )}

          {/* Payment Method */}
          <PaymentMethodCard
            last4={billingInfo.paymentMethodLast4}
            brand={billingInfo.paymentMethodBrand}
          />

          {/* Cancel at period end warning */}
          {billingInfo.cancelAtPeriodEnd && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Subscription will be canceled at the end of the current period.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Meters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageMeters.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading usage data...
            </div>
          ) : (
            usageMeters.map((meter) => (
              <UsageMeterBar key={meter.name} meter={meter} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
