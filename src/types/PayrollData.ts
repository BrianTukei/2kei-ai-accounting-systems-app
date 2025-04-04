
export interface PayrollData {
  id: string;
  employeeName: string;
  employeeId: string;
  position: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  bonus: number;
  deductions: number;
  taxRate: number;
  netPay: number;
  paymentMethod: string;
  notes?: string;
}

export interface PayrollSummary {
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;
}
