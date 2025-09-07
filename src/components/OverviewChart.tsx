
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

interface OverviewChartProps {
  data: ChartData[];
  title: string;
  description?: string;
}

export default function OverviewChart({ data, title, description }: OverviewChartProps) {
  const isMobile = useIsMobile();
  const { formatCurrency } = useCurrency();
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect border border-slate-200/50 rounded-lg p-3 shadow-subtle text-sm">
          <p className="font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Income: {formatCurrency(payload[0].value || 0)}
            </p>
            <p className="flex items-center text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Expenses: {formatCurrency(payload[1].value || 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card glass-card-hover col-span-full h-[350px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(value) => formatCurrency(value).replace(/\.\d{2}$/, '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
