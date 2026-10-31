import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';
import { AIAssistantService } from '@/services/aiAssistant';
import { toast } from 'sonner';

const assetCategories = ['Equipment', 'Investment', 'Interest', 'Client Payment', 'Project Payment'];
const liabilityCategories = ['Office Rent', 'Utilities', 'Subscription', 'Loan'];

export default function BalanceSheet() {
  const { transactions } = useTransactions();
  const { formatCurrency, convertAmount, selectedCurrency } = useCurrency();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

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

  const balanceSheetData = useMemo(() => {
    const assets = transactions
      .filter(t => t.type === 'income' && assetCategories.includes(t.category))
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += toDisplay(t);
        return acc;
      }, {} as Record<string, number>);

    const liabilities = transactions
      .filter(t => t.type === 'expense' && liabilityCategories.includes(t.category))
      .reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = 0;
        acc[t.category] += toDisplay(t);
        return acc;
      }, {} as Record<string, number>);

    const income = transactions
      .filter(t => t.type === 'income' && !assetCategories.includes(t.category))
      .reduce((acc, t) => acc + toDisplay(t), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense' && !liabilityCategories.includes(t.category))
      .reduce((acc, t) => acc + toDisplay(t), 0);

    const equity = income - expenses;

    return { assets, liabilities, equity };
  }, [transactions, convertAmount, selectedCurrency.code]);

  const totalAssets = Object.values(balanceSheetData.assets).reduce((sum, amount) => sum + amount, 0);
  const totalLiabilities = Object.values(balanceSheetData.liabilities).reduce((sum, amount) => sum + amount, 0);
  const totalEquity = balanceSheetData.equity;
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;

  const handleAIAnalysis = async () => {
    setIsLoadingInsight(true);
    try {
      const reportData = {
        totalAssets,
        totalLiabilities,
        totalEquity,
        liabilitiesPlusEquity,
        isBalanced: Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01,
        difference: totalAssets - liabilitiesPlusEquity,
        assets: balanceSheetData.assets,
        liabilities: balanceSheetData.liabilities,
        transactionCount: transactions.length,
        currency: selectedCurrency.code,
      };

      const response = await AIAssistantService.analyzeReport('Balance Sheet', reportData);

      if (response.success && response.response) {
        setAiInsight(response.response);
      } else {
        throw new Error(response.error || 'Failed to generate AI analysis');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate AI insight');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const getBalanceSheetInsights = () => {
    const insights = [];
    const balanced = Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01;

    if (!balanced) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        message: `Balance sheet is not balanced. Difference: ${fmt(Math.abs(totalAssets - liabilitiesPlusEquity))}`
      });
    } else {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        message: 'Balance sheet is properly balanced (Assets = Liabilities + Equity)'
      });
    }

    if (totalAssets > 0) {
      const debtRatio = totalLiabilities / totalAssets;
      if (debtRatio > 0.6) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          message: `High debt ratio: ${(debtRatio * 100).toFixed(1)}%. Consider reducing liabilities.`
        });
      } else if (debtRatio < 0.3) {
        insights.push({
          type: 'info',
          icon: Info,
          message: `Conservative debt ratio: ${(debtRatio * 100).toFixed(1)}%. Good financial position.`
        });
      }
    }

    return insights;
  };

  const generatePDF = () => {
    const tableData = [
      ['Category', `Amount (${selectedCurrency.code})`],
      ['Assets', ''],
      ...Object.entries(balanceSheetData.assets).map(([category, amount]) => [
        category, fmt(amount)
      ]),
      ['Total Assets', fmt(totalAssets)],
      ['', ''],
      ['Liabilities', ''],
      ...Object.entries(balanceSheetData.liabilities).map(([category, amount]) => [
        category, fmt(amount)
      ]),
      ['Total Liabilities', fmt(totalLiabilities)],
      ['', ''],
      ['Equity', fmt(totalEquity)],
      ['Total Liabilities & Equity', fmt(liabilitiesPlusEquity)],
    ];

    const summary = [
      ['Balance', Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01 ? 'Balanced' : 'Unbalanced'],
      ['Difference', fmt(totalAssets - liabilitiesPlusEquity)]
    ];

    generateBasePDF('Balance Sheet', tableData, summary);
  };

  return (
    <AuthCheck>
      <StatementLayout
        title="Balance Sheet"
        description="Statement of financial position"
        generatePDF={generatePDF}
      >
        <div className="mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {getBalanceSheetInsights().map((insight, index) => (
              <Card key={index} className={`p-3 ${
                insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                insight.type === 'success' ? 'border-green-200 bg-green-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start gap-2">
                  <insight.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    insight.type === 'warning' ? 'text-yellow-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <p className="text-sm">{insight.message}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleAIAnalysis}
              disabled={isLoadingInsight}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {isLoadingInsight ? 'Analyzing...' : 'Get AI Analysis'}
            </Button>
          </div>

          {aiInsight && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                  <div className="text-sm text-blue-800 whitespace-pre-wrap">
                    {aiInsight}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="compact-spacing max-w-3xl mx-auto px-2 sm:px-0">
          <div>
            <h3 className="compact-text-lg font-semibold mb-2">Assets</h3>
            <Table className="compact-table">
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Category</TableHead>
                  <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(balanceSheetData.assets).length > 0 ? (
                  Object.entries(balanceSheetData.assets).map(([category, amount], index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{category}</TableCell>
                      <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                        {fmt(amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">No assets recorded</TableCell>
                  </TableRow>
                )}
                <TableRow className="h-8">
                  <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total Assets</TableCell>
                  <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {fmt(totalAssets)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="compact-text-lg font-semibold mb-2">Liabilities</h3>
            <Table className="compact-table">
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Category</TableHead>
                  <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(balanceSheetData.liabilities).length > 0 ? (
                  Object.entries(balanceSheetData.liabilities).map(([category, amount], index) => (
                    <TableRow key={index} className="h-8">
                      <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{category}</TableCell>
                      <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                        {fmt(amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="text-center text-muted-foreground px-1 sm:px-2 py-1 text-xs sm:text-sm">No liabilities recorded</TableCell>
                  </TableRow>
                )}
                <TableRow className="h-8">
                  <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total Liabilities</TableCell>
                  <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {fmt(totalLiabilities)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="compact-text-lg font-semibold mb-2">Equity</h3>
            <Table className="compact-table">
              <TableBody>
                <TableRow className="h-8">
                  <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Retained Earnings</TableCell>
                  <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {fmt(totalEquity)}
                  </TableCell>
                </TableRow>
                <TableRow className="h-8">
                  <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total Equity</TableCell>
                  <TableCell className="text-right font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {fmt(totalEquity)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <Table className="compact-table">
              <TableBody>
                <TableRow className="h-8">
                  <TableCell className="font-bold text-xs sm:text-lg px-1 sm:px-2 py-1">Total Liabilities & Equity</TableCell>
                  <TableCell className="text-right font-bold text-xs sm:text-lg px-1 sm:px-2 py-1">
                    {fmt(liabilitiesPlusEquity)}
                  </TableCell>
                </TableRow>
                <TableRow className="h-8">
                  <TableCell className={`font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    Balance Check
                  </TableCell>
                  <TableCell className={`text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm ${Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01
                      ? 'Balanced'
                      : `Difference: ${fmt(totalAssets - liabilitiesPlusEquity)}`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </StatementLayout>

      <AIFloatingButton
        contextType="report"
        contextData={{
          reportType: 'Balance Sheet',
          reportData: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            assets: balanceSheetData.assets,
            liabilities: balanceSheetData.liabilities,
            isBalanced: Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01,
            difference: totalAssets - liabilitiesPlusEquity,
            currency: selectedCurrency.code,
          }
        }}
      />
    </AuthCheck>
  );
}
