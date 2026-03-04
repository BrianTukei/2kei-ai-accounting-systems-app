/**
 * ai/actionHandler.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Smart Action Execution — detects commands in natural language and returns
 * structured action objects. The frontend executes them after confirmation.
 *
 * Supported actions:
 *   create_invoice   — "Create invoice for John $500"
 *   add_transaction  — "Add income $1000 from client"
 *   record_expense   — "Record expense fuel 200" / "Bought fuel 200"
 *   add_employee     — "Add new employee Sarah salary 500"
 *   generate_report  — "Generate profit report"
 *   invite_member    — "Invite accountant david@email.com"
 *   create_journal_entry — "Journal entry: debit cash credit revenue 1000"
 *   categorize_expense   — "Categorize: office supplies $50"
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIAction, AIActionType, AIContext } from './types';
import { canExecuteAction } from './roles';
import { validateAction, logAction } from './safety';

// ── Action patterns ─────────────────────────────────────────────────────────

interface ActionPattern {
  type: AIActionType;
  patterns: RegExp[];
  extract: (message: string) => Record<string, any>;
}

const ACTION_PATTERNS: ActionPattern[] = [
  // ── Create Invoice ──────────────────────────────────────────────────────
  {
    type: 'create_invoice',
    patterns: [
      /(?:create|make|new|generate|send)\s+(?:an?\s+)?invoice\s+(?:for|to)\s+(.+)/i,
      /invoice\s+(.+?)\s+(?:for\s+)?\$?(\d[\d,.]*)/i,
      /bill\s+(.+?)\s+\$?(\d[\d,.]*)/i,
    ],
    extract: (msg: string) => {
      // Try "invoice for [client] $[amount]"
      let match = msg.match(/(?:create|make|new|generate|send)\s+(?:an?\s+)?invoice\s+(?:for|to)\s+(.+?)\s+(?:for\s+)?\$?(\d[\d,.]+)/i);
      if (match) {
        return {
          client: match[1].trim(),
          amount: parseFloat(match[2].replace(/,/g, '')),
        };
      }
      // Try "invoice [client] $[amount]"
      match = msg.match(/(?:invoice|bill)\s+(.+?)\s+\$?(\d[\d,.]+)/i);
      if (match) {
        return {
          client: match[1].trim(),
          amount: parseFloat(match[2].replace(/,/g, '')),
        };
      }
      // Try "invoice for [client]" (no amount)
      match = msg.match(/(?:create|make|new|generate|send)\s+(?:an?\s+)?invoice\s+(?:for|to)\s+(.+)/i);
      if (match) {
        return { client: match[1].trim(), amount: 0 };
      }
      return {};
    },
  },

  // ── Record Expense ──────────────────────────────────────────────────────
  {
    type: 'record_expense',
    patterns: [
      /(?:record|add|log|enter)\s+(?:an?\s+)?expense\s+(.+)/i,
      /(?:bought|purchased|paid\s+for|spent\s+on)\s+(.+)/i,
      /expense[:\s]+(.+)/i,
    ],
    extract: (msg: string) => {
      // "record expense fuel 200" or "bought fuel 200"
      let match = msg.match(/(?:record|add|log|enter)\s+(?:an?\s+)?expense\s+(.+?)\s+\$?(\d[\d,.]+)/i);
      if (!match) {
        match = msg.match(/(?:bought|purchased|paid\s+for|spent\s+on)\s+(.+?)\s+\$?(\d[\d,.]+)/i);
      }
      if (!match) {
        match = msg.match(/(?:bought|purchased|paid\s+for|spent)\s+\$?(\d[\d,.]+)\s+(?:on|for)\s+(.+)/i);
        if (match) {
          return {
            description: match[2].trim(),
            amount: parseFloat(match[1].replace(/,/g, '')),
          };
        }
      }
      if (match) {
        return {
          description: match[1].trim(),
          amount: parseFloat(match[2].replace(/,/g, '')),
        };
      }
      // Just description, no amount
      match = msg.match(/(?:record|add|log)\s+(?:an?\s+)?expense\s+(.+)/i);
      if (match) return { description: match[1].trim(), amount: 0 };
      return {};
    },
  },

  // ── Add Transaction (income) ────────────────────────────────────────────
  {
    type: 'add_transaction',
    patterns: [
      /(?:add|record|log)\s+(?:an?\s+)?(?:income|revenue|payment\s+received|sale)\s+(.+)/i,
      /(?:received|got|earned)\s+\$?(\d[\d,.]+)\s+(?:from|for)\s+(.+)/i,
    ],
    extract: (msg: string) => {
      let match = msg.match(/(?:add|record|log)\s+(?:an?\s+)?(?:income|revenue|sale)\s+\$?(\d[\d,.]+)\s+(?:from|for)\s+(.+)/i);
      if (match) {
        return {
          amount: parseFloat(match[1].replace(/,/g, '')),
          description: match[2].trim(),
          type: 'income',
        };
      }
      match = msg.match(/(?:received|got|earned)\s+\$?(\d[\d,.]+)\s+(?:from|for)\s+(.+)/i);
      if (match) {
        return {
          amount: parseFloat(match[1].replace(/,/g, '')),
          description: match[2].trim(),
          type: 'income',
        };
      }
      return { type: 'income' };
    },
  },

  // ── Add Employee ────────────────────────────────────────────────────────
  {
    type: 'add_employee',
    patterns: [
      /(?:add|create|hire|register)\s+(?:new\s+)?(?:employee|staff|worker)\s+(.+)/i,
      /(?:new\s+)?(?:employee|hire)[:\s]+(.+)/i,
    ],
    extract: (msg: string) => {
      const match = msg.match(/(?:add|create|hire|register)\s+(?:new\s+)?(?:employee|staff|worker)\s+(.+?)(?:\s+(?:salary|pay|at)\s+\$?(\d[\d,.]+))?$/i);
      if (match) {
        const result: Record<string, any> = { name: match[1].trim() };
        if (match[2]) result.salary = parseFloat(match[2].replace(/,/g, ''));
        return result;
      }
      return {};
    },
  },

  // ── Generate Report ─────────────────────────────────────────────────────
  {
    type: 'generate_report',
    patterns: [
      /(?:generate|create|make|build|show|give\s+me)\s+(?:a\s+)?(?:(?:profit|income|expense|cashflow|cash\s*flow|balance|trial|financial|p\s*&\s*l)\s*(?:report|statement|sheet|summary))/i,
      /(?:profit|income|expense|cashflow|balance|trial)\s+(?:report|statement)/i,
    ],
    extract: (msg: string) => {
      const lower = msg.toLowerCase();
      let reportType = 'financial_summary';
      if (/profit|p\s*&\s*l|income\s*statement/i.test(lower)) reportType = 'profit_loss';
      else if (/balance\s*sheet/i.test(lower)) reportType = 'balance_sheet';
      else if (/cash\s*flow/i.test(lower)) reportType = 'cash_flow';
      else if (/trial\s*balance/i.test(lower)) reportType = 'trial_balance';
      else if (/expense/i.test(lower)) reportType = 'expense_report';
      return { reportType };
    },
  },

  // ── Invite Member ───────────────────────────────────────────────────────
  {
    type: 'invite_member',
    patterns: [
      /(?:invite|add)\s+(?:an?\s+)?(?:team\s+)?(?:member|accountant|manager|viewer|user)\s+(.+)/i,
      /invite\s+(.+)/i,
    ],
    extract: (msg: string) => {
      const match = msg.match(/(?:invite|add)\s+(?:an?\s+)?(?:team\s+)?(?:member|accountant|manager|viewer|user)\s+(.+)/i);
      if (match) {
        const target = match[1].trim();
        // Check if it's an email
        const emailMatch = target.match(/([^\s]+@[^\s]+)/);
        const role = /accountant/i.test(msg) ? 'accountant'
          : /manager/i.test(msg) ? 'manager'
          : /viewer/i.test(msg) ? 'viewer'
          : 'viewer';
        return {
          name: emailMatch ? '' : target.split(/\s+/)[0],
          email: emailMatch ? emailMatch[1] : '',
          role,
        };
      }
      return {};
    },
  },

  // ── Create Journal Entry ────────────────────────────────────────────────
  {
    type: 'create_journal_entry',
    patterns: [
      /(?:create|make|record|add)\s+(?:a\s+)?journal\s*entry/i,
      /journal[:\s]+debit\s+(.+)/i,
      /debit\s+(.+?)\s+credit\s+(.+)/i,
    ],
    extract: (msg: string) => {
      const match = msg.match(/debit\s+(.+?)\s+credit\s+(.+?)\s+\$?(\d[\d,.]+)/i);
      if (match) {
        return {
          debitAccount: match[1].trim(),
          creditAccount: match[2].trim(),
          amount: parseFloat(match[3].replace(/,/g, '')),
        };
      }
      return { description: msg };
    },
  },
];

// ── Action detection ────────────────────────────────────────────────────────

/**
 * Detect if a user message contains an actionable command.
 * Returns null if no action detected.
 */
