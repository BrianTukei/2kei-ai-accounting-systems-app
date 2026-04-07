const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { requireAuth, restrictTo } = require('../middleware/auth'); // If you want to protect it

// Typically you'd restrict these routes to 'admin' role
// router.use(requireAuth, restrictTo('admin'));

router.get('/status', systemController.getSystemStatus);
router.get('/logs', systemController.getDeploymentLogs);
router.get('/diagnostics', systemController.getDiagnostics);

module.exports = router;