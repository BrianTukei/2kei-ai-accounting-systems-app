
import { useState, useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PayrollData, Employee } from '@/types/PayrollData';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

// Import component sections
import PayrollBasicInfoSection from './PayrollBasicInfoSection';
import EarningsSection from './EarningsSection';
import DeductionsSection from './DeductionsSection';
import EmployerContributionsSection from './EmployerContributionsSection';
import AttendanceSection from './AttendanceSection';

// Import calculation utilities
import { calculateGrossAndNetPay, createPayrollEntryData } from './PayrollCalculationUtils';

interface PayrollFormProps {
  onAddPayroll: (payrollData: PayrollData) => void;
  employees: Employee[];
  selectedEmployee: Employee | null;
}

export default function PayrollForm({ onAddPayroll, employees, selectedEmployee }: PayrollFormProps) {
  const [calculatedGrossPay, setCalculatedGrossPay] = useState(0);
  const [calculatedNetPay, setCalculatedNetPay] = useState(0);
  
  const form = useForm({
    defaultValues: {
      employeeId: '',
      payPeriodStart: '',
      payPeriodEnd: '',
      paymentDate: '',
      currency: 'UGX',
      
      // Fixed earnings
      basicSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0,
      mealAllowance: 0,
      annualBonus: 0,
      performanceBonus: 0,
      commissions: 0,
      additionalMonthPay: 0,
      
      // Variable earnings
      overtimeHours: 0,
      overtimeRate: 1.5,
      nightShiftAllowance: 0,
      holidayAllowance: 0,
      travelReimbursement: 0,
      medicalReimbursement: 0,
      
      // Benefits
      companyCar: 0,
      fuelBenefit: 0,
      stockOptions: 0,
      employerPensionContribution: 0,
      
      // Deductions
      incomeTaxRate: 20,
      socialSecurityRate: 5,
      healthInsurance: 0,
      employeePension: 0,
      loanRepayments: 0,
      unionDues: 0,
      charitableContributions: 0,
      
      // Employer contributions
      employerPension: 10,
      workersCompensation: 2,
      payrollTaxes: 1,
      
      // Attendance
      daysWorked: 22,
      vacationDays: 0,
      sickDays: 0,
      unpaidLeave: 0,
      
      paymentMethod: 'direct_deposit',
      notes: ''
    }
  });

  // Update form when selected employee changes
  useEffect(() => {
    if (selectedEmployee) {
      form.setValue('employeeId', selectedEmployee.id);
    }
  }, [selectedEmployee, form]);

  const handleCalculate = () => {
    const data = form.getValues();
    const { grossPay, netPay } = calculateGrossAndNetPay(data);
    setCalculatedGrossPay(grossPay);
    setCalculatedNetPay(netPay);
  };

  const onSubmit = (data: any) => {
    const { grossPay, netPay } = calculateGrossAndNetPay(data);
    
    const selectedEmployeeData = employees.find(emp => emp.id === data.employeeId);
    if (!selectedEmployeeData) {
      return;
    }

    const { earnings, deductions, employerContributions, attendance } = createPayrollEntryData(
      data, 
      selectedEmployeeData, 
      grossPay, 
      netPay
    );
    
    const payrollEntry: PayrollData = {
      id: uuidv4(),
      payPeriodStart: data.payPeriodStart,
      payPeriodEnd: data.payPeriodEnd,
      paymentDate: data.paymentDate,
      employee: selectedEmployeeData,
      earnings: earnings,
      grossPay: grossPay,
      deductions: deductions,
      netPay: netPay,
      employerContributions: employerContributions,
      attendance: attendance,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      status: 'draft',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onAddPayroll(payrollEntry);
    form.reset();
    setCalculatedGrossPay(0);
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
            {/* Basic Payroll Information */}
            <PayrollBasicInfoSection
              form={form}
              employees={employees}
              selectedEmployee={selectedEmployee}
            />
            
            <Separator />
            
            <Tabs defaultValue="earnings" className="w-full">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="deductions">Deductions</TabsTrigger>
                <TabsTrigger value="contributions">Employer Contributions</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              {/* Earnings Tab */}
              <TabsContent value="earnings">
                <EarningsSection form={form} />
              </TabsContent>
              
              {/* Deductions Tab */}
              <TabsContent value="deductions">
                <DeductionsSection form={form} />
              </TabsContent>
              
              {/* Employer Contributions Tab */}
              <TabsContent value="contributions">
                <EmployerContributionsSection form={form} />
              </TabsContent>
              
              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <AttendanceSection form={form} />
              </TabsContent>
            </Tabs>
            
            <Separator />
            
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
            
            <div className="flex justify-between items-center border-t pt-4">
              <div>
                <Button type="button" variant="outline" onClick={handleCalculate} className="mr-2">
                  Calculate
                </Button>
                {(calculatedGrossPay > 0 || calculatedNetPay > 0) && (
                  <span className="text-sm font-medium ml-2">
                    Gross Pay: <span className="text-blue-600">${calculatedGrossPay.toFixed(2)}</span> | 
                    Net Pay: <span className="text-green-600">${calculatedNetPay.toFixed(2)}</span>
                  </span>
                )}
              </div>
              
              <Button type="submit" disabled={employees.length === 0 || !form.getValues().employeeId}>
                Create Payroll Entry
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
