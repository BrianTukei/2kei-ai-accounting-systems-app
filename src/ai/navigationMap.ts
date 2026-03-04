/* ═══════════════════════════════════════════════════════════════════════
   2KEI AI – System Navigation Map
   ═══════════════════════════════════════════════════════════════════════
   Maps every navigable page in the system with:
   • keywords  – trigger phrases the AI uses to match user intent
   • steps     – step-by-step guide shown in the AI response
   • menuItem  – the nav-item name the Navbar should highlight
   • permissions – role guard (empty = all authenticated users)
   ═══════════════════════════════════════════════════════════════════════ */

export interface NavPage {
  /** Human readable page name */
  name: string;
  /** React Router path */
  path: string;
  /** Phrases / keywords that map the user's question to this page */
  keywords: string[];
  /** Step-by-step instructions shown in the AI's response */
  steps: string[];
  /** The value of `navItems[].name` in NavigationItems.tsx to highlight */
  menuItem: string;
  /** Roles allowed to access (empty array = all authenticated users) */
  permissions: string[];
}

export const NAVIGATION_MAP: NavPage[] = [
  // ── Main ──────────────────────────────────────────────────────────────
  {
    name: 'Dashboard',
    path: '/dashboard',
    keywords: [
      'dashboard', 'home', 'main page', 'overview', 'start page',
      'my account', 'landing', 'main screen',
    ],
    steps: [
      'Click the **Dashboard** item in the top navigation bar (or hamburger menu on mobile).',
      'You\'ll see your financial overview: balance, income, expenses, and charts.',
      'Use the stat cards to jump into detailed views.',
    ],
    menuItem: 'Dashboard',
    permissions: [],
  },
  {
    name: 'Transactions',
    path: '/transactions',
    keywords: [
      'transaction', 'transactions', 'add transaction', 'record transaction',
      'income entry', 'expense entry', 'record payment', 'log expense',
      'add income', 'add expense', 'new transaction', 'enter transaction',
      'transaction list', 'transaction history',
    ],
    steps: [
      'Open the **Transactions** page from the top navigation bar.',
      'Use the **+ Add Transaction** button to record a new income or expense.',
      'Fill in the amount, category, date, and optional description.',
      'Click **Save** to record it. The transaction will appear in your list immediately.',
    ],
    menuItem: 'Transactions',
    permissions: [],
  },
  {
    name: 'Reports',
    path: '/reports',
    keywords: [
      'report', 'reports', 'financial report', 'analytics', 'view reports',
      'generate report', 'reporting', 'data analysis',
    ],
    steps: [
      'Navigate to the **Reports** page from the top navigation bar.',
      'Choose the report type and date range you need.',
      'Review charts and tables to analyze your financial data.',
    ],
    menuItem: 'Reports',
    permissions: [],
  },

  // ── Hamburger menu items ──────────────────────────────────────────────
  {
    name: 'Invoices',
    path: '/invoices',
    keywords: [
      'invoice', 'invoices', 'create invoice', 'send invoice', 'billing',
      'new invoice', 'invoice client', 'bill customer', 'accounts receivable',
      'manage invoices', 'invoice list',
    ],
    steps: [
      'Open the hamburger menu (☰) on the left side of the navbar.',
      'Click **Invoices** under the Main section.',
      'Use the **Create Invoice** button to generate a new invoice.',
      'Fill in client details, line items, and payment terms.',
      'Save as draft or send directly to the client.',
    ],
    menuItem: 'Invoices',
    permissions: [],
  },
  {
    name: 'Bank Import',
    path: '/bank-import',
    keywords: [
      'bank import', 'import bank', 'bank statement', 'upload bank',
      'csv import', 'bank data', 'import transactions', 'bank file',
      'upload statement', 'bank csv', 'import csv',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **Bank Import**.',
      'Upload your bank statement file (CSV format supported).',
      'Map the columns to match the system\'s fields (date, amount, description).',
      'Review the imported transactions and confirm to add them to your records.',
    ],
    menuItem: 'Bank Import',
    permissions: [],
  },
  {
    name: 'Bookkeeping (Journal)',
    path: '/journal',
    keywords: [
      'journal', 'bookkeeping', 'journal entry', 'general journal',
      'double entry', 'debit credit', 'ledger', 'accounting entry',
      'manual entry', 'journal entries', 'book keeping',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **Bookkeeping**.',
      'Use the **New Journal Entry** button to create a double-entry record.',
      'Enter the debit and credit accounts with their amounts.',
      'Add a description and date, then save the entry.',
    ],
    menuItem: 'Bookkeeping',
    permissions: [],
  },
  {
    name: 'Forecast',
    path: '/forecast',
    keywords: [
      'forecast', 'prediction', 'projection', 'future', 'predict',
      'financial forecast', 'cash forecast', 'revenue forecast',
      'budget forecast', 'forecasting',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **Forecast**.',
      'View AI-generated projections for your income and expenses.',
      'Adjust the forecast period to see short-term or long-term predictions.',
    ],
    menuItem: 'Forecast',
    permissions: [],
  },
  {
    name: 'AI Assistant',
    path: '/ai-assistant',
    keywords: [
      'ai assistant', 'chat', 'ai chat', 'ask ai', 'financial advisor',
      'ai help', 'smart assistant', 'ai analysis',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **AI Assistant**.',
      'Type your financial question in the chat input.',
      'The AI analyzes your real data and provides CFO-grade insights.',
    ],
    menuItem: 'AI Assistant',
    permissions: [],
  },
  {
    name: 'Payroll',
    path: '/payroll',
    keywords: [
      'payroll', 'salary', 'wages', 'pay employees', 'staff payment',
      'employee pay', 'payslip', 'pay run', 'compensation',
      'salaries', 'payroll run',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **Payroll**.',
      'Add employees and set their salary details.',
      'Run payroll to calculate and record salary payments.',
      'Generate payslips and review payment history.',
    ],
    menuItem: 'Payroll',
    permissions: [],
  },
  {
    name: 'Recurring Transactions',
    path: '/recurring-transactions',
    keywords: [
      'recurring', 'recurring transaction', 'subscription', 'autopay',
      'auto payment', 'scheduled payment', 'repeat transaction',
      'standing order', 'recurring expense', 'recurring income',
    ],
    steps: [
      'Open the hamburger menu (☰) and click **Recurring**.',
      'Use the **Add Recurring Transaction** button.',
      'Set the amount, category, frequency (daily/weekly/monthly), and start date.',
      'The system will automatically create transactions on schedule.',
    ],
    menuItem: 'Recurring',
    permissions: [],
  },

  // ── Financial Statements ──────────────────────────────────────────────
  {
    name: 'Income Statement',
    path: '/income-statement',
    keywords: [
      'income statement', 'profit and loss', 'p&l', 'p & l', 'pnl',
      'profit loss statement', 'revenue statement', 'earnings report',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to **Financial Statements**.',
      'Click **Income Statement**.',
      'View your revenue, cost of goods sold, gross profit, operating expenses, and net income.',
      'Use the date range picker to compare different periods.',
    ],
    menuItem: 'Income Statement',
    permissions: [],
  },
  {
    name: 'Balance Sheet',
    path: '/balance-sheet',
    keywords: [
      'balance sheet', 'assets', 'liabilities', 'equity',
      'financial position', 'net worth', 'assets and liabilities',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to **Financial Statements**.',
      'Click **Balance Sheet**.',
      'Review your assets, liabilities, and equity to understand your financial position.',
    ],
    menuItem: 'Balance Sheet',
    permissions: [],
  },
  {
    name: 'Cash Flow Statement',
    path: '/cash-flow',
    keywords: [
      'cash flow statement', 'cash flow report', 'statement of cash flows',
      'cash inflow', 'cash outflow', 'operating activities',
      'financing activities', 'investing activities',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to **Financial Statements**.',
      'Click **Cash Flow**.',
      'Analyze cash movements across operating, investing, and financing activities.',
    ],
    menuItem: 'Cash Flow',
    permissions: [],
  },
  {
    name: 'Trial Balance',
    path: '/trial-balance',
    keywords: [
      'trial balance', 'tb', 'account balances', 'debit credit balance',
      'general ledger summary', 'chart of accounts balance',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to **Financial Statements**.',
      'Click **Trial Balance**.',
      'Review all account balances to ensure debits equal credits.',
    ],
    menuItem: 'Trial Balance',
    permissions: [],
  },
  {
    name: 'Cash Book',
    path: '/cash-book',
    keywords: [
      'cash book', 'cashbook', 'cash register', 'cash ledger',
      'petty cash', 'cash record', 'cash transactions',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to **Financial Statements**.',
      'Click **Cash Book**.',
      'View all cash receipts and payments in chronological order.',
    ],
    menuItem: 'Cash Book',
    permissions: [],
  },

  // ── SaaS / Account ───────────────────────────────────────────────────
  {
    name: 'Team Management',
    path: '/team',
    keywords: [
      'team', 'invite user', 'add user', 'team member', 'manage team',
      'invite member', 'add member', 'user management', 'collaborator',
      'team settings', 'organization members',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to the **Account** section.',
      'Click **Team**.',
      'Use **Invite Member** to send email invitations to team members.',
      'Assign roles (Admin, Accountant, Viewer) to control access.',
    ],
    menuItem: 'Team',
    permissions: [],
  },
  {
    name: 'Billing & Subscription',
    path: '/billing',
    keywords: [
      'billing', 'subscription', 'plan', 'upgrade', 'pricing',
      'payment method', 'change plan', 'cancel subscription',
      'billing history', 'premium', 'pro plan', 'enterprise',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to the **Account** section.',
      'Click **Billing**.',
      'View your current plan, usage, and billing history.',
      'Click **Upgrade** to change your subscription tier.',
    ],
    menuItem: 'Billing',
    permissions: [],
  },
  {
    name: 'Settings',
    path: '/settings',
    keywords: [
      'settings', 'preferences', 'configuration', 'app settings',
      'account settings', 'general settings', 'customize',
      'change settings', 'setup',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to the **Account** section.',
      'Click **Settings**.',
      'Adjust your organization settings, currency, and preferences.',
    ],
    menuItem: 'Settings',
    permissions: [],
  },
  {
    name: 'Profile',
    path: '/profile',
    keywords: [
      'profile', 'my profile', 'edit profile', 'account info',
      'change name', 'update email', 'avatar', 'personal info',
      'my account', 'user profile',
    ],
    steps: [
      'Click the **user avatar** (or initials) in the top-right corner of the navbar.',
      'Select **Profile** from the dropdown menu.',
      'Update your name, email, avatar, and other personal information.',
    ],
    menuItem: 'Profile',
    permissions: [],
  },

  // ── Admin (restricted) ──────────────────────────────────────────────
  {
    name: 'Admin Dashboard',
    path: '/admin',
    keywords: [
      'admin', 'admin dashboard', 'admin panel', 'administration',
      'system admin', 'manage system',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to the **Admin** section (visible only to admins).',
      'Click **Admin Dashboard**.',
      'View system-wide statistics, user activity, and platform health.',
    ],
    menuItem: 'Admin Dashboard',
    permissions: ['admin'],
  },
  {
    name: 'User Management (Admin)',
    path: '/admin/users',
    keywords: [
      'admin users', 'manage users', 'user list', 'admin user management',
      'all users', 'system users',
    ],
    steps: [
      'Open the hamburger menu (☰) and scroll to the **Admin** section.',
      'Click **User Management**.',
      'View, search, and manage all platform users.',
    ],
    menuItem: 'User Management',
    permissions: ['admin'],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────

/**
 * Searches the navigation map for pages matching the user's query.
 * Returns pages sorted by relevance (most keyword matches first).
 */
export function findNavPages(query: string): NavPage[] {
  const lower = query.toLowerCase();
  const tokens = lower.split(/\s+/).filter(t => t.length > 2);

  const scored = NAVIGATION_MAP.map(page => {
    let score = 0;

    // Direct keyword match (highest weight)
    for (const kw of page.keywords) {
      if (lower.includes(kw)) {
        score += 10 + kw.length; // longer keyword matches are more specific
      }
    }

    // Token-level partial matches
    for (const token of tokens) {
      for (const kw of page.keywords) {
        if (kw.includes(token)) score += 3;
      }
      // Match against page name
      if (page.name.toLowerCase().includes(token)) score += 5;
    }

    return { page, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.page);
}

/**
 * Structured navigation action that can be embedded in AI responses.
 * The AIChat component detects this JSON in the response and renders a button.
 */
export interface NavigationAction {
  action: 'navigate';
  path: string;
  highlight: string; // menuItem name to highlight in Navbar
  pageName: string;
}

/**
 * Build a navigation JSON action for embedding in AI responses.
 */
export function buildNavigationAction(page: NavPage): NavigationAction {
  return {
    action: 'navigate',
    path: page.path,
    highlight: page.menuItem,
    pageName: page.name,
  };
}
