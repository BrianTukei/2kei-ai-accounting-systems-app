/**
 * usageTracking.ts
 * ─────────────────
 * Production-grade usage tracking service.
 * Tracks invoices, AI queries, team members, storage, reports, bank imports.
 * Enforces plan limits and triggers upgrade prompts.
 *
 * Usage counters are stored per-organization, per-month.
 * When a limit is reached, the service returns { allowed: false }
 * and the UI shows an upgrade prompt.
 *
 * For Stripe metered billing, usage is reported via the
 * Stripe Usage Records API at the end of each billing period.
 */

import { supabase } from '@/integrations/supabase/client';
import { PLANS, type PlanId, isAtLimit } from '@/lib/plans';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type UsageEventType =
  | 'invoice_created'
  | 'ai_query'
  | 'team_member_added'
  | 'storage_upload'
  | 'report_generated'
  | 'bank_import';

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

export interface UsageCounters {
  invoices: number;
  ai_queries: number;
  team_members: number;
  storage_mb: number;
  reports: number;
  bank_imports: number;
}

export interface UsageLimits {
  invoices: number;
  ai_queries: number;
  team_members: number;
  storage_mb: number;
  reports: number;
  bank_imports: number;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const DEFAULT_COUNTERS: UsageCounters = {
  invoices: 0,
  ai_queries: 0,
  team_members: 0,
  storage_mb: 0,
  reports: 0,
  bank_imports: 0,
};

const PLAN_LIMITS_MAP: Record<PlanId, UsageLimits> = {
  free: {
    invoices: 10,
    ai_queries: 20,
    team_members: 1,
    storage_mb: 100,
    reports: 3,
    bank_imports: 2,
  },
  pro: {
    invoices: -1,
    ai_queries: 200,
    team_members: 5,
    storage_mb: 5120,
    reports: -1,
    bank_imports: 20,
  },
  enterprise: {
    invoices: -1,
    ai_queries: -1,
    team_members: -1,
    storage_mb: -1,
    reports: -1,
    bank_imports: -1,
  },
};

// Map event types to counter keys
const EVENT_TO_COUNTER: Record<UsageEventType, keyof UsageCounters> = {
  invoice_created: 'invoices',
  ai_query: 'ai_queries',
  team_member_added: 'team_members',
  storage_upload: 'storage_mb',
  report_generated: 'reports',
  bank_import: 'bank_imports',
};

// ─────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────

/**
 * Check if an action is allowed for the organization.
 * Returns usage details including remaining count.
 */
export async function checkUsageLimit(
  organizationId: string,
  eventType: UsageEventType,
  planId: PlanId = 'free',
): Promise<UsageCheckResult> {
  const counterKey = EVENT_TO_COUNTER[eventType];
  const limits = PLAN_LIMITS_MAP[planId] || PLAN_LIMITS_MAP.free;
  const limit = limits[counterKey];

  // Unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, remaining: -1, percentUsed: 0 };
  }

  // Get current month
  const month = new Date().toISOString().slice(0, 7);

  // Count events this month
  // Note: usage_events table created by billing migration — cast for pre-migration compat
  const { count, error } = await (supabase as any)
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('event_type', eventType)
    .eq('month', month);

  const current = error ? 0 : (count || 0);

  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
    percentUsed: limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0,
  };
}

/**
 * Record a usage event and check if it's allowed.
 * Returns false if the limit has been exceeded.
 */
