const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');

// 1. Storage Configuration (Memory mapping avoids slow disk IO before processing)
const storage = multer.memoryStorage();

// 2. Allowed File Types & Mime Type Validation
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/x-ofx', // .ofx
    'application/vnd.intu.qfx', // .qfx
    'application/qif' // .qif
];

const fileFilter = (req, file, cb) => {
    // Check missing file / size
    if (!file) {
        return cb(new Error('No file provided'), false);
    }
    
    // Check explicit mime types
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        logger.warn('Invalid file type upload attempt', { 
            mimetype: file.mimetype, 
            filename: file.originalname,
            userId: req.user?.id 
        });
        cb(new Error(`File type ${file.mimetype} is not supported. Supported types: PDF, JPG, PNG, CSV, Excel, OFX.`), false);
    }
};

// 3. Setup limits
const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
    files: 1, // Process one file at a time per request for better error tracking
};

// 4. Create the final Multer upload instance
const upload = multer({ 
    storage, 
    fileFilter, 
    limits 
});

/**
 * Express Middleware Wrapper for Multer that provides clean API responses on error
 */
const validateUpload = (fieldName = 'file') => {
    return (req, res, next) => {
        const uploader = upload.single(fieldName);

        uploader(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading (e.g., File too large).
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: 'File is too large. Maximum size is 10MB.' });
                }
                return res.status(400).json({ error: err.message });
            } else if (err) {
                // An unknown error occurred, or our custom fileFilter threw an error
                return res.status(400).json({ error: err.message });
            }

            // At this point, upload was successful and req.file is populated.
            // Check if file is completely empty (0 bytes)
            if (req.file && req.file.size === 0) {
                 return res.status(400).json({ error: 'Uploaded file is completely empty (0 bytes).' });
            }

            next();
        });
    };
};

module.exports = {
    validateUpload,
    upload
};