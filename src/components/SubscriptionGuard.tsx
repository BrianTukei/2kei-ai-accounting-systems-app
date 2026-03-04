/**
 * SubscriptionGuard.tsx
 * ──────────────────────
 * Production-grade subscription protection middleware.
 *
 * Gate types:
 *   • feature    — plan-level feature gate (e.g. AI Assistant)
 *   • permission — role-based permission gate
 *   • limit      — monthly usage limit gate
 *   • subscription — requires active/trialing subscription
 *
 * Also exports:
 *   • UsageLimitBanner   — inline upgrade warning
 *   • TrialCountdown     — trial days remaining display
 *   • PastDueBanner      — payment failed warning
 *   • SubscriptionStatus — status badge component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ROLE_PERMISSIONS, type OrgRole, trialDaysRemaining, isTrialActive } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Zap, TrendingUp, AlertTriangle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type Feature = 'aiAssistant' | 'advancedReports' | 'payroll' | 'teamAccess';
type Permission = keyof typeof ROLE_PERMISSIONS[OrgRole];
type Limit = 'invoices' | 'aiChats' | 'bankImports';

interface Props {
  /** Plan-level feature gate */
  feature?: Feature;
  /** Role-based permission gate */
  permission?: Permission;
  /** Monthly usage limit gate */
  limit?: Limit;
  /** Require active or trialing subscription */
  requireSubscription?: boolean;
  /** Friendly action name shown in the upgrade message */
  action?: string;
  /** Render nothing instead of an upgrade card */
  silent?: boolean;
  /** Show a compact inline warning instead of a full card */
  inline?: boolean;
  /** Custom class on the wrapper */
  className?: string;
  children: React.ReactNode;
}

// ─────────────────────────────────────────
// Upgrade prompt
// ─────────────────────────────────────────

function UpgradeCard({
  reason,
  action,
  className,
}: {
  reason: string;
  action?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <Card className={cn('border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40', className)}>
      <CardContent className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
          <Lock className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {action ? `Upgrade to ${action}` : 'Upgrade Required'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{reason}</p>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => navigate('/billing')}
        >
          <Zap className="w-3.5 h-3.5" /> View Plans
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// Trial Countdown Component
// ─────────────────────────────────────────

export function TrialCountdown({ className }: { className?: string }) {
  const { subscription } = useOrganization();
  if (!subscription?.trialEndsAt) return null;

  const daysLeft = trialDaysRemaining(subscription.trialEndsAt);
  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 2;

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg p-3 text-sm',
      isUrgent
        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
      className,
    )}>
      <Clock className={cn('w-4 h-4 shrink-0', isUrgent ? 'text-red-500' : 'text-blue-500')} />
      <span className={isUrgent ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}>
        {daysLeft === 1
          ? 'Your trial ends tomorrow. Add a payment method to continue.'
          : `${daysLeft} days left in your free trial.`}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
// Past Due Banner
// ─────────────────────────────────────────

export function PastDueBanner({ className }: { className?: string }) {
  const { subscription } = useOrganization();
  const navigate = useNavigate();

  if (subscription?.status !== 'past_due') return null;

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm',
      className,
    )}>
      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
      <span className="text-red-800 dark:text-red-300">
        Your payment has failed. Please update your payment method to avoid losing access to premium features.
      </span>
      <Button
        size="sm"
        variant="destructive"
        className="ml-auto shrink-0"
        onClick={() => navigate('/billing')}
      >
        Update Payment
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// Subscription Status Badge
// ─────────────────────────────────────────

