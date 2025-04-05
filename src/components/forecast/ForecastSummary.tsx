
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastData } from "@/utils/forecastUtils";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ForecastSummaryProps {
  data: ForecastData;
}

export default function ForecastSummary({ data }: ForecastSummaryProps) {
  const [income, setIncome] = useState((data.totalIncome || 0).toString());
  const [expenses, setExpenses] = useState((data.totalExpenses || 0).toString());
  const [balance, setBalance] = useState((data.netGain || 0).toString());
  const [growth, setGrowth] = useState((data.growthRate || 0).toString());
  
  const handleNumberChange = (value: string, setter: (value: string) => void) => {
    // Allow numbers and decimal points only
    setter(value.replace(/[^0-9.-]/g, ''));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass-card glass-card-hover animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="mr-1">$</span>
            <Input
              value={income}
              onChange={(e) => handleNumberChange(e.target.value, setIncome)}
              className="text-2xl font-bold p-0 border-none text-green-600 focus-visible:ring-0"
              placeholder="0.00"
            />
          </div>
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
          <div className="flex items-center">
            <span className="mr-1">$</span>
            <Input
              value={expenses}
              onChange={(e) => handleNumberChange(e.target.value, setExpenses)}
              className="text-2xl font-bold p-0 border-none text-red-600 focus-visible:ring-0"
              placeholder="0.00"
            />
          </div>
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
          <div className="flex items-center">
            <span className="mr-1">$</span>
            <Input
              value={balance}
              onChange={(e) => handleNumberChange(e.target.value, setBalance)}
              className="text-2xl font-bold p-0 border-none text-blue-600 focus-visible:ring-0"
              placeholder="0.00"
            />
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
          <div className="flex items-center">
            <Input
              value={growth}
              onChange={(e) => handleNumberChange(e.target.value, setGrowth)}
              className="text-2xl font-bold p-0 border-none text-blue-600 focus-visible:ring-0"
              placeholder="0"
            />
            <span className="ml-1">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Projected financial growth
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
