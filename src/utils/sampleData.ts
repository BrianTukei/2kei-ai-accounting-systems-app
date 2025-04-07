import { Transaction } from '@/components/TransactionCard';
import { allTransactions } from '@/data/mockTransactions';
import { Employee, PayrollData } from '@/types/PayrollData';
import { v4 as uuidv4 } from 'uuid';

// Sample user data
export const sampleUsers = [
  {
    id: "USR001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    joinDate: "2025-01-10",
    lastLogin: "2025-04-05T14:30:00Z",
    role: "user",
    status: "active"
  },
  {
    id: "USR002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    joinDate: "2025-02-15",
    lastLogin: "2025-04-04T09:15:00Z",
    role: "user",
    status: "active"
  },
  {
    id: "USR003",
    firstName: "Brian",
    lastName: "Tukei",
    email: "tukeibrian5@gmail.com",
    joinDate: "2025-01-01",
    lastLogin: "2025-04-07T10:00:00Z",
    role: "admin",
    status: "active"
  }
];

// Sample employees for payroll
export const sampleEmployees: Employee[] = [
  {
    id: "EMP001",
    employeeId: "E1001",
    firstName: "Alice",
    lastName: "Johnson",
    dateOfBirth: "1988-05-15",
    gender: "female",
    nationality: "Ugandan",
    passportNumber: "UG123456",
    nationalIdNumber: "CM88051500001A",
    taxIdentificationNumber: "TIN1234567",
    address: {
      street: "15 Kampala Road",
      city: "Kampala",
      state: "Central",
      country: "Uganda",
      postalCode: "10001"
    },
    contactNumber: "+256 700 123456",
    email: "alice.johnson@example.com",
    employmentStartDate: "2023-01-15",
    jobTitle: "Senior Accountant",
    department: "Finance",
    employmentType: "full-time",
    bankDetails: {
      bankName: "Stanbic Bank",
      accountNumber: "0123456789",
      branchCode: "042"
    }
  },
  {
    id: "EMP002",
    employeeId: "E1002",
    firstName: "Robert",
    lastName: "Kimani",
    dateOfBirth: "1992-08-21",
    gender: "male",
    nationality: "Kenyan",
    passportNumber: "KE987654",
    nationalIdNumber: "29876543",
    taxIdentificationNumber: "KRA76543210",
    address: {
      street: "25 Moi Avenue",
      city: "Nairobi",
      state: "Nairobi County",
      country: "Kenya",
      postalCode: "00100"
    },
    contactNumber: "+254 722 123456",
    email: "robert.kimani@example.com",
    employmentStartDate: "2023-03-01",
    jobTitle: "Sales Manager",
    department: "Sales",
    employmentType: "full-time",
    bankDetails: {
      bankName: "Equity Bank",
      accountNumber: "9876543210",
      branchCode: "056"
    }
  },
  {
    id: "EMP003",
    employeeId: "E1003",
    firstName: "Sarah",
    lastName: "Okafor",
    dateOfBirth: "1995-11-10",
    gender: "female",
    nationality: "Nigerian",
    passportNumber: "A12345678",
    nationalIdNumber: "NIN123456789",
    taxIdentificationNumber: "TIN987654321",
    address: {
      street: "10 Victoria Island",
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
      postalCode: "101233"
    },
    contactNumber: "+234 802 1234567",
    email: "sarah.okafor@example.com",
    employmentStartDate: "2023-05-15",
    employmentType: "part-time",
    jobTitle: "Marketing Specialist",
    department: "Marketing",
    bankDetails: {
      bankName: "First Bank of Nigeria",
      accountNumber: "3456789012",
      branchCode: "034"
    }
  }
];

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

// Function to load sample data into localStorage if it doesn't exist yet
export const loadSampleData = () => {
  // Check if transaction data exists
  if (!localStorage.getItem('finance-app-transactions')) {
    localStorage.setItem('finance-app-transactions', JSON.stringify(allTransactions));
    console.log('Loaded sample transaction data');
  }
  
  // Check if user data exists
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(sampleUsers));
    console.log('Loaded sample user data');
  }
  
  // Check if employee data exists
  if (!localStorage.getItem('employees')) {
    localStorage.setItem('employees', JSON.stringify(sampleEmployees));
    console.log('Loaded sample employee data');
  }
  
  // Check if payroll data exists
  if (!localStorage.getItem('payroll')) {
    localStorage.setItem('payroll', JSON.stringify(samplePayrollData));
    console.log('Loaded sample payroll data');
  }
  
  // Set up login tracking storage if it doesn't exist
  if (!localStorage.getItem('loginHistory')) {
    localStorage.setItem('loginHistory', JSON.stringify([]));
  }
  
  // Set up signup tracking storage if it doesn't exist
  if (!localStorage.getItem('userSignups')) {
    localStorage.setItem('userSignups', JSON.stringify([]));
  }
};
