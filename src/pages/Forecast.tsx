
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart, LineChart as LineChartIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useForecast } from '@/hooks/useForecast';
import ForecastChart from '@/components/forecast/ForecastChart';
import ForecastSummary from '@/components/forecast/ForecastSummary';

export default function Forecast() {
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const { forecastData, isLoading } = useForecast(forecastMonths);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in flex items-center">
              <TrendingUp className="mr-2 h-8 w-8" />
              Financial Forecast
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Predict your future financial patterns
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 animate-fade-in">
            <Select 
              value={forecastMonths.toString()} 
              onValueChange={(value) => setForecastMonths(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Forecast Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-1">
              <Button 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setChartType('bar')}
              >
                <BarChart className="h-4 w-4" />
              </Button>
              <Button 
                variant={chartType === 'line' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setChartType('line')}
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
            <ForecastSummary data={forecastData} />
            
            <ForecastChart 
              data={forecastData.monthly}
              title="Monthly Financial Forecast"
              description="Projected income, expenses, and balance for upcoming months"
              chartType={chartType}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="glass-card glass-card-hover">
                <CardHeader>
                  <CardTitle>Forecast Methodology</CardTitle>
                  <CardDescription>How we calculate your financial projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>Our forecast is built using:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Historical transaction patterns from your past records</li>
                      <li>Recurring transactions you've scheduled</li>
                      <li>Growth trend analysis based on your last 3 months of activity</li>
                      <li>Seasonal adjustments when applicable</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4">
                      Note: This forecast is an estimate based on available data. Actual results may vary.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card glass-card-hover">
                <CardHeader>
                  <CardTitle>Financial Insights</CardTitle>
                  <CardDescription>Analysis based on your forecast</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecastData.netGain >= 0 ? (
                      <p>Your financial forecast shows a positive trend with a projected net gain of ${forecastData.netGain.toFixed(2)} over the next {forecastMonths} months.</p>
                    ) : (
                      <p>Your forecast indicates a potential deficit of ${Math.abs(forecastData.netGain).toFixed(2)} over the next {forecastMonths} months. Consider reviewing your expenses.</p>
                    )}
                    
                    {forecastData.growthRate > 0 ? (
                      <p>Your balance is projected to grow by {forecastData.growthRate}% during this period.</p>
                    ) : (
                      <p>Your balance is projected to decrease by {Math.abs(forecastData.growthRate)}% during this period.</p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {forecastData.netGain < 0 && (
                          <li>Consider reducing non-essential expenses to improve your financial outlook.</li>
                        )}
                        {forecastData.totalIncome < forecastData.totalExpenses * 1.1 && (
                          <li>Your income is only slightly higher than expenses. Consider building an emergency fund.</li>
                        )}
                        {forecastData.growthRate < 3 && forecastData.growthRate >= 0 && (
                          <li>Your growth rate is modest. Consider opportunities to increase income or reduce regular expenses.</li>
                        )}
                        {forecastData.growthRate < 0 && (
                          <li>Your financial trajectory is negative. Review your budget as soon as possible.</li>
                        )}
                      </ul>
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
  );
}
