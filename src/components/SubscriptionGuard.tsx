/**
 * SubscriptionGuard.tsx
 * ──────────────────────
 * Wraps any feature that requires a paid plan or specific permission.
 * Shows an upgrade prompt instead of the children when the user doesn't qualify.
 *
 * Usage:
 *   <SubscriptionGuard feature="aiAssistant">
 *     <AIAssistantPage />
 *   </SubscriptionGuard>
 *
 *   <SubscriptionGuard permission="canEditTransactions">
 *     <AddTransactionButton />
 *   </SubscriptionGuard>
 *
 *   <SubscriptionGuard limit="invoices" action="create an invoice">
 *     <NewInvoiceButton />
 *   </SubscriptionGuard>
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ROLE_PERMISSIONS, type OrgRole } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Zap, TrendingUp } from 'lucide-react';
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
  /** Friendly action name shown in the upgrade message */
  action?: string;
  /** Render nothing instead of an upgrade card */
  silent?: boolean;
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
  action,
  silent = false,
  className,
  children,
}) => {
  const { hasFeature, can, isAtLimit, plan } = useOrganization();

  // Feature gate
  if (feature && !hasFeature(feature)) {
    if (silent) return null;
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
