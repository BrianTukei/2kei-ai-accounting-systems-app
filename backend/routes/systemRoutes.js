const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, admin } = require('../middleware/auth');

// ⚠️ SECURITY: All system diagnostics endpoints require admin authentication
// These endpoints expose sensitive system information and must be protected
router.use(authenticate, admin);

router.get('/status', systemController.getSystemStatus);
router.get('/logs', systemController.getDeploymentLogs);
router.get('/diagnostics', systemController.getDiagnostics);

module.exports = router;