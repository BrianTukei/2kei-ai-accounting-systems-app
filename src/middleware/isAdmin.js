const isAdmin = (req, res, next) => {
  // Check if user is authenticated and has admin role
  // This is a mock implementation - replace with actual authentication logic
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

module.exports = isAdmin;
