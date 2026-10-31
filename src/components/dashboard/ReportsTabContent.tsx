import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Transaction } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ReportsTabContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { transactions } = useTransactions();
  const { selectedCurrency, formatCurrency, convertAmount } = useCurrency();

  // Convert each transaction into the currently selected display currency
  const toDisplay = (t: Transaction | any): number => {
    const amount = Number(t.original_amount ?? t.originalAmount ?? t.amount) || 0;
    const from =
      t.original_currency ??
      t.originalCurrency ??
      t.currency ??
      selectedCurrency.code;
    return convertAmount(amount, from, selectedCurrency.code);
  };

  // Format a value that is already in the selected currency
  const fmt = (value: number) => formatCurrency(value, selectedCurrency.code);

  // Generate income-only PDF report
  const generateIncomePDF = () => {
    setIsGenerating(true);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Monthly Income Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    doc.setFontSize(16);
    doc.text('2K AI Accounting Systems', 14, 45);

    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const tableColumn = ['Category', 'Description', 'Date', `Amount (${selectedCurrency.symbol})`];
    const tableRows = incomeTransactions.map(item => [
      item.category,
      item.description,
      item.date,
      fmt(toDisplay(item))
    ]);

    const totalIncome = incomeTransactions.reduce((sum, item) => sum + toDisplay(item), 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 249] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Income Summary`, 14, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(46, 204, 113);
    doc.text(`Total Income: ${fmt(totalIncome)}`, 14, finalY + 25);

    doc.setTextColor(0, 0, 0);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        '2K AI Accounting Systems - Confidential financial information',
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('income_report.pdf');

    setIsGenerating(false);
    toast.success('Income Report Generated');
  };

  // Generate expense-only PDF report
  const generateExpensePDF = () => {
    setIsGenerating(true);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Expense Analysis Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    doc.setFontSize(16);
    doc.text('2K AI Accounting Systems', 14, 45);

    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const tableColumn = ['Category', 'Description', 'Date', `Amount (${selectedCurrency.symbol})`];
    const tableRows = expenseTransactions.map(item => [
      item.category,
      item.description,
      item.date,
      fmt(toDisplay(item))
    ]);

    const totalExpenses = expenseTransactions.reduce((sum, item) => sum + toDisplay(item), 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 249] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Expense Summary`, 14, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(231, 76, 60);
    doc.text(`Total Expenses: ${fmt(totalExpenses)}`, 14, finalY + 25);

    doc.setTextColor(0, 0, 0);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        '2K AI Accounting Systems - Confidential financial information',
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('expense_report.pdf');

    setIsGenerating(false);
    toast.success('Expense Report Generated');
  };

  // Full PDF report
  const generatePDF = () => {
    setIsGenerating(true);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Complete Financial Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    doc.setFontSize(16);
    doc.text('2K AI Accounting Systems', 14, 45);

    const tableColumn = ['Category', 'Description', 'Type', `Amount (${selectedCurrency.symbol})`];
    const tableRows = transactions.map(item => [
      item.category,
      item.description,
      item.type === 'income' ? 'Income' : 'Expense',
      fmt(toDisplay(item))
    ]);

    const totalIncome = transactions
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + toDisplay(item), 0);

    const totalExpenses = transactions
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + toDisplay(item), 0);

    const netProfit = totalIncome - totalExpenses;

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 249] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Summary`, 14, finalY + 15);

    doc.setFontSize(10);
    doc.text(`Total Income: ${fmt(totalIncome)}`, 14, finalY + 25);
    doc.text(`Total Expenses: ${fmt(totalExpenses)}`, 14, finalY + 35);

    const netProfitText = `Net Profit: ${fmt(netProfit)}`;

    if (netProfit >= 0) {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }

    doc.text(netProfitText, 14, finalY + 45);
    doc.setTextColor(0, 0, 0);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        '2K AI Accounting Systems - Confidential financial information',
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('financial_report.pdf');

    setIsGenerating(false);
    toast.success('Complete Financial Report Generated');
  };

  // Recent rows for on-screen summary (converted amounts)
  const getTransactionsByMonth = () => {
    const monthlyData: Record<string, Transaction[]> = {};

    transactions.forEach(transaction => {
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
      return txns.slice(0, 2).map(t => {
        const converted = toDisplay(t);
        return {
          category: t.category,
          month: month,
          amount: t.type === 'income' ? converted : -converted
        };
      });
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
                onClick={generateIncomePDF}
                disabled={isGenerating}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {isGenerating ? (
                  'Generating...'
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Income PDF
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
                onClick={generateExpensePDF}
                disabled={isGenerating}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Expense Report
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
                      {fmt(Math.abs(item.amount))}
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