
import { useState, useEffect } from 'react';
import { 
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollData, Employee, Earnings, Deductions, EmployerContributions, AttendanceAndLeave } from '@/types/PayrollData';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

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

  const calculateGrossAndNetPay = (data: any) => {
    // Fixed Earnings
    const basicSalary = Number(data.basicSalary) || 0;
    const housingAllowance = Number(data.housingAllowance) || 0;
    const transportAllowance = Number(data.transportAllowance) || 0;
    const mealAllowance = Number(data.mealAllowance) || 0;
    const annualBonus = Number(data.annualBonus) || 0;
    const performanceBonus = Number(data.performanceBonus) || 0;
    const commissions = Number(data.commissions) || 0;
    const additionalMonthPay = Number(data.additionalMonthPay) || 0;
    
    // Variable Earnings
    const overtimeHours = Number(data.overtimeHours) || 0;
    const overtimeRate = Number(data.overtimeRate) || 1.5;
    const hourlyRate = basicSalary / 176; // Assuming 22 working days of 8 hours each
    const overtimePay = overtimeHours * hourlyRate * overtimeRate;
    
    const nightShiftAllowance = Number(data.nightShiftAllowance) || 0;
    const holidayAllowance = Number(data.holidayAllowance) || 0;
    const travelReimbursement = Number(data.travelReimbursement) || 0;
    const medicalReimbursement = Number(data.medicalReimbursement) || 0;
    
    // Benefits (Taxable)
    const companyCar = Number(data.companyCar) || 0;
    const fuelBenefit = Number(data.fuelBenefit) || 0;
    const stockOptions = Number(data.stockOptions) || 0;
    
    // Calculate gross pay
    const grossPay = basicSalary +
      housingAllowance + transportAllowance + mealAllowance +
      annualBonus + performanceBonus + commissions + additionalMonthPay +
      overtimePay + nightShiftAllowance + holidayAllowance +
      travelReimbursement + medicalReimbursement +
      companyCar + fuelBenefit + stockOptions;
      
    // Deductions
    const incomeTaxRate = Number(data.incomeTaxRate) || 0;
    const incomeTax = grossPay * (incomeTaxRate / 100);
    
    const socialSecurityRate = Number(data.socialSecurityRate) || 0;
    const socialSecurity = grossPay * (socialSecurityRate / 100);
    
    const healthInsurance = Number(data.healthInsurance) || 0;
    const employeePension = Number(data.employeePension) || 0;
    const loanRepayments = Number(data.loanRepayments) || 0;
    const unionDues = Number(data.unionDues) || 0;
    const charitableContributions = Number(data.charitableContributions) || 0;
    
    // Calculate total deductions
    const totalDeductions = incomeTax + socialSecurity + healthInsurance +
      employeePension + loanRepayments + unionDues + charitableContributions;
    
    // Calculate net pay
    const netPay = grossPay - totalDeductions;
    
    return { grossPay, netPay };
  };

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
    
    const earnings: Earnings = {
      basicSalary: Number(data.basicSalary),
      allowances: {
        housing: Number(data.housingAllowance),
        transport: Number(data.transportAllowance),
        meal: Number(data.mealAllowance),
      },
      bonuses: {
        annual: Number(data.annualBonus),
        performance: Number(data.performanceBonus),
      },
      commissions: Number(data.commissions),
      additionalMonthPay: Number(data.additionalMonthPay),
      overtime: {
        hours: Number(data.overtimeHours),
        rate: Number(data.overtimeRate),
        amount: Number(data.overtimeHours) * (Number(data.basicSalary) / 176) * Number(data.overtimeRate),
      },
      shiftDifferentials: {
        night: Number(data.nightShiftAllowance),
        holiday: Number(data.holidayAllowance),
      },
      reimbursements: {
        travel: Number(data.travelReimbursement),
        medical: Number(data.medicalReimbursement),
      },
      benefits: {
        companyCar: Number(data.companyCar),
        fuel: Number(data.fuelBenefit),
        stockOptions: Number(data.stockOptions),
        employerPensionContribution: Number(data.employerPensionContribution),
      },
    };
    
    const deductions: Deductions = {
      incomeTax: grossPay * (Number(data.incomeTaxRate) / 100),
      socialSecurity: grossPay * (Number(data.socialSecurityRate) / 100),
      healthInsurance: Number(data.healthInsurance),
      employeePension: Number(data.employeePension),
      loanRepayments: Number(data.loanRepayments),
      unionDues: Number(data.unionDues),
      charitableContributions: Number(data.charitableContributions),
    };
    
    const employerContributions: EmployerContributions = {
      employerPension: grossPay * (Number(data.employerPension) / 100),
      workersCompensationInsurance: grossPay * (Number(data.workersCompensation) / 100),
      payrollTaxes: grossPay * (Number(data.payrollTaxes) / 100),
    };
    
    const attendance: AttendanceAndLeave = {
      daysWorked: Number(data.daysWorked),
      paidLeave: {
        vacation: Number(data.vacationDays),
        sick: Number(data.sickDays),
      },
      unpaidLeave: Number(data.unpaidLeave),
    };
    
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-md font-semibold">Employee Selection</h3>
                
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName} - {employee.employeeId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedEmployee && (
                  <div className="bg-slate-50 p-3 rounded-md text-sm">
                    <p><span className="font-semibold">Department:</span> {selectedEmployee.department}</p>
                    <p><span className="font-semibold">Position:</span> {selectedEmployee.jobTitle}</p>
                    <p><span className="font-semibold">Type:</span> {selectedEmployee.employmentType}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-md font-semibold">Pay Period</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="payPeriodStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date*</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" required />
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
                        <FormLabel>End Date*</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date*</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                            <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                            <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <Tabs defaultValue="earnings" className="w-full">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="deductions">Deductions</TabsTrigger>
                <TabsTrigger value="contributions">Employer Contributions</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              {/* Earnings Tab */}
              <TabsContent value="earnings" className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Fixed Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Base Compensation</h4>
                    
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary*</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="additionalMonthPay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>13th/14th Month Pay</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormDescription>Pro-rated additional month salary</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Allowances</h4>
                    
                    <FormField
                      control={form.control}
                      name="housingAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Housing Allowance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="transportAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport Allowance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mealAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meal Allowance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Bonuses & Commissions</h4>
                    
                    <FormField
                      control={form.control}
                      name="annualBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Bonus</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="performanceBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Performance Bonus</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="commissions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commissions</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <h3 className="text-lg font-semibold">Variable Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Overtime</h4>
                    
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
                          <FormLabel>Overtime Rate Multiplier</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" />
                          </FormControl>
                          <FormDescription>E.g., 1.5 for time-and-a-half</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Shift Differentials</h4>
                    
                    <FormField
                      control={form.control}
                      name="nightShiftAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Night Shift Allowance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="holidayAllowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Holiday/Weekend Allowance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Reimbursements</h4>
                    
                    <FormField
                      control={form.control}
                      name="travelReimbursement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Travel Reimbursement</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="medicalReimbursement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Reimbursement</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <h3 className="text-lg font-semibold">Benefits (Taxable & Non-Taxable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="companyCar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Car</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>Taxable benefit value</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fuelBenefit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Benefit</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stockOptions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Options/Equity</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>Current period value</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employerPensionContribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Pension Contribution</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>Non-taxable benefit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Deductions Tab */}
              <TabsContent value="deductions" className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Statutory Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Income Tax</h4>
                    
                    <FormField
                      control={form.control}
                      name="incomeTaxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Income Tax Rate (%)*</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" required />
                          </FormControl>
                          <FormDescription>Applied to taxable income</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Social Security</h4>
                    
                    <FormField
                      control={form.control}
                      name="socialSecurityRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Security Rate (%)*</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" required />
                          </FormControl>
                          <FormDescription>E.g., NSSF, Social Security</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Health Insurance</h4>
                    
                    <FormField
                      control={form.control}
                      name="healthInsurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Health Insurance</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" />
                          </FormControl>
                          <FormDescription>Employee portion</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <h3 className="text-lg font-semibold">Voluntary Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="employeePension"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Pension</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>Additional contributions</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="loanRepayments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Repayments</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unionDues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Union Dues</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="charitableContributions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charitable Contributions</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Employer Contributions Tab */}
              <TabsContent value="contributions" className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Employer Contributions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="employerPension"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Pension (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>E.g., NSSF employer portion</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="workersCompensation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workers Compensation (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="payrollTaxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payroll Taxes (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>E.g., FICA, Skills Development Levy</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    These employer contributions do not affect the employee's net pay. 
                    They represent additional costs to the employer beyond the employee's salary.
                  </p>
                </div>
              </TabsContent>
              
              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Attendance and Leave</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="daysWorked"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days Worked</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vacationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vacation Days</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sickDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sick Days</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unpaidLeave"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unpaid Leave</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
