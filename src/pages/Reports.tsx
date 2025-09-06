
import { useState } from 'react';
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
import { useFinancialStats } from '@/hooks/useFinancialStats';

export default function Reports() {
  const [reportType, setReportType] = useState('financial');
  const { monthlyData } = useFinancialStats();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 animate-fade-up">
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold tracking-tight text-shadow gradient-text">
              Reports
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
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
        
        <div className="grid grid-cols-1 gap-10">
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Card className="modern-card-hover backdrop-blur-xl shadow-elegant">
              <CardHeader className="bg-gradient-glass border-b border-border/50">
                <CardTitle className="text-2xl font-display">Financial Overview</CardTitle>
                <CardDescription className="text-base">Detailed financial analysis over time</CardDescription>
              </CardHeader>
              <CardContent>
                <OverviewChart 
                  data={monthlyData}
                  title="Financial Performance"
                  description="Income vs Expenses"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Card className="modern-card-hover group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-lg font-display">Cash Book (Ledger)</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  Complete record of all cash inflows and outflows
                </p>
                <Link to="/cash-book">
                  <Button className="w-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-soft hover:shadow-elegant transition-all duration-300 hover:scale-105">
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
