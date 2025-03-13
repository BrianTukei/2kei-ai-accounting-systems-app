
import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function IncomeStatement() {
  const { transactions } = useTransactions();
  
  const incomeData = useMemo(() => {
    // Group income transactions by category
    const incomeByCategory = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(incomeByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);
  
  const expenseData = useMemo(() => {
    // Group expense transactions by category
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);
  
  const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  
  const generatePDF = () => {
    const tableData = [
      ['Category', 'Amount ($)'],
      ['Income', ''],
      ...incomeData.map(item => [
        item.category, 
        item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ]),
      ['Total Income', totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })],
      ['', ''],
      ['Expenses', ''],
      ...expenseData.map(item => [
        item.category, 
        item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ]),
      ['Total Expenses', totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })],
    ];
    
    const summary = [
      ['Net Income', netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, style: 'currency', currency: 'USD' })]
    ];
    
    generateBasePDF('Income Statement', tableData, summary);
  };
  
  return (
    <StatementLayout 
      title="Income Statement" 
      description="Summary of revenues, costs, and expenses"
      generatePDF={generatePDF}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Income</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total Income</TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  ${totalIncome.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total Expenses</TableCell>
                <TableCell className="text-right font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-lg">Net Income</TableCell>
                <TableCell className={`text-right font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netIncome.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </StatementLayout>
  );
}
