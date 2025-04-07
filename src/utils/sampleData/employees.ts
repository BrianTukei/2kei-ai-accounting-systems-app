
import { Employee } from '@/types/PayrollData';

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
