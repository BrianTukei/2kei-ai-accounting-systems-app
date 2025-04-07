
import { v4 as uuidv4 } from 'uuid';
import { PayrollData } from '@/types/PayrollData';
import { sampleEmployees } from './employees';

// Sample payroll data
export const samplePayrollData: PayrollData[] = [
  {
    id: uuidv4(),
    payPeriodStart: "2025-03-01",
    payPeriodEnd: "2025-03-31",
    paymentDate: "2025-04-05",
    employee: sampleEmployees[0],
    earnings: {
      basicSalary: 2500000,
      allowances: {
        housing: 500000,
        transport: 250000,
        meal: 150000
      },
      bonuses: {
        performance: 300000
      },
      overtime: {
        hours: 10,
        rate: 1.5,
        amount: 214843.75
      },
      reimbursements: {
        travel: 125000
      },
      benefits: {
        employerPensionContribution: 250000
      }
    },
    grossPay: 4039843.75,
    deductions: {
      incomeTax: 807968.75,
      socialSecurity: 201992.19,
      healthInsurance: 100000,
      employeePension: 120000,
      loanRepayments: 50000
    },
    netPay: 2759882.81,
    employerContributions: {
      employerPension: 403984.38,
      workersCompensationInsurance: 80796.88,
      payrollTaxes: 40398.44
    },
    attendance: {
      daysWorked: 22,
      paidLeave: {
        vacation: 0,
        sick: 0
      }
    },
    currency: "UGX",
    paymentMethod: "direct_deposit",
    status: "paid",
    notes: "March 2025 salary payment",
    createdAt: "2025-04-01T10:00:00Z",
    updatedAt: "2025-04-05T08:30:00Z"
  },
  {
    id: uuidv4(),
    payPeriodStart: "2025-03-01",
    payPeriodEnd: "2025-03-31",
    paymentDate: "2025-04-05",
    employee: sampleEmployees[1],
    earnings: {
      basicSalary: 3200000,
      allowances: {
        housing: 800000,
        transport: 300000,
        meal: 200000
      },
      bonuses: {
        annual: 1000000,
        performance: 500000
      },
      commissions: 750000,
      overtime: {
        hours: 0,
        rate: 1.5,
        amount: 0
      },
      benefits: {
        companyCar: 500000,
        fuel: 250000,
        employerPensionContribution: 320000
      }
    },
    grossPay: 7500000,
    deductions: {
      incomeTax: 1875000,
      socialSecurity: 375000,
      healthInsurance: 150000,
      employeePension: 250000,
      charitableContributions: 50000
    },
    netPay: 4800000,
    employerContributions: {
      employerPension: 750000,
      workersCompensationInsurance: 150000,
      payrollTaxes: 75000
    },
    attendance: {
      daysWorked: 22,
      paidLeave: {
        vacation: 0,
        sick: 0
      }
    },
    currency: "KES",
    paymentMethod: "direct_deposit",
    status: "paid",
    notes: "March 2025 salary payment with annual bonus",
    createdAt: "2025-04-01T11:00:00Z",
    updatedAt: "2025-04-05T09:00:00Z"
  },
  {
    id: uuidv4(),
    payPeriodStart: "2025-03-01",
    payPeriodEnd: "2025-03-31",
    paymentDate: "2025-04-05",
    employee: sampleEmployees[2],
    earnings: {
      basicSalary: 1800000,
      allowances: {
        housing: 300000,
        transport: 150000,
        meal: 100000
      },
      bonuses: {},
      overtime: {
        hours: 5,
        rate: 1.5,
        amount: 76704.55
      },
      shiftDifferentials: {
        night: 50000
      },
      reimbursements: {
        medical: 80000
      }
    },
    grossPay: 2556704.55,
    deductions: {
      incomeTax: 511340.91,
      socialSecurity: 127835.23,
      unionDues: 15000
    },
    netPay: 1902528.41,
    employerContributions: {
      employerPension: 255670.45,
      workersCompensationInsurance: 51134.09,
      payrollTaxes: 25567.05
    },
    attendance: {
      daysWorked: 10,
      paidLeave: {
        vacation: 0,
        sick: 2
      },
      unpaidLeave: 10
    },
    currency: "NGN",
    paymentMethod: "mobile_money",
    status: "paid",
    notes: "Part-time payment for March 2025",
    createdAt: "2025-04-01T12:00:00Z",
    updatedAt: "2025-04-05T09:30:00Z"
  }
];
