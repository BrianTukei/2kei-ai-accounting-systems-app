
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
