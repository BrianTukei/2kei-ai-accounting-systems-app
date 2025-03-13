
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';

export default function ReportsTabContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { transactions } = useTransactions();

  const generatePDF = () => {
    setIsGenerating(true);
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add a title
    doc.setFontSize(20);
    doc.text('Financial Report', 14, 22);
    
    // Add a subtitle with current date
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add a company logo or name
    doc.setFontSize(16);
    doc.text('ACME Finance', 14, 45);
    
    // Add report data as a table
    const tableColumn = ["Category", "Description", "Type", "Amount ($)"];
    const tableRows = transactions.map(item => [
      item.category,
      item.description,
      item.type === 'income' ? 'Income' : 'Expense',
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      })
    ]);
    
    // Calculate total income and expenses
    const totalIncome = transactions
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
      
    const totalExpenses = transactions
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
      
    const netProfit = totalIncome - totalExpenses;
    
    // Add the table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 249] }
    });
    
    // Add summary section
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Summary`, 14, finalY + 15);
    
    // Add summary data
    doc.setFontSize(10);
    doc.text(`Total Income: ${totalIncome.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD' 
    })}`, 14, finalY + 25);
    
    doc.text(`Total Expenses: ${totalExpenses.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })}`, 14, finalY + 35);
    
    // Add net profit with color based on value
    const netProfitText = `Net Profit: ${netProfit.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })}`;
    
    if (netProfit >= 0) {
      doc.setTextColor(34, 197, 94); // Green text for profit
    } else {
      doc.setTextColor(239, 68, 68); // Red text for loss
    }
    
    doc.text(netProfitText, 14, finalY + 45);
    doc.setTextColor(0, 0, 0); // Reset text color
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        'This report is generated automatically and contains confidential financial information.',
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    doc.save('financial_report.pdf');
    
    setIsGenerating(false);
    toast({
      title: "Report Generated",
      description: "Your financial report has been downloaded",
    });
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
            <div className="p-6 border rounded-lg bg-white">
              <h3 className="text-lg font-medium mb-2">Monthly Income Report</h3>
              <p className="text-sm text-slate-500 mb-4">
                View and export detailed income statements by month
              </p>
              <Button 
                onClick={generatePDF} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
            
            <div className="p-6 border rounded-lg bg-white">
              <h3 className="text-lg font-medium mb-2">Expense Analysis</h3>
              <p className="text-sm text-slate-500 mb-4">
                Detailed breakdown of your expense categories
              </p>
              <Button 
                onClick={generatePDF} 
                disabled={isGenerating} 
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
          
          <div className="p-6 border rounded-lg bg-white">
            <h3 className="text-lg font-medium mb-2">Transaction Summary</h3>
            <p className="text-sm text-slate-500 mb-4">
              Overview of your recent financial activity
            </p>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">{item.month}</td>
                    <td className={`p-2 text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={generatePDF}>
                View Full Report
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
