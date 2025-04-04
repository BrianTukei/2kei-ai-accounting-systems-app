
import { useState } from 'react';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PayrollData } from '@/types/PayrollData';
import { useForm } from 'react-hook-form';

interface PayrollFormProps {
  onAddPayroll: (payrollData: PayrollData) => void;
}

export default function PayrollForm({ onAddPayroll }: PayrollFormProps) {
  const [calculatedNetPay, setCalculatedNetPay] = useState(0);
  
  const form = useForm({
    defaultValues: {
      employeeName: '',
      employeeId: '',
      position: '',
      payPeriodStart: '',
      payPeriodEnd: '',
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 1.5,
      bonus: 0,
      deductions: 0,
      taxRate: 20,
      paymentMethod: 'direct_deposit',
      notes: ''
    }
  });

  const calculateNetPay = (data: any) => {
    const baseSalary = Number(data.baseSalary) || 0;
    const overtimeHours = Number(data.overtimeHours) || 0;
    const overtimeRate = Number(data.overtimeRate) || 1.5;
    const bonus = Number(data.bonus) || 0;
    const deductions = Number(data.deductions) || 0;
    const taxRate = Number(data.taxRate) || 20;
    
    // Calculate hourly rate (assuming base salary is monthly)
    const hourlyRate = baseSalary / 160; // 160 working hours in a month
    
    // Calculate gross pay
    const overtimePay = overtimeHours * hourlyRate * overtimeRate;
    const grossPay = baseSalary + overtimePay + bonus;
    
    // Calculate tax amount
    const taxAmount = grossPay * (taxRate / 100);
    
    // Calculate net pay
    const netPay = grossPay - taxAmount - deductions;
    
    return netPay;
  };

  const handleCalculate = () => {
    const data = form.getValues();
    const netPay = calculateNetPay(data);
    setCalculatedNetPay(netPay);
  };

  const onSubmit = (data: any) => {
    const netPay = calculateNetPay(data);
    
    const payrollEntry: PayrollData = {
      id: `payroll-${Date.now()}`,
      employeeName: data.employeeName,
      employeeId: data.employeeId,
      position: data.position,
      payPeriodStart: data.payPeriodStart,
      payPeriodEnd: data.payPeriodEnd,
      baseSalary: Number(data.baseSalary),
      overtimeHours: Number(data.overtimeHours),
      overtimeRate: Number(data.overtimeRate),
      bonus: Number(data.bonus),
      deductions: Number(data.deductions),
      taxRate: Number(data.taxRate),
      netPay: netPay,
      paymentMethod: data.paymentMethod,
      notes: data.notes
    };
    
    onAddPayroll(payrollEntry);
    form.reset();
    setCalculatedNetPay(0);
  };

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Create Payroll Entry</CardTitle>
        <CardDescription>Fill in the details to create a new payroll entry</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee Information */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Employee Information</h3>
                
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="EMP-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Software Engineer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Pay Period Information */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Pay Period</h3>
                
                <FormField
                  control={form.control}
                  name="payPeriodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payPeriodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Compensation Information */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Compensation</h3>
                
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Salary</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="overtimeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime Hours</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="overtimeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime Rate (x hourly)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Additional Compensation</h3>
                
                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Deductions & Taxes</h3>
                
                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deductions</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Notes</h3>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t pt-4">
              <div>
                <Button type="button" variant="outline" onClick={handleCalculate} className="mr-2">
                  Calculate
                </Button>
                {calculatedNetPay > 0 && (
                  <span className="text-sm font-medium ml-2">
                    Net Pay: ${calculatedNetPay.toFixed(2)}
                  </span>
                )}
              </div>
              
              <Button type="submit">
                Create Payroll Entry
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
