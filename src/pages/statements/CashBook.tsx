
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
import { formatCurrency } from '@/components/statements/StatementLayout';
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
    doc.text('2K AI Accounting Systems', 14, 45);
    
    const tableData = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type === 'income' ? formatCurrency(t.amount) : '',
      t.type === 'expense' ? formatCurrency(t.amount) : ''
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
      <div className="h-screen bg-gradient-subtle overflow-y-scroll">
        <Navbar />

      <main className="container mx-auto px-3 py-4 max-w-3xl pb-8 h-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-1 mb-3 animate-fade-in">
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-primary">
            <Link to="/dashboard">
              <LayoutDashboard className="h-3 w-3 mr-1" />
              Dashboard
            </Link>
          </Button>
          <span className="text-slate-400">/</span>
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-primary">
            <Link to="/reports">
              <BarChart className="h-3 w-3 mr-1" />
              Reports
            </Link>
          </Button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium text-sm">Cash Book</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="compact-spacing">
            <h1 className="compact-text-2xl font-display font-bold tracking-tight text-shadow gradient-text flex items-center">
              <Book className="h-4 sm:h-5 w-4 sm:w-5 mr-2 text-primary drop-shadow-lg" />
              Cash Book
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              A comprehensive record of all cash inflows and outflows
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <DateRangePicker />
            
            <Button variant="outline" size="sm" className="h-9 px-3">
              <Filter className="h-3 w-3 mr-2 sm:mr-1" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Button onClick={generatePDF} className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 h-9 px-3">
              <Download className="h-3 w-3 mr-2 sm:mr-1" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            
            <Button asChild className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 h-9 px-3">
              <Link to="/transactions">
                <Plus className="h-3 w-3 mr-2 sm:mr-1" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="modern-card-hover shadow-elegant backdrop-blur-xl compact-card">
          <CardHeader className="bg-gradient-glass rounded-t-2xl border-b border-border/50 pb-2">
            <CardTitle className="flex items-center compact-text-lg font-display">
              <Book className="h-4 w-4 mr-2 text-primary" />
              Cash Book Ledger
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Complete record of all cash inflows and outflows</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm px-1 sm:px-4">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm px-1 sm:px-4">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm px-1 sm:px-4 hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Money In</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Money Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                        No transactions to display
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs sm:text-sm px-1 sm:px-4">{transaction.date}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-1 sm:px-4">
                          <div className="max-w-0 truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden" title={transaction.category}>
                            {transaction.category}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-1 sm:px-4 hidden sm:table-cell">{transaction.category}</TableCell>
                        <TableCell className="text-right text-green-600 text-xs sm:text-sm px-1 sm:px-4">
                          {transaction.type === 'income' ? formatCurrency(transaction.amount) : ''}
                        </TableCell>
                        <TableCell className="text-right text-red-600 text-xs sm:text-sm px-1 sm:px-4">
                          {transaction.type === 'expense' ? formatCurrency(transaction.amount) : ''}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="modern-card-hover success-gradient text-white relative overflow-hidden group compact-card">
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Total Income</p>
                      <p className="compact-text-2xl font-bold text-white">${totalIncome.toFixed(2)}</p>
                    </div>
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BarChart className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="modern-card-hover bg-gradient-to-br from-destructive to-red-500 text-white relative overflow-hidden group compact-card">
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Total Expenses</p>
                      <p className="compact-text-2xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
                    </div>
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BarChart className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`modern-card-hover text-white relative overflow-hidden group compact-card ${netCashFlow >= 0 ? 'bg-gradient-primary' : 'bg-gradient-to-br from-destructive to-red-500'}`}>
                  <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Net Cash Flow</p>
                      <p className="compact-text-2xl font-bold text-white">
                        ${netCashFlow.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BarChart className="h-4 w-4 text-white" />
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
