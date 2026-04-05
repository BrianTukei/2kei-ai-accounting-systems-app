const fs = require('fs');
const path = require('path');
const { logSystemEvent, updateJobProgress } = require('../utils/systemLogger');
const { startWorker } = require('../queues/processingQueue');
const logger = require('../utils/logger');
const receiptParser = require('../parsers/receiptParser');
const bankStatementParser = require('../parsers/bankStatementParser');
const { saveTransactionsSafely } = require('../utils/transactionManager');

/**
 * 1) Production Backend Workflow (Worker Processor)
 * Setup to listen to Bull queue and process jobs 
 */

const processorFunction = async (job) => {
    const { user_id, job_type, file_name, file_data } = job.data;
    const startTime = Date.now();
    let retry_count = job.attemptsMade;

    try {
        // Log PARSING START
        await logSystemEvent({
            user_id,
            module: job_type,
            action: 'parsing',
            status: 'processing',
            file_name,
            retry_count
        });

        // 5) Real-Time Progress Tracker -> 40%
        await updateJobProgress(job.id, 'processing', 40);

        let parsedData = null;

        // Route to specific parser
        const fileBuffer = Buffer.from(file_data, 'base64');
        let fileExtArr = file_name.split('.');
        let fileExt = fileExtArr[fileExtArr.length - 1].toLowerCase();
        let mimeMap = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        let mime = mimeMap[fileExt] || 'application/octet-stream';

        if (job_type === 'receipt_parse') {
             logger.info(`Extracting receipt data for ${file_name}`);
             parsedData = await receiptParser.parseReceiptFile(fileBuffer, mime);
        } else if (job_type === 'bank_statement_parse') {
             logger.info(`Extracting bank statement data for ${file_name}`);
             parsedData = await bankStatementParser.parseStatementFile(fileBuffer, mime);
        } else {
             throw new Error(`Unknown job type mapped to worker: ${job_type}`);
        }

        // 5) Real-Time Progress Tracker -> AI Processing 60%
        await updateJobProgress(job.id, 'processing', 60);

        // Here we would call the AI classification logic over the parsedData
        // const classifiedData = await aiClassifier.classify(parsedData);
        await updateJobProgress(job.id, 'processing', 80);

        // 3) Database Transaction Model (Financial-Safe Database save)
        await saveTransactionsSafely(user_id, parsedData, job_type);
        
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        // Log PROCESS COMPLETE
        await logSystemEvent({
            user_id,
            module: job_type,
            action: 'completing',
            status: 'success',
            file_name,
            processing_time_ms: durationMs,
            retry_count
        });

        // 5) Real-Time Progress Tracker -> Completed 100%
        await updateJobProgress(job.id, 'completed', 100, { data: parsedData });

        return { success: true, processed_time: durationMs };

    } catch (err) {
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        // Log PARSING FAILED
        await logSystemEvent({
            user_id,
            module: job_type,
            action: 'parsing',
            status: 'failed',
            error_message: err.message,
            stack_trace: err.stack,
            file_name,
            processing_time_ms: durationMs,
            retry_count
        });

        // 5) Real-Time Progress Tracker -> Failed
        await updateJobProgress(job.id, 'failed', 0, { error: err.message });
        
        // Bubble up error to Bull to trigger exponential backoff retry rule
        throw err;
    }
};

/**
 * Bootstraps the queue listener when the main Node process starts
 */
exports.initWorker = () => {
    startWorker(processorFunction);
};