
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { ForecastPoint } from "@/utils/forecastUtils";
import { useCurrency } from '@/contexts/CurrencyContext';

interface ForecastChartProps {
  data: ForecastPoint[];
  title: string;
  description?: string;
  chartType?: 'bar' | 'line';
}

export default function ForecastChart({ 
  data, 
  title, 
  description, 
  chartType = 'bar' 
}: ForecastChartProps) {
  const { getCurrencySymbol } = useCurrency();
  const sym = getCurrencySymbol();
  const config = {
    income: { label: "Income", color: "#16a34a" },
    expenses: { label: "Expenses", color: "#dc2626" },
    balance: { label: "Balance", color: "#3b82f6" },
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect border border-slate-200/50 rounded-lg p-3 shadow-subtle text-sm">
          <p className="font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Income: {sym}{payload[0].value?.toFixed(2)}
            </p>
            <p className="flex items-center text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Expenses: {sym}{payload[1].value?.toFixed(2)}
            </p>
            <p className="flex items-center text-blue-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Balance: {sym}{payload[2].value?.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card glass-card-hover col-span-full h-[400px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[320px]">
        <ChartContainer config={config} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${sym}${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="#000" />
                <Bar dataKey="income" fill="#16a34a" name="Income" />
                <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
                <Bar dataKey="balance" fill="#3b82f6" name="Balance" />
              </BarChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `${sym}${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={0} stroke="#000" />
                <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="Expenses" />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Balance" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
