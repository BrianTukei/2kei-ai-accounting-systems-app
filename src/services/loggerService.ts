/**
 * Logger Service
 * ──────────────
 * Unified logging structure for the AI Engine. Links to the Error Logging Schema.
 */

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
    // Integration point: Forward to DataDog / Winston / Supabase logs
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  },

  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
    
    // Save to Database Error Log Schema
    if (meta?.processId) {
      logToDatabase({
        processId: meta.processId,
        module: meta.module || 'UNKNOWN',
        errorType: meta.errorType || 'SYSTEM_ERROR',
        message: message,
        payload: meta.payload
      }).catch(console.error);
    }
  }
};

async function logToDatabase(errorData: any) {
  // Replace with actual Supabase DB call when integrated
  // supabase.from('system_error_logs').insert(errorData);
}
