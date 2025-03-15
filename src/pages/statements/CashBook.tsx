
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Download, Book } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export default function CashBook() {
  const { transactions } = useTransactions();
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  
  // Re-filter transactions whenever the original transactions change
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netCashFlow = totalIncome - totalExpenses;

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Cash Book', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    doc.setFontSize(16);
    doc.text('2KÉI Ledgery', 14, 45);
    
    const tableData = filteredTransactions.map(t => [
      t.date, 
      t.description, 
      t.category, 
      t.type === 'income' ? `$${t.amount.toFixed(2)}` : '', 
      t.type === 'expense' ? `$${t.amount.toFixed(2)}` : ''
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Money In', 'Money Out']],
      body: tableData,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 249] }
    });
    
    const summary = [
      ['Total Income', `$${totalIncome.toFixed(2)}`],
      ['Total Expenses', `$${totalExpenses.toFixed(2)}`],
      ['Net Cash Flow', `$${netCashFlow.toFixed(2)}`]
    ];
    
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Summary`, 14, finalY + 15);
    
    autoTable(doc, {
      body: summary,
      startY: finalY + 20,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 }
    });
    
    doc.save('cash_book.pdf');
    toast.success('Cash Book has been downloaded');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Cash Book
            </h1>
            <p className="text-slate-500 animate-fade-in">
              A record of all cash transactions
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2 animate-fade-in">
            <DateRangePicker />
            
            <Button onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
        
        <Card className="glass-card glass-card-hover">
          <CardHeader>
            <CardTitle>Cash Book</CardTitle>
            <CardDescription>All cash inflows and outflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Money In</TableHead>
                    <TableHead className="text-right">Money Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No transactions to display
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {transaction.type === 'income' ? `$${transaction.amount.toFixed(2)}` : ''}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {transaction.type === 'expense' ? `$${transaction.amount.toFixed(2)}` : ''}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="border-t mt-6 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-slate-600">Total Income</p>
                  <p className="text-2xl font-semibold text-green-600">${totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-slate-600">Total Expenses</p>
                  <p className="text-2xl font-semibold text-red-600">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-600">Net Cash Flow</p>
                  <p className={`text-2xl font-semibold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${netCashFlow.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
