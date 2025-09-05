import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ForecastData } from "@/utils/forecastUtils";
import { AlertTriangle, TrendingUp, Target, Lightbulb } from "lucide-react";

interface ForecastInsightsProps {
  data: ForecastData;
  months: number;
}

export default function ForecastInsights({ data, months }: ForecastInsightsProps) {
  const { totalIncome, totalExpenses, netGain, growthRate, monthly } = data;
  
  const insights = [];
  const recommendations = [];
  
  // Generate insights based on forecast data
  if (netGain < 0) {
    insights.push({
      type: 'warning',
      title: 'Projected Deficit',
      description: `Your forecast shows a potential deficit of $${Math.abs(netGain).toFixed(2)} over ${months} months.`
    });
    recommendations.push('Review and reduce non-essential expenses');
    recommendations.push('Consider additional income sources');
  } else {
    insights.push({
      type: 'success',
      title: 'Positive Trajectory',
      description: `Your forecast shows a positive net gain of $${netGain.toFixed(2)} over ${months} months.`
    });
  }
  
  if (growthRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Declining Balance',
      description: `Your balance is projected to decrease by ${Math.abs(growthRate)}% during this period.`
    });
    recommendations.push('Implement cost-cutting measures immediately');
  } else if (growthRate < 3) {
    insights.push({
      type: 'info',
      title: 'Modest Growth',
      description: `Your balance is growing at ${growthRate}% - consider optimizing for better returns.`
    });
    recommendations.push('Explore investment opportunities');
    recommendations.push('Look for ways to increase passive income');
  } else {
    insights.push({
      type: 'success',
      title: 'Strong Growth',
      description: `Excellent! Your balance is projected to grow by ${growthRate}%.`
    });
  }
  
  // Check expense to income ratio
  const expenseRatio = (totalExpenses / totalIncome) * 100;
  if (expenseRatio > 90) {
    insights.push({
      type: 'warning',
      title: 'High Expense Ratio',
      description: `Your expenses are ${expenseRatio.toFixed(1)}% of your income - very tight budget.`
    });
    recommendations.push('Build an emergency fund as soon as possible');
  } else if (expenseRatio > 70) {
    insights.push({
      type: 'info',
      title: 'Moderate Savings Rate',
      description: `You're saving ${(100 - expenseRatio).toFixed(1)}% of your income.`
    });
    recommendations.push('Consider increasing your savings rate to 30%+');
  } else {
    insights.push({
      type: 'success',
      title: 'Healthy Savings Rate',
      description: `Great job! You're saving ${(100 - expenseRatio).toFixed(1)}% of your income.`
    });
  }
  
  // Analyze volatility
  const monthlyVariance = monthly.reduce((sum, month, index) => {
    if (index === 0) return 0;
    const previousBalance = monthly[index - 1].balance;
    return sum + Math.abs(month.balance - previousBalance);
  }, 0) / (monthly.length - 1);
  
  if (monthlyVariance > totalIncome * 0.1) {
    insights.push({
      type: 'info',
      title: 'Variable Cash Flow',
      description: 'Your projected cash flow shows significant month-to-month variation.'
    });
    recommendations.push('Consider smoothing irregular income/expenses');
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'success': return <TrendingUp className="h-5 w-5 text-success" />;
      default: return <Target className="h-5 w-5 text-primary" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Key Insights
          </CardTitle>
          <CardDescription>Analysis of your financial forecast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    <Badge variant={getInsightBadgeVariant(insight.type) as any} className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>Actionable steps to improve your financial health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-sm text-foreground">{recommendation}</p>
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-success mb-3" />
                <p className="text-muted-foreground">
                  Your financial forecast looks healthy! Keep up the good work.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}