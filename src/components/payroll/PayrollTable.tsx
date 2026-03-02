
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, FileText, Download } from 'lucide-react';
import { PayrollData, PayrollSummary } from '@/types/PayrollData';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getStoredCurrencySymbol } from '@/components/statements/StatementLayout';

interface PayrollTableProps {
  payrollData: PayrollData[];
  onDeleteEntry: (id: string) => void;
}

export default function PayrollTable({ payrollData, onDeleteEntry }: PayrollTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter payroll data based on search term
  const filteredPayroll = payrollData.filter(entry => 
    `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.payPeriodStart.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.payPeriodEnd.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate summary statistics
  const summary: PayrollSummary = filteredPayroll.reduce((acc: PayrollSummary, curr) => {
    return {
      totalGrossPay: acc.totalGrossPay + curr.grossPay,
      totalDeductions: acc.totalDeductions + 
        (curr.deductions.incomeTax + 
         curr.deductions.socialSecurity + 
         (curr.deductions.healthInsurance || 0) + 
         (curr.deductions.employeePension || 0) + 
         (curr.deductions.loanRepayments || 0) + 
         (curr.deductions.unionDues || 0) + 
         (curr.deductions.charitableContributions || 0)),
      totalNetPay: acc.totalNetPay + curr.netPay,
      employeeCount: acc.employeeCount + 1
    };
  }, {
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    employeeCount: 0
  });

  // Format currency based on the entry's currency
  const formatCurrency = (amount: number, currency: string) => {
    // Simplified formatting for demo purposes
    const currencySymbol = {
      'UGX': 'Ush',
      'KES': 'KSh',
      'NGN': '₦',
      'USD': '$',
      'GBP': '£',
      'EUR': '€'
    }[currency] || currency;
    
    return `${currencySymbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Generate payslip PDF
  const generatePayslip = (entry: PayrollData) => {
    const doc = new jsPDF();
    const employee = entry.employee;
    const earnings = entry.earnings;
    const deductions = entry.deductions;
    
    // Add company header
    doc.setFontSize(20);
    doc.text('FINANCE APP PAYSLIP', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Pay Period: ${entry.payPeriodStart} to ${entry.payPeriodEnd}`, 105, 25, { align: 'center' });
    doc.text(`Payment Date: ${entry.paymentDate}`, 105, 32, { align: 'center' });
    
    // Employee information
    doc.setFontSize(14);
    doc.text('Employee Information', 15, 45);
    
    doc.setFontSize(10);
    doc.text(`Name: ${employee.firstName} ${employee.lastName}`, 15, 55);
    doc.text(`ID: ${employee.employeeId}`, 15, 62);
    doc.text(`Department: ${employee.department}`, 15, 69);
    doc.text(`Position: ${employee.jobTitle}`, 15, 76);
    
    // Earnings
    doc.setFontSize(14);
    doc.text('Earnings', 15, 90);
    
    const earningsData: any[] = [];
    
    // Add basic earnings
    earningsData.push(['Basic Salary', formatCurrency(earnings.basicSalary, entry.currency)]);
    
    // Add allowances
    if (earnings.allowances) {
      if (earnings.allowances.housing) {
        earningsData.push(['Housing Allowance', formatCurrency(earnings.allowances.housing, entry.currency)]);
      }
      if (earnings.allowances.transport) {
        earningsData.push(['Transport Allowance', formatCurrency(earnings.allowances.transport, entry.currency)]);
      }
      if (earnings.allowances.meal) {
        earningsData.push(['Meal Allowance', formatCurrency(earnings.allowances.meal, entry.currency)]);
      }
    }
    
    // Add bonuses
    if (earnings.bonuses) {
      if (earnings.bonuses.annual) {
        earningsData.push(['Annual Bonus', formatCurrency(earnings.bonuses.annual, entry.currency)]);
      }
      if (earnings.bonuses.performance) {
        earningsData.push(['Performance Bonus', formatCurrency(earnings.bonuses.performance, entry.currency)]);
      }
    }
    
    // Add commissions
    if (earnings.commissions) {
      earningsData.push(['Commissions', formatCurrency(earnings.commissions, entry.currency)]);
    }
    
    // Add overtime
    if (earnings.overtime && earnings.overtime.amount) {
      earningsData.push([`Overtime (${earnings.overtime.hours} hours)`, formatCurrency(earnings.overtime.amount, entry.currency)]);
    }
    
    // Add total gross
    earningsData.push(['Gross Pay', formatCurrency(entry.grossPay, entry.currency)]);
    
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Amount']],
      body: earningsData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Deductions
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Deductions', 15, lastY);
    
    const deductionsData: any[] = [];
    
    // Add statutory deductions
    deductionsData.push(['Income Tax', formatCurrency(deductions.incomeTax, entry.currency)]);
    deductionsData.push(['Social Security', formatCurrency(deductions.socialSecurity, entry.currency)]);
    
    if (deductions.healthInsurance) {
      deductionsData.push(['Health Insurance', formatCurrency(deductions.healthInsurance, entry.currency)]);
    }
    
    // Add voluntary deductions
    if (deductions.employeePension) {
      deductionsData.push(['Employee Pension', formatCurrency(deductions.employeePension, entry.currency)]);
    }
    
    if (deductions.loanRepayments) {
      deductionsData.push(['Loan Repayments', formatCurrency(deductions.loanRepayments, entry.currency)]);
    }
    
    if (deductions.unionDues) {
      deductionsData.push(['Union Dues', formatCurrency(deductions.unionDues, entry.currency)]);
    }
    
    if (deductions.charitableContributions) {
      deductionsData.push(['Charitable Contributions', formatCurrency(deductions.charitableContributions, entry.currency)]);
    }
    
    // Calculate total deductions
    const totalDeductions = deductions.incomeTax + 
      deductions.socialSecurity + 
      (deductions.healthInsurance || 0) + 
      (deductions.employeePension || 0) + 
      (deductions.loanRepayments || 0) + 
      (deductions.unionDues || 0) + 
      (deductions.charitableContributions || 0);
      
    deductionsData.push(['Total Deductions', formatCurrency(totalDeductions, entry.currency)]);
    
    autoTable(doc, {
      startY: lastY + 5,
      head: [['Description', 'Amount']],
      body: deductionsData,
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43] }
    });
    
    // Net Pay
    const lastY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.setTextColor(39, 174, 96);
    doc.text(`Net Pay: ${formatCurrency(entry.netPay, entry.currency)}`, 105, lastY2, { align: 'center' });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('This is a computer-generated document and does not require a signature.', 105, 280, { align: 'center' });
    
    // Save the PDF
    const fileName = `Payslip_${employee.firstName}_${employee.lastName}_${entry.payPeriodEnd}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>View and manage payroll records for all employees</CardDescription>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-bold">Total Gross:</span>
            <span>{formatCurrency(summary.totalGrossPay, filteredPayroll[0]?.currency || 'USD')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">Total Net:</span>
            <span>{formatCurrency(summary.totalNetPay, filteredPayroll[0]?.currency || 'USD')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">Records:</span>
            <span>{summary.employeeCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or date..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredPayroll.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayroll.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {entry.employee.firstName} {entry.employee.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {entry.employee.employeeId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{entry.payPeriodStart} to {entry.payPeriodEnd}</div>
                        <div className="text-sm text-muted-foreground">
                          Paid: {entry.paymentDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(entry.grossPay, entry.currency)}</TableCell>
                    <TableCell>{formatCurrency(entry.netPay, entry.currency)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : entry.status === 'processed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => generatePayslip(entry)}
                      >
                        <Download className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No payroll records found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {payrollData.length === 0 
                ? "Create your first payroll record using the 'Create Payroll' tab." 
                : "No records match your search criteria."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
