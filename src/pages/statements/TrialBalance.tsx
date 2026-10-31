import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TrialBalance() {
  const { transactions } = useTransactions();
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();

  const toDisplay = (t: any): number => {
    const amount = Number(t.original_amount ?? t.originalAmount ?? t.amount) || 0;
    const from =
      t.original_currency ??
      t.originalCurrency ??
      t.currency ??
      selectedCurrency.code;
    return convertAmount(amount, from, selectedCurrency.code);
  };

  const fmt = (v: number) => formatCurrency(v, selectedCurrency.code);

  const trialBalanceData = useMemo(() => {
    const accountBalances: Record<string, { debit: number; credit: number }> = {};

    transactions.forEach(t => {
      if (!accountBalances[t.category]) {
        accountBalances[t.category] = { debit: 0, credit: 0 };
      }

      const amt = toDisplay(t);
      if (t.type === 'income') {
        accountBalances[t.category].credit += amt;
      } else {
        accountBalances[t.category].debit += amt;
      }
    });

    return Object.entries(accountBalances)
      .map(([account, { debit, credit }]) => ({
        account,
        debit,
        credit
      }))
      .sort((a, b) => a.account.localeCompare(b.account));
  }, [transactions, convertAmount, selectedCurrency.code]);

  const totalDebits = trialBalanceData.reduce((sum, { debit }) => sum + debit, 0);
  const totalCredits = trialBalanceData.reduce((sum, { credit }) => sum + credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const generatePDF = () => {
    const tableData = [
      ['Account', 'Debit', 'Credit'],
      ...trialBalanceData.map(({ account, debit, credit }) => [
        account,
        debit > 0 ? fmt(debit) : '',
        credit > 0 ? fmt(credit) : ''
      ]),
      ['Total', fmt(totalDebits), fmt(totalCredits)],
    ];

    const summary = [
      ['Balance Status', isBalanced ? 'Balanced' : 'Unbalanced'],
      ['Difference', fmt(Math.abs(totalDebits - totalCredits))]
    ];

    generateBasePDF('Trial Balance', tableData, summary);
  };

  return (
    <AuthCheck>
      <StatementLayout
        title="Trial Balance"
        description="Accounting verification of debits and credits"
        generatePDF={generatePDF}
      >
        <div className="max-w-3xl mx-auto px-2 sm:px-0">
          <Table className="compact-table">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Account</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Debit</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalanceData.map((item, index) => (
                <TableRow key={index} className="h-8">
                  <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{item.account}</TableCell>
                  <TableCell className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {item.debit > 0 ? fmt(item.debit) : '—'}
                  </TableCell>
                  <TableCell className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {item.credit > 0 ? fmt(item.credit) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="h-8 border-t-2">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total</TableCell>
                <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {fmt(totalDebits)}
                </TableCell>
                <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {fmt(totalCredits)}
                </TableCell>
              </TableRow>
              <TableRow className="h-8">
                <TableCell
                  colSpan={3}
                  className={`text-center font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isBalanced
                    ? 'Balanced'
                    : `Unbalanced — Difference: ${fmt(Math.abs(totalDebits - totalCredits))}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </StatementLayout>
    </AuthCheck>
  );
}
