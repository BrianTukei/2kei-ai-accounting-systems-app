
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import ReportCard from '@/components/reports/ReportCard';
import TransactionSummaryTable from '@/components/reports/TransactionSummaryTable';
import { generateIncomePDF, generateExpensePDF, generateFinancialPDF } from '@/utils/reportGenerators';

export default function ReportsTabContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { transactions } = useTransactions();

  // Handle generating income report
  const handleIncomeReport = () => {
    setIsGenerating(true);
    generateIncomePDF(transactions);
    setIsGenerating(false);
  };

  // Handle generating expense report
  const handleExpenseReport = () => {
    setIsGenerating(true);
    generateExpensePDF(transactions);
    setIsGenerating(false);
  };

  // Handle generating complete financial report
  const handleFullReport = () => {
    setIsGenerating(true);
    generateFinancialPDF(transactions);
    setIsGenerating(false);
  };

  // Group transactions by month for the annual summary
  const getTransactionsByMonth = () => {
    const monthlyData: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      // For simplicity, we're using the date field which may contain "Today", "Yesterday", etc.
      // In a real app, you'd have actual dates and group by month
      const month = transaction.date;
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(transaction);
    });
    
    return monthlyData;
  };

  const monthlyData = getTransactionsByMonth();
  const displayData = Object.entries(monthlyData)
    .slice(0, 5)
    .flatMap(([month, txns]) => {
      return txns.slice(0, 2).map(t => ({
        category: t.category,
        month: month,
        amount: t.type === 'income' ? t.amount : -t.amount
      }));
    });

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <CardDescription>Generate and analyze your financial data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard
              title="Monthly Income Report"
              description="View and export detailed income statements by month"
              buttonText="Generate Income PDF"
              buttonIcon={<FileText className="h-4 w-4 mr-2" />}
              onClick={handleIncomeReport}
              isLoading={isGenerating}
              className="bg-green-500 hover:bg-green-600"
            />
            
            <ReportCard
              title="Expense Analysis"
              description="Detailed breakdown of your expense categories"
              buttonText="Download Expense Report"
              buttonIcon={<Download className="h-4 w-4 mr-2" />}
              onClick={handleExpenseReport}
              isLoading={isGenerating}
              className="bg-red-500 hover:bg-red-600 text-white"
            />
          </div>
          
          <TransactionSummaryTable 
            data={displayData}
            onGenerateFullReport={handleFullReport}
          />
        </div>
      </CardContent>
    </Card>
  );
}
