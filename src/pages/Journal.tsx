/**
 * Journal.tsx
 * Automated Bookkeeping — Double-Entry Journal Ledger view.
 * Shows all journal entries, T-account trial balance, and chart of accounts.
 */
import { useState, useEffect, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import {
  loadJournal, computeTrialBalance, syncJournalFromTransactions,
  CHART_OF_ACCOUNTS, JournalEntry, TrialBalanceLine,
  fullResync, ResyncResult,
} from '@/services/bookkeeping';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvoices } from '@/hooks/useInvoices';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, BookOpen, Scale, List, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// Source badge colour map
// ─────────────────────────────────────────
const SOURCE_CLASS: Record<string, string> = {
  transaction:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  invoice:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'bank-import':'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  payroll:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  recurring:    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  manual:       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const ACCOUNT_TYPE_CLASS: Record<string, string> = {
  asset:     'text-blue-600 dark:text-blue-400',
  liability: 'text-red-600 dark:text-red-400',
  equity:    'text-purple-600 dark:text-purple-400',
  income:    'text-green-600 dark:text-green-400',
  expense:   'text-orange-600 dark:text-orange-400',
};

// ─────────────────────────────────────────
// Journal Entries tab
// ─────────────────────────────────────────
function JournalTab({ entries, formatCurrency }: { entries: JournalEntry[]; formatCurrency: (n: number) => string }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    entries.filter((e) =>
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.reference.toLowerCase().includes(search.toLowerCase()) ||
      e.source.toLowerCase().includes(search.toLowerCase())
    ), [entries, search]);

  if (!entries.length) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No journal entries yet.</p>
        <p className="text-sm mt-1">Add a transaction or import a bank statement to generate entries automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search entries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search journal entries"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) =>
              entry.lines.map((line, li) => (
                <TableRow
                  key={`${entry.id}-${li}`}
                  className={cn(
                    'transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40',
                    li > 0 && 'border-t-0'
                  )}
                >
                  {li === 0 ? (
                    <>
                      <TableCell rowSpan={entry.lines.length} className="font-mono text-xs text-slate-500 whitespace-nowrap align-top pt-3">
                        {entry.date}
                      </TableCell>
                      <TableCell rowSpan={entry.lines.length} className="align-top pt-3 max-w-[200px]">
                        <div className="font-medium text-sm truncate">{entry.description}</div>
                        <div className="text-xs text-slate-400 font-mono">{entry.reference.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell rowSpan={entry.lines.length} className="align-top pt-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', SOURCE_CLASS[entry.source] ?? SOURCE_CLASS.manual)}>
                          {entry.source}
                        </span>
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell className={cn('text-sm', li > 0 && 'pl-8')}>
                    <span className="font-mono text-xs text-slate-400 mr-2">{line.accountCode}</span>
                    {line.accountName}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-800 dark:text-slate-200">
                    {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-800 dark:text-slate-200">
                    {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Trial Balance tab
// ─────────────────────────────────────────
function TrialBalanceTab({ lines, formatCurrency }: { lines: TrialBalanceLine[]; formatCurrency: (n: number) => string }) {
  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-4">
      {/* Balance indicator */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border',
        balanced
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      )}>
        <Scale className="w-4 h-4" />
        {balanced ? 'Books are balanced — Total Debits = Total Credits' : `Out of balance by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800">
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <TableCell className="font-mono text-xs text-slate-400">{line.code}</TableCell>
                <TableCell className="font-medium text-sm">{line.name}</TableCell>
                <TableCell>
                  <span className={cn('text-xs font-semibold capitalize', ACCOUNT_TYPE_CLASS[line.type])}>
                    {line.type}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono text-sm font-semibold',
                  line.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-500'
                )}>
                  {formatCurrency(line.balance)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2">
              <TableCell colSpan={3} className="text-sm">Totals</TableCell>
              <TableCell className="text-right font-mono text-sm">{formatCurrency(totalDebit)}</TableCell>
              <TableCell className="text-right font-mono text-sm">{formatCurrency(totalCredit)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Chart of Accounts tab
// ─────────────────────────────────────────
function ChartOfAccountsTab({ balances, formatCurrency }: { balances: Map<string, number>; formatCurrency: (n: number) => string }) {
  const groups = ['asset', 'liability', 'equity', 'income', 'expense'] as const;
  return (
    <div className="space-y-4">
      {groups.map((type) => {
        const accounts = CHART_OF_ACCOUNTS.filter((a) => a.type === type);
        return (
          <Card key={type} className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className={cn('text-sm font-semibold uppercase tracking-wide', ACCOUNT_TYPE_CLASS[type])}>
                {type} Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {accounts.map((acc) => (
                  <div key={acc.code} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-sm">
                    <div>
                      <span className="font-mono text-xs text-slate-400 mr-2">{acc.code}</span>
                      <span className="font-medium">{acc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {balances.get(acc.code) != null && (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatCurrency(balances.get(acc.code)!)}</span>
                      )}
                      <Badge variant="outline" className="text-xs capitalize ml-2">
                        {acc.normalBalance}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function Journal() {
  const { transactions } = useTransactions();
  const { invoices }     = useInvoices();
  const { formatCurrency } = useCurrency();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    syncJournalFromTransactions(transactions);
    setEntries(loadJournal());
  };

  useEffect(() => { load(); }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const trialBalance = useMemo(() => computeTrialBalance(entries), [entries]);

  const balancesMap = useMemo(() => {
    const m = new Map<string, number>();
    trialBalance.forEach((l) => m.set(l.code, l.balance));
    return m;
  }, [trialBalance]);

  const handleResync = () => {
    setSyncing(true);
    // Defer heavy work one tick so the spinner render cycle fires first
    setTimeout(() => {
      const result: ResyncResult = fullResync(transactions, invoices);
      setEntries(loadJournal());
      setSyncing(false);

      const parts: string[] = [];
      if (result.transactions) parts.push(`${result.transactions} transaction${result.transactions !== 1 ? 's' : ''}`);
      if (result.invoices)     parts.push(`${result.invoices} invoice${result.invoices !== 1 ? 's' : ''}`);
      if (result.bankImports)  parts.push(`${result.bankImports} bank import${result.bankImports !== 1 ? 's' : ''}`);

      const summary = parts.length
        ? `Re-synced: ${parts.join(', ')}`
        : 'No transactions to sync yet.';
      const staleNote = result.removed ? ` (replaced ${result.removed} stale entries)` : '';

      toast.success(`Journal rebuilt — ${summary}${staleNote}`);
    }, 0);
  };

  return (
    <PageLayout
      title="Automated Bookkeeping"
      subtitle="Double-entry journal ledger, trial balance, and chart of accounts — updated automatically."
      showBackButton={false}
      aiContextType="bookkeeping"
    >
      {/* Summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Journal Entries', value: entries.length },
          { label: 'Accounts Active', value: trialBalance.length },
          { label: 'Total Debits',    value: formatCurrency(trialBalance.reduce((s, l) => s + l.debit, 0)) },
          { label: 'Total Credits',   value: formatCurrency(trialBalance.reduce((s, l) => s + l.credit, 0)) },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-3">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="journal">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="w-4 h-4" /> Journal
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-2">
              <Scale className="w-4 h-4" /> Trial Balance
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <List className="w-4 h-4" /> Chart of Accounts
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleResync} disabled={syncing} className="gap-1">
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Re-sync'}
          </Button>
        </div>

        <TabsContent value="journal" className="mt-0">
          <JournalTab entries={entries} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="trial-balance" className="mt-0">
          <TrialBalanceTab lines={trialBalance} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="chart" className="mt-0">
          <ChartOfAccountsTab balances={balancesMap} formatCurrency={formatCurrency} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
