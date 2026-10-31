import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const operatingCategories = [
  'Salary', 'Sales Revenue', 'Consulting Fee', 'Client Payment', 'Project Payment',
  'Office Rent', 'Utilities', 'Office Supplies', 'Marketing', 'Salary Expense', 'Food'
];
const investingCategories = ['Investment', 'Equipment', 'Dividend'];
const financingCategories = ['Interest', 'Loan'];

export default function CashFlow() {
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

  const cashFlowData = useMemo(() => {
    const operating = transactions.filter(t => operatingCategories.includes(t.category));
    const investing = transactions.filter(t => investingCategories.includes(t.category));
    const financing = transactions.filter(t => financingCategories.includes(t.category));
    const other = transactions.filter(
      t =>
        !operatingCategories.includes(t.category) &&
        !investingCategories.includes(t.category) &&
        !financingCategories.includes(t.category)
    );
    return { operating, investing, financing, other };
  }, [transactions]);

  const sumFlow = (list: typeof transactions) =>
    list.reduce((sum, t) => (t.type === 'income' ? sum + toDisplay(t) : sum - toDisplay(t)), 0);

  const operatingTotal = useMemo(
    () => sumFlow(cashFlowData.operating),
    [cashFlowData.operating, convertAmount, selectedCurrency.code]
  );
  const investingTotal = useMemo(
    () => sumFlow(cashFlowData.investing),
    [cashFlowData.investing, convertAmount, selectedCurrency.code]
  );
  const financingTotal = useMemo(
    () => sumFlow(cashFlowData.financing),
    [cashFlowData.financing, convertAmount, selectedCurrency.code]
  );
  const otherTotal = useMemo(
    () => sumFlow(cashFlowData.other),
    [cashFlowData.other, convertAmount, selectedCurrency.code]
  );

  const netCashFlow = operatingTotal + investingTotal + financingTotal + otherTotal;

  const formatCashFlow = (value: number) => {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${fmt(Math.abs(value))}`;
  };

  const generatePDF = () => {
    const tableData = [
      ['Category / Description', `Amount (${selectedCurrency.code})`],
      ['Operating Activities', ''],
      ...cashFlowData.operating.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + fmt(toDisplay(t))
      ]),
      ['Net Cash from Operating Activities', fmt(operatingTotal)],
      ['', ''],
      ['Investing Activities', ''],
      ...cashFlowData.investing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + fmt(toDisplay(t))
      ]),
      ['Net Cash from Investing Activities', fmt(investingTotal)],
      ['', ''],
      ['Financing Activities', ''],
      ...cashFlowData.financing.map(t => [
        `${t.category} - ${t.description}`,
        (t.type === 'income' ? '' : '-') + fmt(toDisplay(t))
      ]),
      ['Net Cash from Financing Activities', fmt(financingTotal)],
    ];

    const summary = [['Net Increase in Cash', formatCashFlow(netCashFlow)]];

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
                    <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">
                      {t.category} - {t.description}
                    </TableCell>
                    <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? fmt(toDisplay(t)) : `-${fmt(toDisplay(t))}`}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="h-8">
                  <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Net Cash from Operating Activities</TableCell>
                  <TableCell className={`text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm ${operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(operatingTotal)}
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
                  cashFlowData.investing.map((t, index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">
                        {t.category} - {t.description}
                      </TableCell>
                      <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(toDisplay(t))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">
                      No investing activities
                    </TableCell>
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
                  cashFlowData.financing.map((t, index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">
                        {t.category} - {t.description}
                      </TableCell>
                      <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{fmt(toDisplay(t))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">
                      No financing activities
                    </TableCell>
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