export async function trackUsageEvent(
  organizationId: string,
  userId: string,
  eventType: UsageEventType,
  planId: PlanId = 'free',
  quantity: number = 1,
  metadata: Record<string, any> = {},
): Promise<UsageCheckResult> {
  // Check limit first
  const check = await checkUsageLimit(organizationId, eventType, planId);

  if (!check.allowed) {
    return check;
  }

  const month = new Date().toISOString().slice(0, 7);

  // Record the event
  const { error } = await (supabase as any).from('usage_events').insert({
    organization_id: organizationId,
    user_id: userId,
    event_type: eventType,
    quantity,
    month,
    metadata,
  });

  if (error) {
    console.error('[UsageTracking] Failed to record event:', error);
  }

  // Also log to ai_usage_log for backward compatibility with AI-related events
  if (eventType === 'ai_query') {
    await supabase.from('ai_usage_log').insert({
      organization_id: organizationId,
      user_id: userId,
      action: 'chat',
      month,
    }).then(({ error: aiErr }) => {
      if (aiErr) console.warn('[UsageTracking] ai_usage_log insert warning:', aiErr);
    });
  }

  return {
    allowed: true,
    current: check.current + quantity,
    limit: check.limit,
    remaining: check.limit === -1 ? -1 : Math.max(0, check.limit - check.current - quantity),
    percentUsed: check.limit > 0
      ? Math.min(100, Math.round(((check.current + quantity) / check.limit) * 100))
      : 0,
  };
}

/**
 * Get all usage counters for an organization this month.
 */
export async function getUsageCounters(
  organizationId: string,
): Promise<UsageCounters> {
  const month = new Date().toISOString().slice(0, 7);

  const { data, error } = await (supabase as any)
    .from('usage_events')
    .select('event_type, quantity')
    .eq('organization_id', organizationId)
    .eq('month', month);

  if (error || !data) {
    return { ...DEFAULT_COUNTERS };
  }

  const counters = { ...DEFAULT_COUNTERS };
  for (const row of data as any[]) {
    const key = EVENT_TO_COUNTER[row.event_type as UsageEventType];
    if (key) {
      counters[key] += row.quantity || 1;
    }
  }

  // Also count team members from org_users
  const { count: teamCount } = await supabase
    .from('organization_users')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('invite_accepted', true);

  counters.team_members = teamCount || 0;

  return counters;
}

/**
 * Get usage limits for a plan.
 */
export function getUsageLimits(planId: PlanId): UsageLimits {
  return PLAN_LIMITS_MAP[planId] || PLAN_LIMITS_MAP.free;
}

/**
 * Get detailed usage report for billing display.
 */
export async function getUsageReport(
  organizationId: string,
  planId: PlanId,
): Promise<Array<{
  name: string;
  eventType: UsageEventType;
  current: number;
  limit: number;
  percentUsed: number;
  unit: string;
}>> {
  const counters = await getUsageCounters(organizationId);
  const limits = getUsageLimits(planId);

  return [
    {
      name: 'Invoices',
      eventType: 'invoice_created',
      current: counters.invoices,
      limit: limits.invoices,
      percentUsed: limits.invoices === -1 ? 0 : Math.min(100, Math.round((counters.invoices / limits.invoices) * 100)),
      unit: 'invoices/month',
    },
    {
      name: 'AI Queries',
      eventType: 'ai_query',
      current: counters.ai_queries,
      limit: limits.ai_queries,
      percentUsed: limits.ai_queries === -1 ? 0 : Math.min(100, Math.round((counters.ai_queries / limits.ai_queries) * 100)),
      unit: 'queries/month',
    },
    {
      name: 'Team Members',
      eventType: 'team_member_added',
      current: counters.team_members,
      limit: limits.team_members,
      percentUsed: limits.team_members === -1 ? 0 : Math.min(100, Math.round((counters.team_members / limits.team_members) * 100)),
      unit: 'members',
    },
    {
      name: 'Storage',
      eventType: 'storage_upload',
      current: counters.storage_mb,
      limit: limits.storage_mb,
      percentUsed: limits.storage_mb === -1 ? 0 : Math.min(100, Math.round((counters.storage_mb / limits.storage_mb) * 100)),
      unit: 'MB',
    },
    {
      name: 'Reports',
      eventType: 'report_generated',
      current: counters.reports,
      limit: limits.reports,
      percentUsed: limits.reports === -1 ? 0 : Math.min(100, Math.round((counters.reports / limits.reports) * 100)),
      unit: 'reports/month',
    },
    {
      name: 'Bank Imports',
      eventType: 'bank_import',
      current: counters.bank_imports,
      limit: limits.bank_imports,
      percentUsed: limits.bank_imports === -1 ? 0 : Math.min(100, Math.round((counters.bank_imports / limits.bank_imports) * 100)),
      unit: 'imports/month',
    },
  ];
}
