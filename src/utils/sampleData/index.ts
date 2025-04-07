
import { allTransactions } from '@/data/mockTransactions';
import { sampleUsers } from './users';
import { sampleEmployees } from './employees';
import { samplePayrollData } from './payroll';

// Re-export all the sample data for backward compatibility
export { sampleUsers } from './users';
export { sampleEmployees } from './employees';
export { samplePayrollData } from './payroll';

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
