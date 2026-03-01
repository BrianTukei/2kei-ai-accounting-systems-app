
import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import AuthCheck from '@/components/auth/AuthCheck';
import StatementLayout, { generateBasePDF } from '@/components/statements/StatementLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Info, DollarSign } from 'lucide-react';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';
import { AIAssistantService } from '@/services/aiAssistant';
import { toast } from 'sonner';

export default function IncomeStatement() {
  const { transactions } = useTransactions();
  const { formatCurrency } = useCurrency();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
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
  
  // AI Analysis function
  const handleAIAnalysis = async () => {
    setIsLoadingInsight(true);
    try {
      const reportData = {
        totalIncome,
        totalExpenses,
        netIncome,
        profitMargin: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
        incomeBreakdown: incomeData,
        expenseBreakdown: expenseData,
        transactionCount: transactions.length
      };

      const response = await AIAssistantService.analyzeReport('Income Statement', reportData);
      
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

  // Auto-generate basic insights
  const getIncomeStatementInsights = () => {
    const insights = [];
    const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    if (netIncome > 0) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        message: `Profitable period with net income of ${formatCurrency(netIncome)} (${profitMargin.toFixed(1)}% profit margin)`
      });
    } else if (netIncome < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        message: `Net loss of ${formatCurrency(Math.abs(netIncome))}. Expenses exceed income by ${formatCurrency(Math.abs(netIncome))}`
      });
    } else {
      insights.push({
        type: 'info',
        icon: DollarSign,
        message: 'Break-even period: Income equals expenses'
      });
    }

    if (totalIncome > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      if (expenseRatio > 80) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          message: `High expense ratio: ${expenseRatio.toFixed(1)}% of income goes to expenses`
        });
      } else if (expenseRatio < 50) {
        insights.push({
          type: 'success',
          icon: Info,
          message: `Efficient operations: Only ${expenseRatio.toFixed(1)}% of income goes to expenses`
        });
      }
    }

    // Check for top expense categories
    if (expenseData.length > 0) {
      const topExpense = expenseData[0];
      const expensePercentage = totalExpenses > 0 ? (topExpense.amount / totalExpenses) * 100 : 0;
      if (expensePercentage > 40) {
        insights.push({
          type: 'info',
          icon: AlertCircle,
          message: `${topExpense.category} is your largest expense at ${expensePercentage.toFixed(1)}% of total expenses`
        });
      }
    }

    return insights;
  };
  
  const generatePDF = () => {
    const tableData = [
      ['Category', 'Amount ($)'],
      ['Income', ''],
      ...incomeData.map(item => [
        item.category,
        formatCurrency(item.amount)
      ]),
      ['Total Income', formatCurrency(totalIncome)],
      ['', ''],
      ['Expenses', ''],
      ...expenseData.map(item => [
        item.category,
        formatCurrency(item.amount)
      ]),
      ['Total Expenses', formatCurrency(totalExpenses)],
    ];
    
    const summary = [
      ['Net Income', formatCurrency(netIncome)]
    ];
    
    generateBasePDF('Income Statement', tableData, summary);
  };

  return (
    <AuthCheck>
      <StatementLayout
      title="Income Statement" 
      description="Summary of revenues, costs, and expenses"
      generatePDF={generatePDF}
    >
      {/* AI Insights Section */}
      <div className="mb-6 space-y-4">
        {/* Quick Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          {getIncomeStatementInsights().map((insight, index) => (
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

        {/* AI Analysis Button */}
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

        {/* AI Insight Display */}
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

      <div className="compact-spacing px-2 sm:px-0">
        <div>
          <h3 className="compact-text-lg font-semibold mb-2">Income</h3>
          <Table className="compact-table w-full max-w-3xl mx-auto">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Category</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeData.map((item, index) => (
                <TableRow key={index} className="h-8">
                  <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{item.category}</TableCell>
                  <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                      {formatCurrency(item.amount)}
                    </TableCell>
                </TableRow>
              ))}
              <TableRow className="h-8">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total Income</TableCell>
                  <TableCell className="text-right font-bold text-green-600 px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {formatCurrency(totalIncome)}
                  </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="compact-text-lg font-semibold mb-2">Expenses</h3>
          <Table className="compact-table w-full max-w-3xl mx-auto">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="px-1 sm:px-2 py-1 text-xs sm:text-sm">Category</TableHead>
                <TableHead className="text-right px-1 sm:px-2 py-1 text-xs sm:text-sm">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.map((item, index) => (
                <TableRow key={index} className="h-8">
                  <TableCell className="px-1 sm:px-2 py-1 text-xs sm:text-sm truncate max-w-0">{item.category}</TableCell>
                  <TableCell className="text-right font-medium px-1 sm:px-2 py-1 text-xs sm:text-sm">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="h-8">
                <TableCell className="font-bold px-1 sm:px-2 py-1 text-xs sm:text-sm">Total Expenses</TableCell>
                <TableCell className="text-right font-bold text-red-600 px-1 sm:px-2 py-1 text-xs sm:text-sm">
                  {formatCurrency(totalExpenses)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-2">
          <Table className="compact-table w-full max-w-3xl mx-auto">
            <TableBody>
              <TableRow className="h-8">
                <TableCell className="font-bold text-xs sm:text-lg px-1 sm:px-2 py-1">Net Income</TableCell>
                <TableCell className={`text-right font-bold text-xs sm:text-lg px-1 sm:px-2 py-1 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netIncome.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      </StatementLayout>

      {/* AI Floating Button with Income Statement context */}
      <AIFloatingButton 
        contextType="report"
        contextData={{
          reportType: 'Income Statement',
          reportData: {
            totalIncome,
            totalExpenses,
            netIncome,
            profitMargin: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0,
            incomeBreakdown: incomeData,
            expenseBreakdown: expenseData
          }
        }}
      />
    </AuthCheck>
  );
}
