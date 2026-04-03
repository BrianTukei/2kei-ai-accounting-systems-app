/**
 * Job Queue Service
 * ─────────────────
 * Handles adding new file processing tasks to the database queue
 * and retrieving their real-time statuses.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './loggerService';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface EnqueueOptions {
  userId: string;
  jobType: 'receipt_parse' | 'bank_statement_parse';
  fileName: string;
  fileUrl: string;
}

export const JobQueueService = {
  /**
   * Pushes a new processing task into the queue.
   */
  async enqueueJob(options: EnqueueOptions) {
    logger.info(`[QUEUE] Enqueuing job: ${options.jobType} for user ${options.userId}`, { module: 'QUEUE' });

    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        user_id: options.userId,
        job_type: options.jobType,
        file_name: options.fileName,
        file_url: options.fileUrl,
        status: 'queued',
        progress_percentage: 0,
        attempts: 0,
      })
      .select('id, status, progress_percentage')
      .single();

    if (error) {
      logger.error(`[QUEUE] Failed to enqueue job`, { module: 'QUEUE', payload: error });
      throw new Error(`Queue error: ${error.message}`);
    }

    return data;
  },

  /**
   * Retrieves the current status of a job for frontend real-time tracking
   */
  async getJobStatus(jobId: string) {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('id, status, progress_percentage, result_payload, error_payload')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  }
};
