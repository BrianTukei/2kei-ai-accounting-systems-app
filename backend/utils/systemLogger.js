const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

/**
 * 2) Error Logging Schema (Production Standard)
 * 
 * Helper functions to log system events and errors
 * Always log: UPLOAD SUCCESS, FILE VALIDATED, PARSING START, PARSING COMPLETE, 
 * AI PROCESS START, AI PROCESS COMPLETE, DATABASE SAVE SUCCESS, PROCESS COMPLETE
 */

/**
 * Log an event to the system_logs table
 * @param {object} logData 
 * @param {string} logData.user_id (UUID)
 * @param {string} logData.module - 'bank_import', 'receipt_scanner'
 * @param {string} logData.action - 'parsing', 'validating', 'extracting'
 * @param {string} logData.status - 'success', 'failed', 'processing'
 * @param {string} logData.error_message (optional)
 * @param {string} logData.stack_trace (optional)
 * @param {string} logData.file_name (optional)
 * @param {number} logData.processing_time_ms (optional)
 * @param {number} logData.retry_count (optional Default 0)
 */
exports.logSystemEvent = async (logData) => {
    // 1. Always log to stdout/file for container visibility
    if (logData.status === 'failed') {
        logger.error(`[${logData.module}] ${logData.action} failed: ${logData.error_message}`, logData);
    } else {
        logger.info(`[${logData.module}] ${logData.action} - ${logData.status}`, logData);
    }
    
    // 2. If Supabase is connected, record for dashboard tracking / analytics
    if (!supabase) return;
    
    try {
        const { error } = await supabase
            .from('system_logs')
            .insert([{
                user_id: logData.user_id,
                module: logData.module,
                action: logData.action,
                status: logData.status,
                error_message: logData.error_message || null,
                stack_trace: logData.stack_trace || null,
                file_name: logData.file_name || null,
                processing_time_ms: logData.processing_time_ms || null,
                retry_count: logData.retry_count || 0
            }]);

        if (error) {
            // DB write failed, do not crash but log it
            logger.error(`Failed to insert system log: ${error.message}`);
        }
    } catch (err) {
        logger.error(`Exception writing system log: ${err.message}`);
    }
};

/**
 * 5) Real-Time Progress Tracker
 * Update the tracked processing_job status in database. 
 * Realtime subscription on the frontend will capture this update automatically (Supabase generic realtime).
 */
exports.updateJobProgress = async (jobId, status, percentage, payload = null) => {
    if (!supabase || !jobId) return;

    try {
        const updateData = {
           status, // 'queued', 'processing', 'retrying', 'completed', 'failed'
           progress_percentage: percentage
        };
        
        if (payload && status === 'completed') updateData.result_payload = payload;
        if (payload && status === 'failed') updateData.error_payload = payload;

        const { error } = await supabase
            .from('processing_jobs')
            .update(updateData)
            .eq('id', jobId);

        if (error) {
            logger.warn(`Failed to update job progress for ${jobId}: ${error.message}`);
        }
    } catch (err) {
        logger.error(`Exception updating job progress: ${err.message}`);
    }
};