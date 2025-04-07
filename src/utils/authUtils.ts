
// Utility functions for authentication

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const sendSignupNotification = async (userData: { name: string; email: string }) => {
  console.log(`Email notification would be sent to tukeibrian5@gmail.com for new signup: ${userData.email}`);
  return true;
};

export const trackLogin = (userData: { email: string }) => {
  try {
    const storedLogins = localStorage.getItem('loginHistory');
    const logins = storedLogins ? JSON.parse(storedLogins) : [];
    
    logins.push({
      email: userData.email,
      timestamp: new Date().toISOString()
    });
    
    if (logins.length > 100) {
      logins.splice(0, logins.length - 100);
    }
    
    localStorage.setItem('loginHistory', JSON.stringify(logins));
    
    console.log(`User login tracked: ${userData.email}`);
  } catch (error) {
    console.error('Error tracking login:', error);
  }
};

export const trackSignup = (userData: { name: string; email: string }) => {
  try {
    const storedSignups = localStorage.getItem('userSignups');
    const signups = storedSignups ? JSON.parse(storedSignups) : [];
    
    signups.push({
      id: generateId(),
      name: userData.name,
      email: userData.email,
      date: new Date().toISOString()
    });
    
    localStorage.setItem('userSignups', JSON.stringify(signups));
    
    sendSignupNotification(userData);
    
    console.log(`User signup tracked: ${userData.email}`);
  } catch (error) {
    console.error('Error tracking signup:', error);
  }
};

// Admin access control functions
export const isAdminUser = (email: string) => {
  // This function checks if the user is an admin
  return email === 'tukeibrian5@gmail.com';
};

export const trackUnauthorizedAdminAccess = (email: string) => {
  try {
    const storedAttempts = localStorage.getItem('unauthorizedAdminAttempts');
    const attempts = storedAttempts ? JSON.parse(storedAttempts) : [];
    
    attempts.push({
      email,
      timestamp: new Date().toISOString(),
      ipAddress: 'Not available in client-side code' // In a real app, this would come from the server
    });
    
    localStorage.setItem('unauthorizedAdminAttempts', JSON.stringify(attempts));
    
    console.warn(`Unauthorized admin access attempt by: ${email}`);
  } catch (error) {
    console.error('Error tracking unauthorized access:', error);
  }
};

