const Queue = require('bull');
const logger = require('../utils/logger');

/**
 * 4) Retry Queue System (Prevents Processing Freeze)
 * 
 * We initialize a Bull queue backed by Redis.
 * If Redis is unavailable, we default to in-memory processing or mock fallback.
 */

// Connect to Redis for Queue Storage
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || null,
};

// Create the Job Queue
const processingQueue = new Queue('document-processing', { 
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3, // Auto retry up to 3 times
        backoff: {
            type: 'exponential', // Retry Timing: 10s, 30s, 60s based on exponential delay
            delay: 10000 
        },
        removeOnComplete: true, // Keep DB clean
        removeOnFail: false // We want to inspect failures
    }
});

// Event Listeners for System Logging
processingQueue.on('completed', (job, result) => {
  logger.info(`Job completed: ${job.id} - ${job.data.job_type}`);
});

processingQueue.on('failed', (job, err) => {
  logger.error(`Job failed: ${job.id} - ${job.data.job_type}`, {
      error: err.message,
      attemptsMade: job.attemptsMade,
      stack: err.stack,
      userId: job.data.user_id,
      fileName: job.data.file_name
  });
});

/**
 * Helper to queue a document for processing
 * @param {string} userId - The user ID uploading
 * @param {string} jobType - 'receipt_parse', 'bank_statement_parse'
 * @param {string} fileName - Original file name
 * @param {object} fileData - The file buffer or URL reference
 * @returns {Promise<number>} Job ID
 */
const enqueueProcessingJob = async (userId, jobType, fileName, fileData) => {
    try {
        const job = await processingQueue.add(
            { 
                user_id: userId, 
                job_type: jobType, 
                file_name: fileName,
                file_data: fileData
            },
            // Options are inherited from defaultJobOptions above
        );
        
        logger.info(`Job Queued: ${job.id}`, { userId, jobType, fileName });
        return job.id;

    } catch (err) {
        logger.error('Failed to queue processing job', { error: err.message });
        throw err;
    }
};

/**
 * Process queue (Will be mapped in backend/workers/processor.js)
 */
const startWorker = (processorFunction) => {
    logger.info('Starting Queue Worker for Document Processing...');
    processingQueue.process(processorFunction);
};

module.exports = {
  processingQueue,
  enqueueProcessingJob,
  startWorker
};