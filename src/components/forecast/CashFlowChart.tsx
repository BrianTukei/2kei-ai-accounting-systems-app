import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForecastPoint } from "@/utils/forecastUtils";
import { useCurrency } from '@/contexts/CurrencyContext';

interface CashFlowChartProps {
  data: ForecastPoint[];
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const { getCurrencySymbol } = useCurrency();
  const sym = getCurrencySymbol();
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 border border-border/50 rounded-lg shadow-elegant">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center text-success">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--success))' }}></span>
              Cumulative Balance: {sym}{payload[0]?.value?.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate cumulative balance
  const cumulativeData = data.map((point, index) => {
    const prevCumulative = index > 0 ? data[index - 1].balance : 0;
    return {
      ...point,
      cumulativeBalance: prevCumulative + point.balance
    };
  });

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle className="gradient-text">Cash Flow Projection</CardTitle>
        <CardDescription>Cumulative balance over time showing financial trajectory</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={cumulativeData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => `${sym}${value}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="2 2" />
            <Area
              type="monotone"
              dataKey="cumulativeBalance"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              fill="url(#cumulativeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}