export function SubscriptionStatusBadge({ className }: { className?: string }) {
  const { subscription, plan } = useOrganization();
  const status = subscription?.status || 'active';

  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active:   { label: `${plan.name} Plan`, variant: 'default' },
    trialing: { label: `${plan.name} Trial`, variant: 'secondary' },
    past_due: { label: 'Payment Due', variant: 'destructive' },
    canceled: { label: 'Canceled', variant: 'outline' },
    paused:   { label: 'Paused', variant: 'outline' },
  };

  const { label, variant } = variants[status] || variants.active;

  return (
    <Badge variant={variant} className={className}>
      {status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status === 'past_due' && <AlertTriangle className="w-3 h-3 mr-1" />}
      {status === 'trialing' && <Clock className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}

// ─────────────────────────────────────────
// Usage limit warning banner
// ─────────────────────────────────────────

export function UsageLimitBanner({
  limit,
  action,
}: {
  limit: Limit;
  action?: string;
}) {
  const { isAtLimit, plan } = useOrganization();
  const navigate = useNavigate();
  if (!isAtLimit(limit)) return null;

  const limitLabels: Record<Limit, string> = {
    invoices:   `invoice limit (${plan.maxInvoicesPerMonth}/month on ${plan.name})`,
    aiChats:    `AI chat limit (${plan.maxAiChatsPerMonth}/month on ${plan.name})`,
    bankImports: `bank import limit (${plan.maxBankImportsPerMonth}/month on ${plan.name})`,
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
      <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
      <span className="text-amber-800 dark:text-amber-300">
        You've reached your {limitLabels[limit]}.{' '}
        {action ? `You can't ${action} without upgrading.` : ''}
      </span>
      <Button size="sm" variant="outline" className="ml-auto shrink-0 text-amber-700 border-amber-300"
        onClick={() => navigate('/billing')}>
        Upgrade
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────
// Main guard
// ─────────────────────────────────────────

const FEATURE_LABELS: Record<Feature, string> = {
  aiAssistant:    'AI Assistant is a Pro feature.',
  advancedReports: 'Advanced reports require the Pro plan.',
  payroll:        'Payroll processing requires the Pro plan.',
  teamAccess:     'Team access requires the Enterprise plan.',
};

const LIMIT_LABELS: Record<Limit, (plan: string, max: number) => string> = {
  invoices:   (p, m) => `You've reached the ${m} invoice/month limit on the ${p} plan.`,
  aiChats:    (p, m) => `You've used your ${m} AI chat quota for this month on the ${p} plan.`,
  bankImports: (p, m) => `You've used your ${m} bank import quota for this month on the ${p} plan.`,
};

export const SubscriptionGuard: React.FC<Props> = ({
  feature,
  permission,
  limit,
  requireSubscription = false,
  action,
  silent = false,
  inline = false,
  className,
  children,
}) => {
  const { hasFeature, can, isAtLimit, plan, subscription } = useOrganization();
  const navigate = useNavigate();

  // Subscription status gate
  if (requireSubscription) {
    const status = subscription?.status;
    if (status === 'past_due') {
      if (silent) return null;
      return (
        <UpgradeCard
          reason="Your payment has failed. Please update your payment method to continue using this feature."
          action={action}
          className={className}
        />
      );
    }
    if (status === 'canceled') {
      if (silent) return null;
      return (
        <UpgradeCard
          reason="Your subscription has been canceled. Please resubscribe to access this feature."
          action={action}
          className={className}
        />
      );
    }
    // Check trial expiry
    if (status === 'trialing' && subscription?.trialEndsAt) {
      const daysLeft = trialDaysRemaining(subscription.trialEndsAt);
      if (daysLeft <= 0) {
        if (silent) return null;
        return (
          <UpgradeCard
            reason="Your free trial has expired. Please subscribe to continue using this feature."
            action={action}
            className={className}
          />
        );
      }
    }
  }

  // Feature gate
  if (feature && !hasFeature(feature)) {
    if (silent) return null;
    if (inline) {
      return (
        <div className={cn('flex items-center gap-2 text-sm text-slate-500', className)}>
          <ShieldAlert className="w-4 h-4" />
          <span>{FEATURE_LABELS[feature]}</span>
          <Button size="sm" variant="link" onClick={() => navigate('/billing')}>Upgrade</Button>
        </div>
      );
    }
    return (
      <UpgradeCard
        reason={FEATURE_LABELS[feature]}
        action={action}
        className={className}
      />
    );
  }

  // Permission gate
  if (permission && !can(permission)) {
    if (silent) return null;
    return (
      <UpgradeCard
        reason={`Your role doesn't have permission for this action.`}
        action={action}
        className={className}
      />
    );
  }

  // Limit gate
  if (limit && isAtLimit(limit)) {
    if (silent) return null;
    const limitMax =
      limit === 'invoices'    ? plan.maxInvoicesPerMonth :
      limit === 'aiChats'     ? plan.maxAiChatsPerMonth  :
      plan.maxBankImportsPerMonth;

    return (
      <UpgradeCard
        reason={LIMIT_LABELS[limit](plan.name, limitMax)}
        action={action}
        className={className}
      />
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
