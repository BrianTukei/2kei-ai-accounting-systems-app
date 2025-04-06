
// Sample data for the application that can be used as initial data
// These will be editable by users but provide a starting point

// Sample employee data
export const sampleEmployees = [
  {
    id: "EMP001",
    firstName: "John",
    lastName: "Doe",
    middleName: "Robert",
    gender: "Male",
    dateOfBirth: "1985-05-15",
    nationality: "Ugandan",
    idNumber: "UG12345678",
    tinNumber: "TIN123456789",
    address: "123 Main St, Kampala",
    startDate: "2022-01-10",
    endDate: "",
    jobTitle: "Senior Accountant",
    department: "Finance",
    employmentType: "Full-time",
    email: "john.doe@example.com",
    phoneNumber: "+256701234567",
    bankName: "Stanbic Bank",
    accountNumber: "1234567890",
    salary: 2500000
  },
  {
    id: "EMP002",
    firstName: "Jane",
    lastName: "Smith",
    middleName: "Elizabeth",
    gender: "Female",
    dateOfBirth: "1990-08-22",
    nationality: "Kenyan",
    idNumber: "KE98765432",
    tinNumber: "TIN987654321",
    address: "456 Park Ave, Nairobi",
    startDate: "2022-02-15",
    endDate: "",
    jobTitle: "Marketing Manager",
    department: "Marketing",
    employmentType: "Full-time",
    email: "jane.smith@example.com",
    phoneNumber: "+254712345678",
    bankName: "Equity Bank",
    accountNumber: "9876543210",
    salary: 3000000
  },
  {
    id: "EMP003",
    firstName: "Michael",
    lastName: "Johnson",
    middleName: "James",
    gender: "Male",
    dateOfBirth: "1988-11-30",
    nationality: "Rwandan",
    idNumber: "RW54321678",
    tinNumber: "TIN543216789",
    address: "789 Oak Rd, Kigali",
    startDate: "2022-03-05",
    endDate: "",
    jobTitle: "Software Developer",
    department: "IT",
    employmentType: "Contractor",
    email: "michael.johnson@example.com",
    phoneNumber: "+250781234567",
    bankName: "Bank of Kigali",
    accountNumber: "5432167890",
    salary: 2800000
  }
];

// Sample payroll data
export const samplePayrolls = [
  {
    id: "PAY001",
    employeeId: "EMP001",
    employeeName: "John Doe",
    period: "April 2025",
    basicSalary: 2500000,
    allowances: [
      { type: "Housing", amount: 500000 },
      { type: "Transport", amount: 200000 },
      { type: "Meal", amount: 150000 }
    ],
    overtime: { hours: 10, rate: 15000, amount: 150000 },
    bonus: 100000,
    benefits: [
      { type: "Health Insurance", amount: 150000 }
    ],
    grossEarnings: 3600000,
    deductions: [
      { type: "Income Tax (PAYE)", amount: 650000 },
      { type: "NSSF", amount: 250000 },
      { type: "Health Insurance", amount: 50000 }
    ],
    totalDeductions: 950000,
    netPay: 2650000,
    paymentDate: "2025-04-25",
    paymentMethod: "Bank Transfer",
    status: "Paid"
  },
  {
    id: "PAY002",
    employeeId: "EMP002",
    employeeName: "Jane Smith",
    period: "April 2025",
    basicSalary: 3000000,
    allowances: [
      { type: "Housing", amount: 600000 },
      { type: "Transport", amount: 250000 }
    ],
    overtime: { hours: 5, rate: 18000, amount: 90000 },
    bonus: 200000,
    benefits: [
      { type: "Health Insurance", amount: 180000 },
      { type: "Company Car", amount: 300000 }
    ],
    grossEarnings: 4440000,
    deductions: [
      { type: "Income Tax (PAYE)", amount: 800000 },
      { type: "NSSF", amount: 300000 },
      { type: "Health Insurance", amount: 60000 }
    ],
    totalDeductions: 1160000,
    netPay: 3280000,
    paymentDate: "2025-04-25",
    paymentMethod: "Bank Transfer",
    status: "Paid"
  }
];

// Function to load sample data into localStorage if it doesn't exist yet
export const loadSampleData = () => {
  // Check if employee data exists
  if (!localStorage.getItem('employees')) {
    localStorage.setItem('employees', JSON.stringify(sampleEmployees));
    console.log('Loaded sample employee data');
  }
  
  // Check if payroll data exists
  if (!localStorage.getItem('payrolls')) {
    localStorage.setItem('payrolls', JSON.stringify(samplePayrolls));
    console.log('Loaded sample payroll data');
  }
};
