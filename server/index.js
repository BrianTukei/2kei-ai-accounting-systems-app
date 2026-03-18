const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const adminEmailRoutes = require('./routes/adminEmail');
const adminUserRoutes = require('./routes/adminUsers');

const app = express();
app.use(express.json());

// Auth middleware placeholder
app.use((req, res, next) => {
  // Simulate user for demo
  req.user = { _id: 'adminid', role: 'admin' };
  next();
});

app.use('/api/admin', adminEmailRoutes);
app.use('/api/admin', adminUserRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () => {
    console.log('Server running');
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
