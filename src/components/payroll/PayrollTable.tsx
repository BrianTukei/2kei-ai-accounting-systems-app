
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Trash2, FileText, Mail } from 'lucide-react';
import { PayrollData, PayrollSummary } from '@/types/PayrollData';
import { generatePayrollPDF } from './PayrollPDFGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PayrollTableProps {
  payrollData: PayrollData[];
  onDeleteEntry: (id: string) => void;
}

export default function PayrollTable({ payrollData, onDeleteEntry }: PayrollTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('employee');
  
  // Filter payroll data based on search term
  const filteredData = payrollData.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    
    if (filterBy === 'employee') {
      return `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase().includes(searchLower) || 
        entry.employee.employeeId.toLowerCase().includes(searchLower);
    } else if (filterBy === 'date') {
      return entry.paymentDate.includes(searchLower) || 
        entry.payPeriodStart.includes(searchLower) || 
        entry.payPeriodEnd.includes(searchLower);
    } else if (filterBy === 'department') {
      return entry.employee.department.toLowerCase().includes(searchLower);
    } else if (filterBy === 'status') {
      return entry.status.toLowerCase().includes(searchLower);
    }
    
    return true;
  });
  
  // Calculate summary data
  const calculateSummary = (): PayrollSummary => {
    return filteredData.reduce((summary, entry) => {
      return {
        totalGrossPay: summary.totalGrossPay + entry.grossPay,
        totalDeductions: summary.totalDeductions + 
          (entry.deductions.incomeTax + 
           entry.deductions.socialSecurity + 
           (entry.deductions.healthInsurance || 0) + 
           (entry.deductions.employeePension || 0) + 
           (entry.deductions.unionDues || 0) + 
           (entry.deductions.loanRepayments || 0) + 
           (entry.deductions.charitableContributions || 0)),
        totalNetPay: summary.totalNetPay + entry.netPay,
        employeeCount: summary.employeeCount + 1
      };
    }, { totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0, employeeCount: 0 });
  };
  
  const summary = calculateSummary();
  
  // Generate payroll PDF
  const handleDownloadPDF = () => {
    generatePayrollPDF(filteredData, summary);
  };
  
  // Generate individual payslip
  const handleGeneratePayslip = (entry: PayrollData) => {
    // In a real app, this would generate an individual payslip
    toast.success(`Payslip generated for ${entry.employee.firstName} ${entry.employee.lastName}`);
  };
  
  // Email payslip
  const handleEmailPayslip = (entry: PayrollData) => {
    // In a real app, this would email the payslip to the employee
    toast.success(`Payslip emailed to ${entry.employee.email || 'employee'}`);
  };
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>Manage employee payroll entries</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} disabled={filteredData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payroll records..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredData.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((entry) => {
                    // Calculate total deductions
                    const totalDeductions = 
                      entry.deductions.incomeTax + 
                      entry.deductions.socialSecurity + 
                      (entry.deductions.healthInsurance || 0) + 
                      (entry.deductions.employeePension || 0) + 
                      (entry.deductions.unionDues || 0) + 
                      (entry.deductions.loanRepayments || 0) + 
                      (entry.deductions.charitableContributions || 0);
                    
                    return (
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
                          <div className="text-sm">
                            {entry.payPeriodStart} to {entry.payPeriodEnd}
                            <div className="text-xs text-muted-foreground">
                              Payment: {entry.paymentDate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.employee.department}</TableCell>
                        <TableCell className="text-right">
                          {entry.currency} {entry.grossPay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {entry.currency} {totalDeductions.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.currency} {entry.netPay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleGeneratePayslip(entry)}
                              title="Generate Payslip"
                            >
                              <FileText className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEmailPayslip(entry)}
                              title="Email Payslip"
                            >
                              <Mail className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteEntry(entry.id)}
                              title="Delete Entry"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary section */}
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Employee Count</div>
                  <div className="text-2xl font-bold">{summary.employeeCount}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Gross Pay</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${summary.totalGrossPay.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Deductions</div>
                  <div className="text-2xl font-bold text-red-600">
                    ${summary.totalDeductions.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Net Pay</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.totalNetPay.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No payroll records</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {payrollData.length === 0 
                ? "Add your first payroll entry using the Create Payroll tab." 
                : "No payroll records match your search criteria."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
