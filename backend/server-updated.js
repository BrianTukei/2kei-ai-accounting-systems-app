const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const subscriptionRoutes = require('./routes/subscription');
const forexRoutes = require('./routes/forex');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin'); // Add admin routes

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes); // Add admin routes

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
