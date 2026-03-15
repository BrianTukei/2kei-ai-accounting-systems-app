import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Shield,
  Target,
  Lightbulb,
  Calculator,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { aiAccountantService, FinancialReport, AccountingMistake } from '@/services/ai/aiAccountantService';
import { currencyService } from '@/services/currencyService';

interface AIAccountantProps {
  className?: string;
}

export default function AIAccountant({ className }: AIAccountantProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [mistakes, setMistakes] = useState<AccountingMistake[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Mock financial data - in real app, this would come from your database
  const mockFinancialData = {
    revenue: 15000,
    expenses: 8200,
    bills: 2300,
    invoices: 4500,
    transactions: [
      {
        id: '1',
        type: 'revenue' as const,
        amount: 5000,
        currency: 'USD',
        category: 'Sales',
        description: 'Monthly client payment',
        date: '2024-03-01',
        merchant: 'ABC Company'
      },
      {
        id: '2',
        type: 'expense' as const,
        amount: 1200,
        currency: 'USD',
        category: 'Office Supplies',
        description: 'Office supplies and stationery',
        date: '2024-03-05',
        merchant: 'Office Depot'
      },
      {
        id: '3',
        type: 'expense' as const,
        amount: 800,
        currency: 'USD',
        category: 'Utilities',
        description: 'Monthly utilities bill',
        date: '2024-03-10',
        merchant: 'Power Company'
      },
      {
        id: '4',
        type: 'revenue' as const,
        amount: 3000,
        currency: 'USD',
        category: 'Services',
        description: 'Consulting services payment',
        date: '2024-03-15',
        merchant: 'XYZ Corp'
      },
      {
        id: '5',
        type: 'expense' as const,
        amount: 1500,
        currency: 'USD',
        category: 'Travel',
        description: 'Business travel expenses',
        date: '2024-03-20',
        merchant: 'Travel Agency'
      }
    ],
    period: 'March 2024'
  };

  useEffect(() => {
    runFullAnalysis();
  }, []);

  const runFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Run all analyses in parallel
      const [report, detectedMistakes, financialAdvice] = await Promise.all([
        aiAccountantService.analyzeFinancialData(mockFinancialData),
        aiAccountantService.detectAccountingMistakes(mockFinancialData.transactions),
        aiAccountantService.generateFinancialAdvice(
          mockFinancialData,
          ['Increase profit margins', 'Reduce expenses', 'Improve cash flow'],
          'SME business in Uganda with growing client base'
        )
      ]);

      setFinancialReport(report);
      setMistakes(detectedMistakes);
      setAdvice(financialAdvice);
      setLastAnalysis(new Date());
      
      toast.success('✅ Financial analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('❌ Financial analysis failed. Please check your Local AI setup.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'trend': return <Eye className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-red-200 bg-red-50';
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'trend': return 'border-blue-200 bg-blue-50';
      case 'recommendation': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            AI Accountant
          </h1>
          <p className="text-gray-600">
            Intelligent financial analysis and accounting insights powered by AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastAnalysis && (
            <Badge variant="outline">
              Last analyzed: {lastAnalysis.toLocaleTimeString()}
            </Badge>
          )}
          <Button onClick={runFullAnalysis} disabled={isAnalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Analysis Progress</span>
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
              <Progress value={66} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Analyzing financial data, detecting mistakes, and generating insights...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="mistakes">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="advice">
            <Target className="h-4 w-4 mr-2" />
            Advice
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currencyService.formatAmount(mockFinancialData.revenue, 'USD')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {currencyService.formatAmount(mockFinancialData.expenses, 'USD')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currencyService.formatAmount(
                        mockFinancialData.revenue - mockFinancialData.expenses, 
                        'USD'
                      )}
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Issues Found</p>
                    <p className="text-2xl font-bold text-orange-600">{mistakes.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {financialReport && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profit Margin</span>
                        <span className="font-medium">
                          {financialReport.summary.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue Growth</span>
                        <span className="font-medium">
                          {financialReport.summary.revenueGrowth.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expense Growth</span>
                        <span className="font-medium">
                          {financialReport.summary.expenseGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Top Categories</h4>
                    <div className="space-y-2">
                      {financialReport.trends.slice(0, 3).map((trend, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm text-gray-600">{trend.category}</span>
                          <span className="font-medium">
                            {currencyService.formatAmount(trend.amount, 'USD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      {financialReport.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <div className="space-y-4">
            {financialReport?.insights.map((insight, index) => (
              <Card key={index} className={getInsightColor(insight.type)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      {insight.amount && (
                        <p className="font-medium">
                          Amount: {currencyService.formatAmount(insight.amount, 'USD')}
                        </p>
                      )}
                      {insight.percentage && (
                        <p className="font-medium">
                          Change: {insight.percentage.toFixed(1)}%
                        </p>
                      )}
                      {insight.action && (
                        <p className="text-sm text-blue-600 mt-2">
                          💡 {insight.action}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mistakes Tab */}
        <TabsContent value="mistakes" className="mt-6">
          <div className="space-y-4">
            {mistakes.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Detected</h3>
                  <p className="text-gray-600">
                    Your financial records look clean! No accounting mistakes or risks were found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              mistakes.map((mistake, index) => (
                <Alert key={index} className={getSeverityColor(mistake.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">{mistake.description}</h4>
                        <p className="text-sm mb-2">{mistake.suggestion}</p>
                        {mistake.amount && (
                          <p className="font-medium">
                            Amount: {currencyService.formatAmount(mistake.amount, 'USD')}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={getSeverityColor(mistake.severity)}>
                        {mistake.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </TabsContent>

        {/* Advice Tab */}
        <TabsContent value="advice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Financial Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {advice || 'Generating personalized advice...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Income Statement
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Cash Flow Report
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <DollarSign className="h-6 w-6 mb-2" />
                    Expense Analysis
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Calculator className="h-6 w-6 mb-2" />
                    Tax Summary
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Shield className="h-6 w-6 mb-2" />
                    Risk Assessment
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Eye className="h-6 w-6 mb-2" />
                    Trends Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {financialReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Monthly Financial Summary
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded">
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-xl font-bold text-green-600">
                          {currencyService.formatAmount(financialReport.summary.totalRevenue, 'USD')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded">
                        <p className="text-sm text-gray-600">Expenses</p>
                        <p className="text-xl font-bold text-red-600">
                          {currencyService.formatAmount(financialReport.summary.totalExpenses, 'USD')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Net Profit</p>
                        <p className="text-xl font-bold text-blue-600">
                          {currencyService.formatAmount(financialReport.summary.netProfit, 'USD')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded">
                        <p className="text-sm text-gray-600">Margin</p>
                        <p className="text-xl font-bold text-purple-600">
                          {financialReport.summary.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Key Insights</h4>
                      <div className="space-y-2">
                        {financialReport.insights.slice(0, 3).map((insight, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                            {getInsightIcon(insight.type)}
                            <div>
                              <p className="font-medium text-sm">{insight.title}</p>
                              <p className="text-xs text-gray-600">{insight.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
