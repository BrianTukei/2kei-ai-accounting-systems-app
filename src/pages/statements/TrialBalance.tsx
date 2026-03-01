
import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF, formatCurrency } from '@/components/statements/StatementLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TrialBalance() {
  const { transactions } = useTransactions();
  
  const trialBalanceData = useMemo(() => {
    const accountBalances: Record<string, { debit: number, credit: number }> = {};
    
    // Process all transactions to determine account balances
    transactions.forEach(t => {
      if (!accountBalances[t.category]) {
        accountBalances[t.category] = { debit: 0, credit: 0 };
      }
      
      // For income: credit the income account
      // For expense: debit the expense account
      if (t.type === 'income') {
        accountBalances[t.category].credit += t.amount;
      } else {
        accountBalances[t.category].debit += t.amount;
      }
    });
    
    return Object.entries(accountBalances)
      .map(([account, { debit, credit }]) => ({
        account,
        debit,
        credit
      }))
      .sort((a, b) => a.account.localeCompare(b.account));
  }, [transactions]);
  
  // Calculate totals
  const totalDebits = trialBalanceData.reduce((sum, { debit }) => sum + debit, 0);
  const totalCredits = trialBalanceData.reduce((sum, { credit }) => sum + credit, 0);
  const isBalanced = totalDebits === totalCredits;
  
  const generatePDF = () => {
    const tableData = [
      ['Account', 'Debit', 'Credit'],
      ...trialBalanceData.map(({ account, debit, credit }) => [
        account,
        debit > 0 ? formatCurrency(debit) : '',
        credit > 0 ? formatCurrency(credit) : ''
      ]),
      ['Total', formatCurrency(totalDebits), formatCurrency(totalCredits)],
    ];
    
    const summary = [
      ['Balance Status', isBalanced ? 'Balanced' : 'Unbalanced'],
      ['Difference', Math.abs(totalDebits - totalCredits).toFixed(2)]
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
                <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {item.debit > 0 ? formatCurrency(item.debit) : ''}
                </TableCell>
                <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {item.credit > 0 ? formatCurrency(item.credit) : ''}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 h-8">
              <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total</TableCell>
              <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                {formatCurrency(totalDebits)}
              </TableCell>
              <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                {formatCurrency(totalCredits)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <div className={`p-3 border rounded-md ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-medium ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
            {isBalanced 
              ? 'The trial balance is balanced. Debits equal credits.' 
              : `The trial balance is not balanced. Difference: $${Math.abs(totalDebits - totalCredits).toFixed(2)}`
            }
          </p>
        </div>
      </div>
      </StatementLayout>
    </AuthCheck>
  );
}
