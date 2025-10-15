
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthCheck from '@/components/auth/AuthCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Download, Book, ArrowLeft, LayoutDashboard, BarChart, Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    doc.text('2KÉI Ledgerly', 14, 45);
    
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
    <AuthCheck>
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 mb-6 animate-fade-in">
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-primary">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <span className="text-slate-400">/</span>
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-primary">
            <Link to="/reports">
              <BarChart className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </Button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium">Cash Book</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-display font-bold tracking-tight text-shadow gradient-text flex items-center">
              <Book className="h-10 w-10 mr-4 text-primary drop-shadow-lg" />
              Cash Book
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              A comprehensive record of all cash inflows and outflows
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2 animate-fade-in">
            <DateRangePicker />
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            
            <Button onClick={generatePDF} className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            <Button asChild className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
              <Link to="/transactions">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="modern-card-hover shadow-elegant backdrop-blur-xl">
          <CardHeader className="bg-gradient-glass rounded-t-3xl border-b border-border/50">
            <CardTitle className="flex items-center text-2xl font-display">
              <Book className="h-6 w-6 mr-3 text-primary" />
              Cash Book Ledger
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">Complete record of all cash inflows and outflows</CardDescription>
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
            
            <div className="border-t mt-6 pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                Financial Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="modern-card-hover success-gradient text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">Total Income</p>
                      <p className="text-4xl font-bold text-white">${totalIncome.toFixed(2)}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <BarChart className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>
                <div className="modern-card-hover bg-gradient-to-br from-destructive to-red-500 text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">Total Expenses</p>
                      <p className="text-4xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <BarChart className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`modern-card-hover text-white relative overflow-hidden group ${netCashFlow >= 0 ? 'bg-gradient-primary' : 'bg-gradient-to-br from-destructive to-red-500'}`}>
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">Net Cash Flow</p>
                      <p className="text-4xl font-bold text-white">
                        ${netCashFlow.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <BarChart className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </AuthCheck>
  );
}
