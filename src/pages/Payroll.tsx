
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PayrollForm from '@/components/payroll/PayrollForm';
import PayrollTable from '@/components/payroll/PayrollTable';
import { PayrollData } from '@/types/PayrollData';
import { toast } from 'sonner';

export default function Payroll() {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);

  const handleAddPayrollEntry = (entry: PayrollData) => {
    setPayrollData(prev => [entry, ...prev]);
    toast.success('Payroll entry added successfully');
  };

  const handleDeletePayrollEntry = (id: string) => {
    setPayrollData(prev => prev.filter(entry => entry.id !== id));
    toast.success('Payroll entry deleted');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              Payroll Management
            </h1>
            <p className="text-slate-500 animate-fade-in">
              Manage employee compensation and generate payroll reports.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <PayrollForm onAddPayroll={handleAddPayrollEntry} />
          <PayrollTable payrollData={payrollData} onDeleteEntry={handleDeletePayrollEntry} />
        </div>
      </main>
    </div>
  );
}
