
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastData } from "@/utils/forecastUtils";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from "lucide-react";

interface ForecastSummaryProps {
  data: ForecastData;
}

export default function ForecastSummary({ data }: ForecastSummaryProps) {
  const { totalIncome, totalExpenses, netGain, growthRate } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Forecasted total over the next {data.monthly.length} months
          </p>
        </CardContent>
      </Card>
      
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Forecasted total over the next {data.monthly.length} months
          </p>
        </CardContent>
      </Card>
      
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${netGain.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected net gain/loss
          </p>
        </CardContent>
      </Card>
      
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            Projected financial growth
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
