
import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
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
      ['Account', 'Debit ($)', 'Credit ($)'],
      ...trialBalanceData.map(({ account, debit, credit }) => [
        account, 
        debit > 0 ? debit.toFixed(2) : '',
        credit > 0 ? credit.toFixed(2) : ''
      ]),
      ['Total', totalDebits.toFixed(2), totalCredits.toFixed(2)],
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
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trialBalanceData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.account}</TableCell>
                <TableCell className="text-right font-medium">
                  {item.debit > 0 ? `$${item.debit.toFixed(2)}` : ''}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.credit > 0 ? `$${item.credit.toFixed(2)}` : ''}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2">
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">
                ${totalDebits.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold">
                ${totalCredits.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <div className={`p-4 border rounded-md ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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
