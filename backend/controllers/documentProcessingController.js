const { enqueueProcessingJob } = require('../queues/processingQueue');
const logger = require('../utils/logger');

/**
 * Controller to handle document uploads securely and push to the queue.
 */
exports.uploadDocument = async (req, res) => {
    try {
        const { user } = req;
        const { jobType } = req.body; // e.g., 'receipt_parse', 'bank_statement_parse'
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!['receipt_parse', 'bank_statement_parse'].includes(jobType)) {
            return res.status(400).json({ error: 'Invalid jobType specified.' });
        }

        // Generate immediate Queue Job ID without blocking for extraction
        // Pass the file buffer to the worker (since we're using MemoryStorage)
        const jobId = await enqueueProcessingJob(user.id, jobType, file.originalname, file.buffer.toString('base64'));

        // Return immediately so the frontend isn't frozen while parsing happens
        logger.info(`Document uploaded successfully: ${file.originalname}`, { jobId, userId: user.id });
        
        res.status(202).json({
            success: true,
            job_id: jobId,
            status: 'queued',
            message: `Document queued for ${jobType}. Listen for updates via Realtime.`
        });

    } catch (err) {
        logger.error(`Document upload failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to process document upload' });
    }
};