import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
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
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };
  
  const generatePDF = () => {
    const tableData = [
      ['Category', 'Amount ($)'],
      ['Operating Activities', ''],
      ...cashFlowData.operating.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '+' : '-') + t.amount.toFixed(2)
      ]),
      ['Net Cash from Operating Activities', formatCashFlow(operatingTotal)],
      ['', ''],
      ['Investing Activities', ''],
      ...cashFlowData.investing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '+' : '-') + t.amount.toFixed(2)
      ]),
      ['Net Cash from Investing Activities', formatCashFlow(investingTotal)],
      ['', ''],
      ['Financing Activities', ''],
      ...cashFlowData.financing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '+' : '-') + t.amount.toFixed(2)
      ]),
      ['Net Cash from Financing Activities', formatCashFlow(financingTotal)],
    ];
    
    const summary = [
      ['Net Increase in Cash', formatCashFlow(netCashFlow)]
    ];
    
    generateBasePDF('Cash Flow Statement', tableData, summary);
  };
  
  return (
    <StatementLayout 
      title="Cash Flow Statement" 
      description="Summary of cash inflows and outflows"
      generatePDF={generatePDF}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Operating Activities</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.operating.map((t, index) => (
                <TableRow key={index}>
                  <TableCell>{t.category} - {t.description}</TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Net Cash from Operating Activities</TableCell>
                <TableCell className={`text-right font-bold ${operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(operatingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Investing Activities</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.investing.length > 0 ? (
                <>
                  {cashFlowData.investing.map((t, index) => (
                    <TableRow key={index}>
                      <TableCell>{t.category} - {t.description}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No investing activities</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-bold">Net Cash from Investing Activities</TableCell>
                <TableCell className={`text-right font-bold ${investingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(investingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Financing Activities</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowData.financing.length > 0 ? (
                <>
                  {cashFlowData.financing.map((t, index) => (
                    <TableRow key={index}>
                      <TableCell>{t.category} - {t.description}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">No financing activities</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-bold">Net Cash from Financing Activities</TableCell>
                <TableCell className={`text-right font-bold ${financingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(financingTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-lg">Net Increase in Cash</TableCell>
                <TableCell className={`text-right font-bold text-lg ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCashFlow(netCashFlow)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </StatementLayout>
  );
}
