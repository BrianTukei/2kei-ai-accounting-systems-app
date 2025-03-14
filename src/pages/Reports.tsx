
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
import ReportsTabContent from '@/components/dashboard/ReportsTabContent';

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
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
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
          
          <ReportsTabContent />
          
          <Card className="glass-card glass-card-hover">
            <CardHeader>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>Access detailed financial statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center" asChild>
                  <Link to="/income-statement">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="font-medium">Income Statement</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center" asChild>
                  <Link to="/balance-sheet">
                    <Scale className="h-6 w-6 mb-2" />
                    <span className="font-medium">Balance Sheet</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center" asChild>
                  <Link to="/cash-flow">
                    <ArrowUpDown className="h-6 w-6 mb-2" />
                    <span className="font-medium">Cash Flow</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center" asChild>
                  <Link to="/trial-balance">
                    <ReceiptIcon className="h-6 w-6 mb-2" />
                    <span className="font-medium">Trial Balance</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
