
/**
 * Generates a unique ID string
 * @returns A unique string ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Checks if user is authenticated
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = () => {
  const user = localStorage.getItem('user');
  return !!user;
};

/**
 * Checks if user is admin
 * @returns Boolean indicating admin status
 */
export const isAdmin = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return false;
    
    const userData = JSON.parse(user);
    // Admin is identified by this specific email
    return userData.email === 'tukeibrian5@gmail.com';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Handles Google Sign In
 * @returns User data object
 */
export const handleGoogleAuth = () => {
  return new Promise<{id: string; name: string; email: string; isNewUser: boolean}>((resolve) => {
    setTimeout(() => {
      const googleUserData = {
        id: generateId(),
        name: 'Google User',
        email: 'user@gmail.com',
      };
      
      // Check if this Google user already exists
      const storedUsers = JSON.parse(localStorage.getItem('userSignups') || '[]');
      const existingUser = storedUsers.find((user: any) => user.email === googleUserData.email);
      
      const isNewUser = !existingUser;
      
      // If new user, add to userSignups
      if (isNewUser) {
        const newGoogleUser = {
          id: googleUserData.id,
          name: googleUserData.name,
          email: googleUserData.email,
          date: new Date().toISOString(),
          loginType: 'google'
        };
        
        storedUsers.push(newGoogleUser);
        localStorage.setItem('userSignups', JSON.stringify(storedUsers));
        localStorage.setItem('user', JSON.stringify(googleUserData));
      } else {
        // Existing user
        localStorage.setItem('user', JSON.stringify({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          profileImage: existingUser.profileImage
        }));
      }
      
      resolve({...googleUserData, isNewUser});
    }, 1500);
  });
};