export function detectAction(message: string): AIAction | null {
  const lower = message.toLowerCase().trim();

  for (const pattern of ACTION_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(lower)) {
        const data = pattern.extract(message);
        return {
          type: pattern.type,
          data,
          description: buildActionDescription(pattern.type, data),
          requiresConfirmation: true,
        };
      }
    }
  }

  return null;
}

/**
 * Build a human-readable description of an action.
 */
function buildActionDescription(type: AIActionType, data: Record<string, any>): string {
  switch (type) {
    case 'create_invoice':
      return `Create invoice for ${data.client || 'client'}${data.amount ? ` — $${data.amount.toLocaleString()}` : ''}`;
    case 'record_expense':
      return `Record expense: ${data.description || 'item'}${data.amount ? ` — $${data.amount.toLocaleString()}` : ''}`;
    case 'add_transaction':
      return `Add ${data.type || 'income'}: ${data.description || 'transaction'}${data.amount ? ` — $${data.amount.toLocaleString()}` : ''}`;
    case 'add_employee':
      return `Add employee: ${data.name || 'New hire'}${data.salary ? ` — Salary $${data.salary.toLocaleString()}/mo` : ''}`;
    case 'generate_report':
      return `Generate ${(data.reportType || 'financial summary').replace(/_/g, ' ')} report`;
    case 'invite_member':
      return `Invite ${data.name || data.email || 'member'} as ${data.role || 'viewer'}`;
    case 'create_journal_entry':
      return `Journal entry: DR ${data.debitAccount || '?'} / CR ${data.creditAccount || '?'}${data.amount ? ` — $${data.amount.toLocaleString()}` : ''}`;
    case 'categorize_expense':
      return `Categorize: ${data.description || 'expense'}`;
    default:
      return 'Unknown action';
  }
}

