import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, BarChart3, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { DateRangePicker } from '@/components/DateRangePicker';
import OverviewChart from '@/components/OverviewChart';

// Mock data
const chartData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 5000, expenses: 3800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 5890, expenses: 4800 },
  { name: 'Jun', income: 3390, expenses: 2800 },
  { name: 'Jul', income: 4490, expenses: 3300 },
];

export default function Reports() {
  const [reportType, setReportType] = useState('financial');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Reports
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Generate and analyze your financial data.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2 animate-fade-in">
            <DateRangePicker />
            
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Report" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial Report</SelectItem>
                <SelectItem value="transaction">Transaction Report</SelectItem>
                <SelectItem value="custom">Custom Report</SelectItem>
              </SelectContent>
            </Select>

            <Button className="rounded-full">
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
          </div>
        </div>
        
        <Card className="glass-card glass-card-hover">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Detailed financial analysis over time</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart 
              data={chartData}
              title="Financial Performance"
              description="Income vs Expenses"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
