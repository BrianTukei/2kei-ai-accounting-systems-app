
import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define balance sheet categories
const assetCategories = ['Equipment', 'Investment', 'Interest', 'Client Payment', 'Project Payment'];
const liabilityCategories = ['Office Rent', 'Utilities', 'Subscription', 'Loan'];

export default function BalanceSheet() {
  const { transactions } = useTransactions();
  
  const balanceSheetData = useMemo(() => {
    // Simplification: we'll consider all income in asset categories as assets
    // and all expenses in liability categories as liabilities
    
    const assets = transactions.filter(t => 
      t.type === 'income' && assetCategories.includes(t.category)
    ).reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const liabilities = transactions.filter(t => 
      t.type === 'expense' && liabilityCategories.includes(t.category)
    ).reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate equity as all other transactions that affect the balance
    const income = transactions.filter(t => 
      t.type === 'income' && !assetCategories.includes(t.category)
    ).reduce((acc, t) => acc + t.amount, 0);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && !liabilityCategories.includes(t.category)
    ).reduce((acc, t) => acc + t.amount, 0);
    
    const equity = income - expenses;
    
    return { assets, liabilities, equity };
  }, [transactions]);
  
  // Calculate totals
  const totalAssets = Object.values(balanceSheetData.assets).reduce((sum, amount) => sum + amount, 0);
  const totalLiabilities = Object.values(balanceSheetData.liabilities).reduce((sum, amount) => sum + amount, 0);
  const totalEquity = balanceSheetData.equity;
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;
  
  const generatePDF = () => {
    const tableData = [
      ['Category', 'Amount ($)'],
      ['Assets', ''],
      ...Object.entries(balanceSheetData.assets).map(([category, amount]) => [
        category, amount.toFixed(2)
      ]),
      ['Total Assets', totalAssets.toFixed(2)],
      ['', ''],
      ['Liabilities', ''],
      ...Object.entries(balanceSheetData.liabilities).map(([category, amount]) => [
        category, amount.toFixed(2)
      ]),
      ['Total Liabilities', totalLiabilities.toFixed(2)],
      ['', ''],
      ['Equity', totalEquity.toFixed(2)],
      ['Total Liabilities & Equity', liabilitiesPlusEquity.toFixed(2)],
    ];
    
    const summary = [
      ['Balance', (totalAssets === liabilitiesPlusEquity ? 'Balanced' : 'Unbalanced')],
      ['Difference', (totalAssets - liabilitiesPlusEquity).toFixed(2)]
    ];
    
    generateBasePDF('Balance Sheet', tableData, summary);
  };
  
  return (
    <StatementLayout 
      title="Balance Sheet" 
      description="Statement of financial position"
      generatePDF={generatePDF}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Assets</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(balanceSheetData.assets).length > 0 ? (
                Object.entries(balanceSheetData.assets).map(([category, amount], index) => (
                  <TableRow key={index}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No assets recorded</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-bold">Total Assets</TableCell>
                <TableCell className="text-right font-bold">
                  ${totalAssets.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(balanceSheetData.liabilities).length > 0 ? (
                Object.entries(balanceSheetData.liabilities).map(([category, amount], index) => (
                  <TableRow key={index}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No liabilities recorded</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-bold">Total Liabilities</TableCell>
                <TableCell className="text-right font-bold">
                  ${totalLiabilities.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Equity</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Retained Earnings</TableCell>
                <TableCell className="text-right font-medium">
                  ${totalEquity.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Total Equity</TableCell>
                <TableCell className="text-right font-bold">
                  ${totalEquity.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-lg">Total Liabilities & Equity</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${liabilitiesPlusEquity.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={`font-medium ${totalAssets === liabilitiesPlusEquity ? 'text-green-600' : 'text-red-600'}`}>
                  Balance Check
                </TableCell>
                <TableCell className={`text-right font-medium ${totalAssets === liabilitiesPlusEquity ? 'text-green-600' : 'text-red-600'}`}>
                  {totalAssets === liabilitiesPlusEquity ? 'Balanced' : `Difference: $${(totalAssets - liabilitiesPlusEquity).toFixed(2)}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </StatementLayout>
  );
}
