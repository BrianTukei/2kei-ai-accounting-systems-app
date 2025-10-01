
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart, LineChart as LineChartIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthCheck from '@/components/auth/AuthCheck';
import { useForecast } from '@/hooks/useForecast';
import ForecastChart from '@/components/forecast/ForecastChart';
import ForecastSummary from '@/components/forecast/ForecastSummary';
import ExpenseBreakdownChart from '@/components/forecast/ExpenseBreakdownChart';
import CashFlowChart from '@/components/forecast/CashFlowChart';
import ForecastInsights from '@/components/forecast/ForecastInsights';

export default function Forecast() {
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const { forecastData, isLoading } = useForecast(forecastMonths);
  
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text flex items-center">
              <TrendingUp className="mr-3 h-10 w-10 text-primary" />
              Financial Forecast
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Advanced analytics and predictions for your financial future
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Select 
              value={forecastMonths.toString()} 
              onValueChange={(value) => setForecastMonths(parseInt(value))}
            >
              <SelectTrigger className="w-[180px] glass-card">
                <SelectValue placeholder="Forecast Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <Button 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setChartType('bar')}
                className="glass-card glass-card-hover"
              >
                <BarChart className="h-4 w-4" />
              </Button>
              <Button 
                variant={chartType === 'line' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setChartType('line')}
                className="glass-card glass-card-hover"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <Card className="glass-card glass-card-hover">
            <CardContent className="pt-6 flex justify-center items-center h-64">
              <div className="text-center">
                <div className="spinner mb-4"></div>
                <p>Calculating forecast data...</p>
              </div>
            </CardContent>
          </Card>
        ) : forecastData ? (
          <>
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <ForecastSummary data={forecastData} />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <ForecastChart 
                  data={forecastData.monthly}
                  title="Monthly Financial Forecast"
                  description="Projected income, expenses, and balance for upcoming months"
                  chartType={chartType}
                />
              </div>
              
              <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <ExpenseBreakdownChart data={forecastData.expenseBreakdown} />
              </div>
            </div>
            
            <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <CashFlowChart data={forecastData.monthly} />
            </div>
            
            <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.6s' }}>
              <ForecastInsights data={forecastData} months={forecastMonths} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card className="glass-card glass-card-hover animate-fade-up" style={{ animationDelay: '0.7s' }}>
                <CardHeader>
                  <CardTitle className="gradient-text">Forecast Methodology</CardTitle>
                  <CardDescription>How we calculate your financial projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-foreground">Our advanced forecast engine analyzes:</p>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      <li>Historical transaction patterns from your financial records</li>
                      <li>Income and expense growth trends over the last 3 months</li>
                      <li>Category-based spending analysis for detailed breakdowns</li>
                      <li>Compound growth calculations for long-term projections</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                      <strong>Note:</strong> This forecast is an estimate based on available data. Actual results may vary based on market conditions and personal financial decisions.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card glass-card-hover animate-fade-up" style={{ animationDelay: '0.8s' }}>
                <CardHeader>
                  <CardTitle className="gradient-text">About Your Data</CardTitle>
                  <CardDescription>Understanding your financial patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{forecastData.monthly.length}</div>
                        <div className="text-sm text-muted-foreground">Months Projected</div>
                      </div>
                      <div className="text-center p-4 bg-success/5 rounded-lg">
                        <div className="text-2xl font-bold text-success">{forecastData.expenseBreakdown.length}</div>
                        <div className="text-sm text-muted-foreground">Expense Categories</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2 text-foreground">Key Metrics:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expense Ratio:</span>
                          <span className="font-medium">{((forecastData.totalExpenses / forecastData.totalIncome) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Savings Rate:</span>
                          <span className="font-medium text-success">{(100 - (forecastData.totalExpenses / forecastData.totalIncome) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="glass-card glass-card-hover">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Forecast Data Available</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Start adding transactions to generate financial forecasts. The more transaction history you have, the more accurate your forecasts will be.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
    </AuthCheck>
  );
}
