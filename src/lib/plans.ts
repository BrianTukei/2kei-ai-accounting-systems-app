/**
 * plans.ts
 * ────────
 * Single source of truth for subscription plan definitions.
 * Used on the frontend (pricing UI, plan guards, limit checks).
 * Mirrors data in the subscription_plans DB table.
 *
 * Plans:
 *   • Free        – $0, basic features
 *   • Pro Monthly – $29/mo with 7-day free trial
 *   • Pro Yearly  – $290/yr with 7-day free trial (save ~17%)
 *   • Enterprise  – $79/mo or $790/yr, custom pricing available
 *
 * Stripe Price IDs are injected via environment variables.
 */

export type PlanId = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type OrgRole = 'owner' | 'accountant' | 'manager' | 'viewer';
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

export interface PlanLimits {
  maxUsers:               number;  // -1 = unlimited
  maxInvoicesPerMonth:    number;
  maxAiChatsPerMonth:     number;
  maxBankImportsPerMonth: number;
  maxBusinesses:          number;
  maxStorageMB:           number;  // storage limit in MB (-1 = unlimited)
  maxReports:             number;  // report access limit (-1 = unlimited)
  hasAiAssistant:         boolean;
  hasAdvancedReports:     boolean;
  hasPayroll:             boolean;
  hasTeamAccess:          boolean;
}

export interface Plan extends PlanLimits {
  id:           PlanId;
  name:         string;
  description:  string;
  priceMonthly: number;
  priceAnnual:  number;
  currency:     string;
  trialDays:    number;
  badge?:       string;
  highlighted?: boolean;
}

/** Stripe Price IDs — set from env vars or Stripe Dashboard */
export const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY  || 'price_pro_monthly',
    annual:  import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL   || 'price_pro_annual',
  },
  enterprise: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ENT_MONTHLY  || 'price_enterprise_monthly',
    annual:  import.meta.env.VITE_STRIPE_PRICE_ENT_ANNUAL   || 'price_enterprise_annual',
  },
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id:           'free',
    name:         'Free',
    description:  'Perfect for freelancers getting started.',
    priceMonthly: 0,
    priceAnnual:  0,
    currency:     'USD',
    trialDays:    0,
    maxUsers:               1,
    maxInvoicesPerMonth:    10,
    maxAiChatsPerMonth:     20,
    maxBankImportsPerMonth: 2,
    maxBusinesses:          1,
    maxStorageMB:           100,   // 100 MB
    maxReports:             3,     // 3 report types
    hasAiAssistant:         false,
    hasAdvancedReports:     false,
    hasPayroll:             false,
    hasTeamAccess:          false,
  },

  pro: {
    id:           'pro',
    name:         'Pro',
    description:  'Unlimited invoices, full reports, AI assistant.',
    priceMonthly: 29,
    priceAnnual:  290,
    currency:     'USD',
    trialDays:    7,
    badge:        'Most Popular',
    highlighted:  true,
    maxUsers:               5,
    maxInvoicesPerMonth:    -1,
    maxAiChatsPerMonth:     200,
    maxBankImportsPerMonth: 20,
    maxBusinesses:          3,
    maxStorageMB:           5120,  // 5 GB
    maxReports:             -1,    // all reports
    hasAiAssistant:         true,
    hasAdvancedReports:     true,
    hasPayroll:             true,
    hasTeamAccess:          false,
  },

  enterprise: {
    id:           'enterprise',
    name:         'Enterprise',
    description:  'Multi-user, advanced analytics, priority AI, custom pricing.',
    priceMonthly: 79,
    priceAnnual:  790,
    currency:     'USD',
    trialDays:    7,
    badge:        'Best Value',
    maxUsers:               -1,
    maxInvoicesPerMonth:    -1,
    maxAiChatsPerMonth:     -1,
    maxBankImportsPerMonth: -1,
    maxBusinesses:          -1,
    maxStorageMB:           -1,    // unlimited
    maxReports:             -1,    // all reports
    hasAiAssistant:         true,
    hasAdvancedReports:     true,
    hasPayroll:             true,
    hasTeamAccess:          true,
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'enterprise'];

/** Returns true if value exceeds the limit (-1 = no limit) */
export function isAtLimit(current: number, limit: number): boolean {
  if (limit === -1) return false;
  return current >= limit;
}

/** Returns percentage of limit used */
export function usagePercent(current: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0)  return 100;
  return Math.min(100, Math.round((current / limit) * 100));
}

/** Returns the number of days remaining in a trial */
export function trialDaysRemaining(trialEndDate?: string | null): number {
  if (!trialEndDate) return 0;
  const now = new Date();
  const end = new Date(trialEndDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Returns true if trial is still active */
export function isTrialActive(trialEndDate?: string | null): boolean {
  return trialDaysRemaining(trialEndDate) > 0;
}

/** Format a plan limit for display (-1 → "Unlimited") */
export function formatLimit(value: number, unit?: string): string {
  if (value === -1) return 'Unlimited';
  return unit ? `${value} ${unit}` : value.toString();
}

/** Storage display helper */
export function formatStorageLimit(mb: number): string {
  if (mb === -1) return 'Unlimited';
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner:      'Owner',
  accountant: 'Accountant',
  manager:    'Manager',
  viewer:     'Viewer',
};

export const ROLE_PERMISSIONS: Record<OrgRole, {
  canManageTeam: boolean;
  canEditTransactions: boolean;
  canViewReports: boolean;
  canManageBilling: boolean;
  canExport: boolean;
}> = {
  owner:      { canManageTeam: true,  canEditTransactions: true,  canViewReports: true,  canManageBilling: true,  canExport: true  },
  accountant: { canManageTeam: false, canEditTransactions: true,  canViewReports: true,  canManageBilling: false, canExport: true  },
  manager:    { canManageTeam: false, canEditTransactions: false, canViewReports: true,  canManageBilling: false, canExport: true  },
  viewer:     { canManageTeam: false, canEditTransactions: false, canViewReports: true,  canManageBilling: false, canExport: false },
};
