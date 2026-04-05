const express = require('express');
const router = express.Router();
const { uploadDocument, getJobStatus, getGlobalMonitoring, parsePreview } = require('../controllers/documentProcessingController');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', requireAuth, upload.single('file'), uploadDocument);
router.get('/job/:jobId', requireAuth, getJobStatus);
router.get('/monitoring', requireAuth, getGlobalMonitoring);

// Real-Time Wizard Parsing Endpoint
router.post('/parse-preview', requireAuth, upload.single('file'), parsePreview);

module.exports = router;

