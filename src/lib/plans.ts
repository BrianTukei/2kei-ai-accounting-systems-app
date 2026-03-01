/**
 * plans.ts
 * ────────
 * Single source of truth for subscription plan definitions
 * used on the frontend (pricing UI, plan guards, limit checks).
 * Mirrors data in the subscription_plans DB table.
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

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for freelancers getting started.',
    priceMonthly: 0,
    priceAnnual:  0,
    currency: 'USD',
    trialDays: 0,
    maxUsers: 1,
    maxInvoicesPerMonth: 10,
    maxAiChatsPerMonth: 20,
    maxBankImportsPerMonth: 2,
    maxBusinesses: 1,
    hasAiAssistant: false,
    hasAdvancedReports: false,
    hasPayroll: false,
    hasTeamAccess: false,
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited invoices, full reports, AI assistant.',
    priceMonthly: 29,
    priceAnnual:  290,
    currency: 'USD',
    trialDays: 14,
    badge: 'Most Popular',
    highlighted: true,
    maxUsers: 5,
    maxInvoicesPerMonth: -1,
    maxAiChatsPerMonth: 200,
    maxBankImportsPerMonth: 20,
    maxBusinesses: 1,
    hasAiAssistant: true,
    hasAdvancedReports: true,
    hasPayroll: true,
    hasTeamAccess: false,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-user, advanced analytics, priority AI.',
    priceMonthly: 79,
    priceAnnual:  790,
    currency: 'USD',
    trialDays: 14,
    badge: 'Best Value',
    maxUsers: -1,
    maxInvoicesPerMonth: -1,
    maxAiChatsPerMonth: -1,
    maxBankImportsPerMonth: -1,
    maxBusinesses: -1,
    hasAiAssistant: true,
    hasAdvancedReports: true,
    hasPayroll: true,
    hasTeamAccess: true,
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
  return Math.min(100, Math.round((current / limit) * 100));
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
