
// Employee Information
export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  nationality: string;
  passportNumber?: string;
  nationalIdNumber?: string;
  taxIdentificationNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactNumber?: string;
  email?: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  jobTitle: string;
  department: string;
  employmentType: "full-time" | "part-time" | "contractor";
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    branchCode?: string;
  };
}

// Earnings & Compensation
export interface Earnings {
  // Fixed Earnings
  basicSalary: number;
  allowances: {
    housing?: number;
    transport?: number;
    meal?: number;
    other?: { [key: string]: number };
  };
  bonuses: {
    annual?: number;
    performance?: number;
    other?: { [key: string]: number };
  };
  commissions?: number;
  additionalMonthPay?: number; // 13th/14th month pay

  // Variable Earnings
  overtime: {
    hours: number;
    rate: number;
    amount?: number;
  };
  shiftDifferentials?: {
    night?: number;
    holiday?: number;
    weekend?: number;
  };
  reimbursements?: {
    travel?: number;
    medical?: number;
    other?: { [key: string]: number };
  };

  // Benefits
  benefits?: {
    companyCar?: number;
    fuel?: number;
    stockOptions?: number;
    employerPensionContribution?: number;
  };
}

// Deductions
export interface Deductions {
  // Statutory Deductions
  incomeTax: number;
  socialSecurity: number;
  healthInsurance?: number;
  unemploymentInsurance?: number;
  VAT?: number;
  PAYE?: number;
  NSSF?: number;
  otherTaxes?: { [key: string]: number };

  // Voluntary Deductions
  employeePension?: number;
  unionDues?: number;
  loanRepayments?: number;
  charitableContributions?: number;
  otherDeductions?: { [key: string]: number };
}

// Employer Contributions (hidden from employee)
export interface EmployerContributions {
  employerPension: number;
  workersCompensationInsurance?: number;
  payrollTaxes?: number;
  employerNSSF?: number;
  otherContributions?: { [key: string]: number };
}

// Attendance and Leave
export interface AttendanceAndLeave {
  daysWorked: number;
  paidLeave: {
    vacation: number;
    sick: number;
    maternity?: number;
    paternity?: number;
    other?: { [key: string]: number };
  };
  unpaidLeave?: number;
  publicHolidays?: number;
}

// Complete Payroll Record
export interface PayrollData {
  id: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;
  employee: Employee;
  earnings: Earnings;
  grossPay: number; // Total of all earnings before deductions
  deductions: Deductions;
  netPay: number; // Gross pay minus all deductions
  employerContributions?: EmployerContributions;
  attendance?: AttendanceAndLeave;
  currency: string;
  paymentMethod: string;
  status: "draft" | "processed" | "paid";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;
}

// Tax Brackets for progressive tax calculation
export interface TaxBracket {
  min: number;
  max?: number; // Undefined for the highest bracket
  rate: number; // Percentage (e.g., 20 for 20%)
}

// Country-specific tax configurations
export interface CountryTaxConfig {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  incomeTaxBrackets: TaxBracket[];
  socialSecurityRate: {
    employee: number;
    employer: number;
  };
  healthInsuranceRate?: {
    employee: number;
    employer: number;
  };
  hasPayrollTax?: boolean;
  payrollTaxRate?: number;
  hasVAT?: boolean;
  VATRate?: number;
  hasPAYE?: boolean;
  PAYERate?: number;
  hasNSSF?: boolean;
  NSSFRate?: {
    employee: number;
    employer: number;
  };
}

// System change log for tracking changes
export interface SystemChangeLog {
  id: string;
  timestamp: string;
  adminId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: "employee" | "payroll" | "user" | "setting";
  entityId: string;
  description: string;
}

// User complaint tracking
export interface UserComplaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: "payroll" | "user-access" | "technical" | "billing" | "other";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
  resolutionDate?: string;
}
