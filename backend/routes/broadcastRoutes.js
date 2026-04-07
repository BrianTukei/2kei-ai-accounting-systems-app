const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');
const broadcastController = require('../controllers/broadcastController');

// All broadcast routes require admin authentication
router.use(admin);

// GET /api/admin/broadcasts
router.get('/', broadcastController.getBroadcasts);

// GET /api/admin/broadcasts/analytics
router.get('/analytics', broadcastController.getAnalytics);

// GET /api/admin/broadcasts/recipients
router.get('/recipients', broadcastController.getRecipients);

// POST /api/admin/broadcasts
router.post('/', broadcastController.createBroadcast);

// PUT /api/admin/broadcasts/:id
router.put('/:id', broadcastController.updateBroadcast);

// DELETE /api/admin/broadcasts/:id
router.delete('/:id', broadcastController.deleteBroadcast);

// POST /api/admin/broadcasts/:id/test
router.post('/:id/test', broadcastController.sendTestBroadcast);

// POST /api/admin/broadcasts/:id/send
router.post('/:id/send', broadcastController.sendBroadcast);

module.exports = router;