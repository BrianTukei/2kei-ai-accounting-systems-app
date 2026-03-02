import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF, formatCurrency, getStoredCurrencySymbol } from '@/components/statements/StatementLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define cash flow categories
const operatingCategories = ['Salary', 'Sales Revenue', 'Consulting Fee', 'Client Payment', 'Project Payment', 'Office Rent', 'Utilities', 'Office Supplies', 'Marketing', 'Salary Expense'];
const investingCategories = ['Investment', 'Equipment', 'Dividend'];
const financingCategories = ['Interest', 'Loan'];

export default function CashFlow() {
  const { transactions } = useTransactions();
  
  const cashFlowData = useMemo(() => {
    // Group transactions by cash flow type
    const operating = transactions.filter(t => 
      operatingCategories.includes(t.category)
    );
    
    const investing = transactions.filter(t => 
      investingCategories.includes(t.category)
    );
    
    const financing = transactions.filter(t => 
      financingCategories.includes(t.category)
    );
    
    // Others
    const other = transactions.filter(t => 
      !operatingCategories.includes(t.category) && 
      !investingCategories.includes(t.category) && 
      !financingCategories.includes(t.category)
    );
    
    return { operating, investing, financing, other };
  }, [transactions]);
  
  // Calculate totals
  const operatingTotal = cashFlowData.operating.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );
  
  const investingTotal = cashFlowData.investing.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );
  
  const financingTotal = cashFlowData.financing.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );
  
  const otherTotal = cashFlowData.other.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );
  
  const netCashFlow = operatingTotal + investingTotal + financingTotal + otherTotal;
  
  const formatCashFlow = (value: number) => {
    const sym = getStoredCurrencySymbol();
    return value >= 0 ? `+${sym}${value.toFixed(2)}` : `-${sym}${Math.abs(value).toFixed(2)}`;
  };
  
  const generatePDF = () => {
    const tableData = [
      ['Category / Description', 'Amount'],
      ['Operating Activities', ''],
      ...cashFlowData.operating.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + formatCurrency(Math.abs(t.amount))
      ]),
      ['Net Cash from Operating Activities', formatCurrency(operatingTotal)],
      ['', ''],
      ['Investing Activities', ''],
      ...cashFlowData.investing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + formatCurrency(Math.abs(t.amount))
      ]),
      ['Net Cash from Investing Activities', formatCurrency(investingTotal)],
      ['', ''],
      ['Financing Activities', ''],
      ...cashFlowData.financing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + formatCurrency(Math.abs(t.amount))
      ]),
      ['Net Cash from Financing Activities', formatCurrency(financingTotal)],
    ];
    
    const summary = [
      ['Net Increase in Cash', formatCashFlow(netCashFlow)]
    ];
    
    generateBasePDF('Cash Flow Statement', tableData, summary);
  };

  return (
    <AuthCheck>
      <StatementLayout
      title="Cash Flow Statement" 
      description="Summary of cash inflows and outflows"
      generatePDF={generatePDF}
    >
      <div className="compact-spacing max-w-3xl mx-auto px-2 sm:px-0">
        <div>
          <h3 className="compact-text-lg font-semibold mb-2">Operating Activities</h3>
          <Table className="compact-table">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Description</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.operating.map((t, index) => (
                <TableRow key={index} className="h-8">
                  <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{t.category} - {t.description}</TableCell>
                  <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? formatCurrency(t.amount) : `-${formatCurrency(Math.abs(t.amount))}`}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="h-8">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Net Cash from Operating Activities</TableCell>
                <TableCell className={`text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm ${operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(operatingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="compact-text-lg font-semibold mb-2">Investing Activities</h3>
          <Table className="compact-table">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Description</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.investing.length > 0 ? (
                <>
                  {cashFlowData.investing.map((t, index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{t.category} - {t.description}</TableCell>
                      <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow className="h-8">
                  <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">No investing activities</TableCell>
                </TableRow>
              )}
              <TableRow className="h-8">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Net Cash from Investing Activities</TableCell>
                <TableCell className={`text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm ${investingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(investingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="compact-text-lg font-semibold mb-2">Financing Activities</h3>
          <Table className="compact-table">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Description</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.financing.length > 0 ? (
                <>
                  {cashFlowData.financing.map((t, index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{t.category} - {t.description}</TableCell>
                      <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow className="h-8">
                  <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">No financing activities</TableCell>
                </TableRow>
              )}
              <TableRow className="h-8">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Net Cash from Financing Activities</TableCell>
                <TableCell className={`text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm ${financingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(financingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4">
          <Table className="compact-table">
            <TableBody>
              <TableRow className="h-8">
                <TableCell className="font-bold text-xs sm:text-lg px-1 sm:px-2 py-1">Net Increase in Cash</TableCell>
                <TableCell className={`text-right font-bold text-xs sm:text-lg px-1 sm:px-2 py-1 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(netCashFlow)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      </StatementLayout>
    </AuthCheck>
  );
}
