/**
 * Generates a unique ID string
 * @returns A unique string ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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