/**
 * Build the AI response message that accompanies an action.
 */
export function buildActionResponse(action: AIAction, ctx: AIContext): string {
  // Check permission
  if (!canExecuteAction(ctx.role, action.type)) {
    return (
      `I detected you want to: **${action.description}**\n\n` +
      `❌ Your role (**${ctx.role}**) doesn't have permission to execute this action.\n` +
      `Contact your organization owner to request access.`
    );
  }

  // Validate
  const error = validateAction(action, ctx);
  if (error) {
    return `I detected your request: **${action.description}**\n\n⚠️ ${error}`;
  }

  // Build confirmation message
  logAction(action, 'pending', ctx.organizationId);

  let response = `## 🤖 Action Detected\n\n`;
  response += `**${action.description}**\n\n`;
  response += `**Details:**\n`;

  for (const [key, value] of Object.entries(action.data)) {
    if (value !== undefined && value !== '' && value !== 0) {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      response += `• ${label}: **${typeof value === 'number' ? value.toLocaleString() : value}**\n`;
    }
  }

  response += `\n✅ Click **Execute** below to proceed, or tell me to modify the details.`;

  return response;
}

/**
 * Execute a confirmed action via Supabase.
 */
export async function executeAction(
  action: AIAction,
  ctx: AIContext,
  supabase: any,
): Promise<{ success: boolean; message: string }> {
  const error = validateAction(action, ctx);
  if (error) {
    logAction(action, 'rejected', ctx.organizationId);
    return { success: false, message: error };
  }

  logAction(action, 'pending', ctx.organizationId);

  try {
    switch (action.type) {
      case 'create_invoice': {
        const { client, amount, description } = action.data;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const { error: err } = await supabase.from('invoices').insert({
          organization_id: ctx.organizationId,
          client_name: client,
          amount: amount || 0,
          description: description || `Invoice for ${client}`,
          status: 'draft',
          due_date: dueDate.toISOString(),
          issue_date: new Date().toISOString(),
        });

        if (err) throw err;
        logAction(action, 'executed', ctx.organizationId);
        return { success: true, message: `✅ Invoice created for **${client}** — $${(amount || 0).toLocaleString()}. Check the Invoices page to review and send.` };
      }

      case 'record_expense': {
        const { description, amount, category } = action.data;
        const { error: err } = await supabase.from('transactions').insert({
          organization_id: ctx.organizationId,
          type: 'expense',
          amount: amount || 0,
          description: description || 'Expense',
          category: category || 'General',
          date: new Date().toISOString(),
        });

        if (err) throw err;
        logAction(action, 'executed', ctx.organizationId);
        return { success: true, message: `✅ Expense recorded: **${description || 'item'}** — $${(amount || 0).toLocaleString()}` };
      }

      case 'add_transaction': {
        const { description, amount, type: txType } = action.data;
        const { error: err } = await supabase.from('transactions').insert({
          organization_id: ctx.organizationId,
          type: txType || 'income',
          amount: amount || 0,
          description: description || 'Income',
          category: 'Revenue',
          date: new Date().toISOString(),
        });

        if (err) throw err;
        logAction(action, 'executed', ctx.organizationId);
        return { success: true, message: `✅ ${txType === 'income' ? 'Income' : 'Transaction'} recorded: **${description}** — $${(amount || 0).toLocaleString()}` };
      }

      case 'add_employee': {
        const { name, salary, position } = action.data;
        const { error: err } = await supabase.from('payroll_employees').insert({
          organization_id: ctx.organizationId,
          name,
          salary: salary || 0,
          position: position || 'Staff',
          status: 'active',
        });

        if (err) throw err;
        logAction(action, 'executed', ctx.organizationId);
        return { success: true, message: `✅ Employee **${name}** added${salary ? ` with salary $${salary.toLocaleString()}/mo` : ''}. Go to Payroll to configure details.` };
      }

      case 'invite_member': {
        const { email, role, name } = action.data;
        if (!email) {
          return { success: false, message: `❌ Email address is required to send an invitation. Try: "Invite accountant ${name || 'name'}@email.com"` };
        }
        // Use the team invitations service
        const { error: err } = await supabase.from('team_invitations').insert({
          organization_id: ctx.organizationId,
          email,
          role: role || 'viewer',
          status: 'pending',
        });

        if (err) throw err;
        logAction(action, 'executed', ctx.organizationId);
        return { success: true, message: `✅ Invitation sent to **${email}** as ${role || 'viewer'}. They'll receive an email to join.` };
      }

      case 'generate_report': {
        logAction(action, 'executed', ctx.organizationId);
        const reportType = action.data.reportType || 'financial_summary';
        const routes: Record<string, string> = {
          profit_loss: '/reports/income-statement',
          balance_sheet: '/reports/balance-sheet',
          cash_flow: '/reports/cash-flow',
          trial_balance: '/reports/trial-balance',
          expense_report: '/reports',
          financial_summary: '/reports',
        };
        const path = routes[reportType] || '/reports';
        return {
          success: true,
          message: `📊 Navigate to the **${reportType.replace(/_/g, ' ')}** report.\n\n<!--NAV_ACTION:${JSON.stringify({ action: 'navigate', path, pageName: reportType.replace(/_/g, ' ') })}-->`,
        };
      }

      default:
        return { success: false, message: 'Action type not supported for execution.' };
    }
  } catch (err: any) {
    logAction(action, 'failed', ctx.organizationId);
    console.error('[2KEI AI] Action execution failed:', err);
    return { success: false, message: `❌ Failed to execute: ${err.message || 'Unknown error'}` };
  }
}
