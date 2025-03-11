
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DownloadCloud, FileSpreadsheet, FilePdf } from 'lucide-react';
import OverviewChart from '@/components/OverviewChart';

const Reports = () => {
  const [reportType, setReportType] = useState('profit-loss');

  // Mock data for demonstration
  const chartData = [
    { name: 'Jan', income: 4000, expenses: 2400 },
    { name: 'Feb', income: 3000, expenses: 1398 },
    { name: 'Mar', income: 5000, expenses: 3800 },
    { name: 'Apr', income: 2780, expenses: 3908 },
    { name: 'May', income: 5890, expenses: 4800 },
    { name: 'Jun', income: 3390, expenses: 2800 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Financial Reports
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Generate and analyze your financial data
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="glass-card glass-card-hover">
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                      <SelectItem value="cash-flow">Cash Flow</SelectItem>
                      <SelectItem value="balance">Balance Sheet</SelectItem>
                      <SelectItem value="transactions">Transaction History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <DateRangePicker />
                </div>

                <div className="space-y-4 md:self-end">
                  <Button className="w-full" onClick={() => console.log('Generating report...')}>
                    <DownloadCloud className="mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <OverviewChart 
            data={chartData}
            title="Financial Overview"
            description="Income vs Expenses over time"
          />

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card glass-card-hover">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <FileSpreadsheet className="mr-2" />
                  Export as Excel
                </Button>
                <Button variant="outline" className="w-full">
                  <FilePdf className="mr-2" />
                  Export as PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card glass-card-hover">
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set up automated report generation and delivery to your email.
                  Coming soon.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
