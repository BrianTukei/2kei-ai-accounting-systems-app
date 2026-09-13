
import { sampleUsers } from './users';
import { initializeAdminStorage } from '../adminUtils';

// Re-export all the sample data for backward compatibility
export { sampleUsers } from './users';

// Function to load sample data into localStorage if it doesn't exist yet
export const loadSampleData = () => {
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
  
  // Initialize admin tracking storage systems
  initializeAdminStorage();
  
};
