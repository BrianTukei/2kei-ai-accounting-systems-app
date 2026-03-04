/**
 * ai/roles.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Role-Aware Intelligence for 2KEI AI.
 *
 * Changes tone, depth, and permissions based on the user's org role:
 *   Owner      → Full insights, executive tone, can execute all actions
 *   Accountant → Technical analysis, professional tone, can edit data
 *   Manager    → Operational overview, reports-focused, read + export
 *   Viewer     → Simplified explanations, read-only, no actions
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { OrgRole } from '@/lib/plans';
import type { AIRoleConfig, AIActionType } from './types';

// ── Role configurations ─────────────────────────────────────────────────────

const ROLE_CONFIGS: Record<OrgRole, AIRoleConfig> = {
  owner: {
    canExecuteActions: true,
    canViewFullInsights: true,
    canViewSensitiveData: true,
    canModifyData: true,
    tone: 'executive',
    greeting: 'Here\'s your executive briefing',
  },
  accountant: {
    canExecuteActions: true,
    canViewFullInsights: true,
    canViewSensitiveData: true,
    canModifyData: true,
    tone: 'technical',
    greeting: 'Here\'s your technical analysis',
  },
  manager: {
    canExecuteActions: false,
    canViewFullInsights: true,
    canViewSensitiveData: false,
    canModifyData: false,
    tone: 'executive',
    greeting: 'Here\'s your operational overview',
  },
  viewer: {
    canExecuteActions: false,
    canViewFullInsights: false,
    canViewSensitiveData: false,
    canModifyData: false,
    tone: 'simplified',
    greeting: 'Here\'s a summary for you',
  },
};

export function getRoleConfig(role: OrgRole): AIRoleConfig {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS.viewer;
}

// ── Permission checks ───────────────────────────────────────────────────────

/** Actions each role can trigger */
const ALLOWED_ACTIONS: Record<OrgRole, AIActionType[]> = {
  owner: [
    'create_invoice', 'add_transaction', 'add_employee', 'record_expense',
    'generate_report', 'invite_member', 'navigate', 'create_journal_entry',
    'categorize_expense', 'none',
  ],
  accountant: [
    'create_invoice', 'add_transaction', 'record_expense',
    'generate_report', 'navigate', 'create_journal_entry',
    'categorize_expense', 'none',
  ],
  manager: [
    'generate_report', 'navigate', 'none',
  ],
  viewer: [
    'navigate', 'none',
  ],
};

export function canExecuteAction(role: OrgRole, actionType: AIActionType): boolean {
  return ALLOWED_ACTIONS[role]?.includes(actionType) ?? false;
}

// ── Tone adaptation ─────────────────────────────────────────────────────────

/**
 * Wraps a response with role-appropriate tone and context.
 */
export function adaptResponseForRole(
  response: string,
  role: OrgRole,
  includeDisclaimer = false,
): string {
  const config = getRoleConfig(role);

  // Add role-specific disclaimer for viewers
  if (role === 'viewer' && includeDisclaimer) {
    return response + '\n\n*ℹ️ You have view-only access. Contact your organization owner to make changes.*';
  }

  // For managers, redact sensitive financial details if needed
  if (role === 'manager' && !config.canViewSensitiveData) {
    // Don't show payroll details to managers
    return response.replace(
      /individual\s*salary|employee.*compensation|payroll\s*detail/gi,
      '[restricted — contact owner]'
    );
  }

  return response;
}

/**
 * Returns role-appropriate greeting opener.
 */
export function getRoleGreeting(role: OrgRole, userName?: string): string {
  const config = getRoleConfig(role);
  const name = userName ? `${userName}, ` : '';

  switch (config.tone) {
    case 'executive':
      return `${name}${config.greeting}:`;
    case 'technical':
      return `${name}${config.greeting}:`;
    case 'simplified':
      return `${name}here's what I found:`;
    default:
      return `${name}${config.greeting}:`;
  }
}

/**
 * Get system prompt section for this role.
 */
export function getRoleSystemPrompt(role: OrgRole): string {
  const config = getRoleConfig(role);

  const toneGuide = {
    executive: 'Use executive-level language. Lead with key metrics and strategic insights. Be concise but comprehensive.',
    technical: 'Use precise accounting terminology. Include account codes, journal entry suggestions, and technical analysis. Be thorough.',
    simplified: 'Use simple, clear language. Avoid jargon. Explain concepts briefly. Focus on what matters most.',
  };

  return (
    `User role: ${role.toUpperCase()}\n` +
    `Tone: ${toneGuide[config.tone]}\n` +
    `Can execute actions: ${config.canExecuteActions ? 'Yes' : 'No'}\n` +
    `Can view sensitive data: ${config.canViewSensitiveData ? 'Yes' : 'No'}\n` +
    `Can modify data: ${config.canModifyData ? 'Yes' : 'No'}`
  );
}
