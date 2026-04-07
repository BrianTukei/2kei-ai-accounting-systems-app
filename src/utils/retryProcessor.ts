/**
 * AI Processing Retry Queue
 * ───────────────────────
 * Prevents silent failures and infinite freezing by enforcing
 * timeouts and maximum retry limits across all AI operations.
 */

import { logger } from '../services/loggerService';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  context?: string;
}

export class RetryProcessor {
  /**
   * Executes a promise-returning function with exponential backoff and timeout
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelayMs = options.baseDelayMs ?? 1000;
    const timeoutMs = options.timeoutMs ?? 60000; // 60s timeout by default
    const context = options.context ?? 'AI_PROCESS';

    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          logger.info(`[${context}] Retry attempt ${attempt}/${maxRetries}`);
        }

        // Execute with timeout race
        return await Promise.race([
          operation(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('OPERATION_TIMEOUT')), timeoutMs)
          ),
        ]);
      } catch (error: any) {
        logger.error(`[${context}] Attempt ${attempt} failed: ${error.message}`);
        
        attempt++;
        if (attempt > maxRetries) {
          logger.error(`[${context}] Exhausted all ${maxRetries} retries.`);
          throw new Error(`Processing failed after retries for ${context}: ${error.message}`);
        }

        // Exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    throw new Error('Unreachable output');
  }
}
