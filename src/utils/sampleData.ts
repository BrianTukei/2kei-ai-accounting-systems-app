
import { Transaction } from '@/components/TransactionCard';
import { allTransactions } from '@/data/mockTransactions';

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
  
  // Set up login tracking storage if it doesn't exist
  if (!localStorage.getItem('loginHistory')) {
    localStorage.setItem('loginHistory', JSON.stringify([]));
  }
  
  // Set up signup tracking storage if it doesn't exist
  if (!localStorage.getItem('userSignups')) {
    localStorage.setItem('userSignups', JSON.stringify([]));
  }
};
