
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthCheck from '@/components/auth/AuthCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollData, Employee } from '@/types/PayrollData';
import { toast } from 'sonner';
import EmployeeForm from '@/components/payroll/EmployeeForm';
import PayrollForm from '@/components/payroll/PayrollForm';
import PayrollTable from '@/components/payroll/PayrollTable';
import EmployeeTable from '@/components/payroll/EmployeeTable';
import PayrollActionTracker from '@/components/payroll/PayrollActionTracker';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserComplaintForm from '@/components/UserComplaintForm';
import { AlertCircle } from 'lucide-react';

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employees');
    const storedPayroll = localStorage.getItem('payroll');
    
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees));
    }
    
    if (storedPayroll) {
      setPayrollData(JSON.parse(storedPayroll));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('payroll', JSON.stringify(payrollData));
  }, [payrollData]);

  const handleAddEmployee = (employee: Employee) => {
    setEmployees(prev => [employee, ...prev]);
    toast.success('Employee added successfully');
    
    // Track in system logs
    if (window.payrollTracker) {
      window.payrollTracker.trackCreate(
        employee.id,
        `Added employee: ${employee.firstName} ${employee.lastName} (${employee.jobTitle})`
      );
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    toast.info(`${employee.firstName} ${employee.lastName} selected for payroll creation`);
  };

  const handleAddPayrollEntry = (entry: PayrollData) => {
    setPayrollData(prev => [entry, ...prev]);
    toast.success('Payroll entry added successfully');
  };

  const handleDeleteEmployee = (id: string) => {
    const employeeToDelete = employees.find(emp => emp.id === id);
    
    setEmployees(prev => prev.filter(employee => employee.id !== id));
    toast.success('Employee deleted');
    
    // Track in system logs
    if (window.payrollTracker && employeeToDelete) {
      window.payrollTracker.trackDelete(
        id,
        `Deleted employee: ${employeeToDelete.firstName} ${employeeToDelete.lastName}`
      );
    }
  };

  const handleDeletePayrollEntry = (id: string) => {
    const entryToDelete = payrollData.find(entry => entry.id === id);
    
    setPayrollData(prev => prev.filter(entry => entry.id !== id));
    toast.success('Payroll entry deleted');
    
    // Track in system logs
    if (window.payrollTracker && entryToDelete) {
      window.payrollTracker.trackDelete(
        id,
        `Deleted payroll entry for ${entryToDelete.employee.firstName} ${entryToDelete.employee.lastName} (${entryToDelete.currency} ${entryToDelete.grossPay})`
      );
    }
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
      
      {/* Activity Tracker (No UI) */}
      <PayrollActionTracker />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Payroll Management
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Comprehensive employee compensation and payroll processing system
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report an Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <UserComplaintForm onClose={() => setComplaintDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="create">Create Payroll</TabsTrigger>
            <TabsTrigger value="records">Payroll Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="space-y-4">
            <EmployeeForm onAddEmployee={handleAddEmployee} />
            <EmployeeTable 
              employees={employees} 
              onDeleteEmployee={handleDeleteEmployee}
              onSelectEmployee={handleSelectEmployee}
            />
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <PayrollForm 
              onAddPayroll={handleAddPayrollEntry} 
              employees={employees}
              selectedEmployee={selectedEmployee}
            />
          </TabsContent>
          
          <TabsContent value="records" className="space-y-4">
            <PayrollTable payrollData={payrollData} onDeleteEntry={handleDeletePayrollEntry} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </AuthCheck>
  );
}
