
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, BarChart3, Download, ArrowUpDown as ArrowsUpDown, Receipt, BarChart, Users, Book } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { DateRangePicker } from '@/components/DateRangePicker';
import OverviewChart from '@/components/OverviewChart';
import ReportsTabContent from '@/components/dashboard/ReportsTabContent';
import { useTransactions } from '@/hooks/useTransactions';

export default function Reports() {
  const [reportType, setReportType] = useState('financial');
  const { transactions } = useTransactions();
  const [chartData, setChartData] = useState<Array<{name: string, income: number, expenses: number}>>([]);

  // Process transactions into chart data in real-time
  useEffect(() => {
    const processTransactionsData = () => {
      // Group transactions by month
      const transactionsByMonth = transactions.reduce((acc, transaction) => {
        const monthName = transaction.date || 'Unknown';
        
        if (!acc[monthName]) {
          acc[monthName] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
          acc[monthName].income += transaction.amount;
        } else {
          acc[monthName].expenses += transaction.amount;
        }
        
        return acc;
      }, {} as Record<string, { income: number, expenses: number }>);
      
      // Convert to the format needed for the chart
      const formattedData = Object.entries(transactionsByMonth).map(([name, data]) => ({
        name,
        income: data.income,
        expenses: data.expenses
      }));
      
      setChartData(formattedData);
    };
    
    processTransactionsData();
  }, [transactions]);

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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Cash Book (Ledger)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Complete record of all cash inflows and outflows
                </p>
                <Link to="/cash-book">
                  <Button className="w-full bg-gradient-primary hover:bg-gradient-primary/90">
                    <Book className="h-4 w-4 mr-2" />
                    View Ledger
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Payroll Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Manage employee compensation and generate payroll statements
                </p>
                <Link to="/payroll">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Payroll
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Financial Statements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Generate detailed financial statements and reports
                </p>
                <Link to="/income-statement">
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Income Statement
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Transaction Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  View and analyze transaction history and patterns
                </p>
                <Link to="/transactions">
                  <Button className="w-full" variant="outline">
                    <ArrowsUpDown className="h-4 w-4 mr-2" />
                    View Transactions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <ReportsTabContent />
        </div>
      </main>
    </div>
  );
}
