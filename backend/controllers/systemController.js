const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

exports.getSystemStatus = (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    time: new Date()
  });
};

exports.getDeploymentLogs = (req, res) => {
  try {
    const logPath = path.join(__dirname, '../logs/app.log');
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
    const limit = parseInt(req.query.limit) || 100;
    
    res.json(logs.slice(-limit).map(l => {
      try { return JSON.parse(l); } catch(e) { return { raw: l }; }
    }));
  } catch (error) {
    logger.error('Failed to read logs', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDiagnostics = (req, res) => {
  res.json({
    diagnostics: {
      dbStatus: 'connected', // Mock for now, would ping real DB
      redisStatus: 'connected',
      storageUsage: '50%'
    }
  });
};