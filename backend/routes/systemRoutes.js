const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, admin } = require('../middleware/auth'); // If you want to protect it

// Typically you'd restrict these routes to 'admin' role
// router.use(authenticate, admin);

router.get('/status', systemController.getSystemStatus);
router.get('/logs', systemController.getDeploymentLogs);
router.get('/diagnostics', systemController.getDiagnostics);

module.exports = router;