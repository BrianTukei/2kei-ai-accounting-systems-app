import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseBreakdownProps {
  data: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--muted))',
  'hsl(var(--border))'
];

export default function ExpenseBreakdownChart({ data }: ExpenseBreakdownProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };
      
      return (
        <div className="glass-card p-4 border border-border/50 rounded-lg shadow-elegant">
          <p className="font-medium text-foreground">{data.payload.category}</p>
          <p className="text-primary font-semibold">{formatCurrency(data.value)}</p>
          <p className="text-muted-foreground text-sm">{data.payload.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card className="glass-card glass-card-hover">
        <CardHeader>
          <CardTitle className="gradient-text">Expense Categories</CardTitle>
          <CardDescription>Breakdown of projected expenses by category</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No expense data available.<br />
            Add some expense transactions to see the breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle className="gradient-text">Expense Categories</CardTitle>
        <CardDescription>Breakdown of projected expenses by category</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={140}
              paddingAngle={3}
              dataKey="amount"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={60}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontSize: '14px' }}>
                  {value} ({entry.payload.percentage.toFixed(1)}%)
                </span>
              )}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}