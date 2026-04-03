/**
 * Main AI Worker Process
 * ───────────────────────
 * Polls the processing_jobs table to pick up queued tasks.
 * Executes them through the rigorous AI RetryProcessor, guaranteeing 
 * timeout safety and preventing application freezes.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/loggerService';
import { RetryProcessor } from '../utils/retryProcessor';
import { AIReceiptScannerService } from '../services/ai/aiReceiptScannerService';
// Import your bank parser here when ready
// import { BankImportService } from '../services/bankImportService';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const receiptScanner = new AIReceiptScannerService();

export async function runJobWorker() {
  logger.info('[WORKER] Started background AI processing worker...');

  // Simple polling loop
  setInterval(async () => {
    try {
      await processNextJob();
    } catch (err: any) {
      logger.error(`[WORKER_LOOP] Critical worker error: ${err.message}`);
    }
  }, 5000); // Check for new jobs every 5 seconds
}

async function processNextJob() {
  // 1. Fetch the oldest queued or retrying job that is ready
  const { data: jobs, error: fetchError } = await supabase
    .from('processing_jobs')
    .select('*')
    .in('status', ['queued', 'retrying'])
    .lte('next_retry_time', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) throw fetchError;
  if (!jobs || jobs.length === 0) return; // No jobs to process

  const job = jobs[0];

  // 2. Lock the job to prevent other worker instances from picking it up
  const { error: lockError } = await supabase
    .from('processing_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', job.id)
    .eq('status', job.status); // Optimistic locking

  if (lockError) return; // Someone else grabbed it

  logger.info(`[WORKER] Picked up job ${job.id} (${job.job_type})`);

  try {
    // 3. Set parsing progress
    await updateProgress(job.id, 20);

    // 4. Wrap the AI execution in the robust RetryProcessor
    const resultPayload = await RetryProcessor.execute(async () => {
      
      // Simulate file download logic here if needed
      // const fileBuffer = await downloadFromUrl(job.file_url);

      if (job.job_type === 'receipt_parse') {
        await updateProgress(job.id, 50);
        // Replace "Sample Text" with extracted text from the fileBuffer
        return await receiptScanner.extractReceiptData("Sample Text for OCR mapping...");
      } 
      
      else if (job.job_type === 'bank_statement_parse') {
        await updateProgress(job.id, 40);
        // Run strict bank parser
        // return await BankImportService.parse(fileBuffer);
        return { status: 'success', parsed_rows: [] }; // Placeholder
      }

      throw new Error(`Unsupported job type: ${job.job_type}`);
    }, {
      maxRetries: 3,
      timeoutMs: 60000,
      context: `JOB-${job.id}`
    });

    // 5. Check if the output dictates 'review_required'
    const finalStatus = (resultPayload as any).status === 'review_required' 
      ? 'review_required' 
      : 'completed';

    // 6. Save results directly via atomic bounds and mark finished
    await supabase
      .from('processing_jobs')
      .update({
        status: finalStatus,
        progress_percentage: 100,
        result_payload: resultPayload as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    logger.info(`[WORKER] Job ${job.id} completed with status: ${finalStatus}`);

  } catch (error: any) {
    logger.error(`[WORKER] Job ${job.id} failed: ${error.message}`, { processId: job.id, module: job.job_type });
    
    const attempts = job.attempts + 1;
    const isExhausted = attempts >= job.max_attempts;

    // Calculate next retry time (10s, 30s, 60s...)
    const delayMs = 10000 * Math.pow(2, attempts - 1);
    const nextRetryTime = new Date(Date.now() + delayMs);

    await supabase
      .from('processing_jobs')
      .update({
        status: isExhausted ? 'failed' : 'retrying',
        attempts: attempts,
        next_retry_time: nextRetryTime.toISOString(),
        error_payload: { message: error.message },
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}

async function updateProgress(jobId: string, pct: number) {
  await supabase
    .from('processing_jobs')
    .update({ progress_percentage: pct })
    .eq('id', jobId);
}
