const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateUpload } = require('../middleware/uploadValidation');
const documentProcessingController = require('../controllers/documentProcessingController');

// Protect all routes
router.use(auth);

/**
 * @route POST /api/documents/upload
 * @desc Uploads a document to the parsing queue using financial-safe validation middleware
 */
router.post(
    '/upload',
    // 6) Validation Middleware (Critical Stability Layer)
    // We enforce 10MB limits, strict mime types, and handle 0-byte failures cleanly.
    validateUpload('file'), // Multer middleware handling req.file
    documentProcessingController.uploadDocument // Queue middleware pushing to Bull
);

module.exports = router;