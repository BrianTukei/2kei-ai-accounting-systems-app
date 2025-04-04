
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Trash2 } from 'lucide-react';
import { PayrollData, PayrollSummary } from '@/types/PayrollData';
import { generatePayrollPDF } from './PayrollPDFGenerator';

interface PayrollTableProps {
  payrollData: PayrollData[];
  onDeleteEntry: (id: string) => void;
}

export default function PayrollTable({ payrollData, onDeleteEntry }: PayrollTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter payroll data based on search term
  const filteredData = payrollData.filter(entry => 
    entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.position.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate summary data
  const calculateSummary = (): PayrollSummary => {
    return filteredData.reduce((summary, entry) => {
      const grossPay = entry.baseSalary + 
        (entry.baseSalary / 160) * entry.overtimeHours * entry.overtimeRate + 
        entry.bonus;
        
      return {
        totalGrossPay: summary.totalGrossPay + grossPay,
        totalDeductions: summary.totalDeductions + entry.deductions + (grossPay * entry.taxRate / 100),
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
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>Manage employee payroll entries</CardDescription>
        </div>
        <Button onClick={handleDownloadPDF} disabled={filteredData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or position..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredData.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.employeeName}</div>
                          <div className="text-sm text-muted-foreground">ID: {entry.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.position}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {entry.payPeriodStart} to {entry.payPeriodEnd}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ${entry.baseSalary.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${entry.netPay.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
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
            
            {/* Summary section */}
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Gross Pay</div>
                  <div className="text-2xl font-bold text-green-600">${summary.totalGrossPay.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Deductions</div>
                  <div className="text-2xl font-bold text-red-600">${summary.totalDeductions.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-md">
                  <div className="text-sm text-muted-foreground">Total Net Pay</div>
                  <div className="text-2xl font-bold">${summary.totalNetPay.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3">
              <Download className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No payroll records</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first payroll entry using the form above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
