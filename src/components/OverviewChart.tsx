
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from './ui/input';

interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

interface OverviewChartProps {
  data?: ChartData[];
  title: string;
  description?: string;
}

export default function OverviewChart({ data: initialData, title, description }: OverviewChartProps) {
  const isMobile = useIsMobile();
  const [chartData, setChartData] = useState<ChartData[]>(initialData || [
    { name: 'Jan', income: 0, expenses: 0 },
    { name: 'Feb', income: 0, expenses: 0 },
    { name: 'Mar', income: 0, expenses: 0 }
  ]);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<ChartData>({ name: '', income: 0, expenses: 0 });
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect border border-slate-200/50 rounded-lg p-3 shadow-subtle text-sm">
          <p className="font-medium mb-1">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Income: ${payload[0].value?.toFixed(2)}
            </p>
            <p className="flex items-center text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Expenses: ${payload[1].value?.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues(chartData[index]);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const newData = [...chartData];
      newData[editingIndex] = editValues;
      setChartData(newData);
      setEditingIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  const handleChange = (field: keyof ChartData, value: string) => {
    if (field === 'name') {
      setEditValues({ ...editValues, name: value });
    } else {
      const numValue = parseFloat(value) || 0;
      setEditValues({ ...editValues, [field]: numValue });
    }
  };

  const handleAddMonth = () => {
    setChartData([...chartData, { name: `Month ${chartData.length + 1}`, income: 0, expenses: 0 }]);
  };

  const handleDeleteMonth = (index: number) => {
    const newData = chartData.filter((_, i) => i !== index);
    setChartData(newData);
  };

  return (
    <Card className="glass-card glass-card-hover col-span-full h-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                tickFormatter={(value) => `$${value}`}
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
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Chart Data</div>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-sm font-medium text-slate-500 px-2">
              <div>Month/Period</div>
              <div>Income ($)</div>
              <div>Expenses ($)</div>
              <div className="text-right">Actions</div>
            </div>
            
            {chartData.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-center">
                {editingIndex === index ? (
                  <>
                    <Input 
                      value={editValues.name} 
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="h-8"
                    />
                    <Input 
                      type="number"
                      value={editValues.income.toString()}
                      onChange={(e) => handleChange('income', e.target.value)}
                      className="h-8"
                    />
                    <Input 
                      type="number"
                      value={editValues.expenses.toString()}
                      onChange={(e) => handleChange('expenses', e.target.value)}
                      className="h-8"
                    />
                    <div className="flex justify-end space-x-1">
                      <Button size="sm" variant="outline" onClick={handleSave}>Save</Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>{item.name}</div>
                    <div className="text-green-600">${item.income.toFixed(2)}</div>
                    <div className="text-red-600">${item.expenses.toFixed(2)}</div>
                    <div className="flex justify-end space-x-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(index)}>Edit</Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDeleteMonth(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleAddMonth} className="w-full">
          <Plus className="h-4 w-4 mr-1" /> Add Month
        </Button>
      </CardFooter>
    </Card>
  );
}
