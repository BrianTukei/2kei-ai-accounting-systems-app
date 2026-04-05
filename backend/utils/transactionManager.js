const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

/**
 * 3) Database Transaction Model (Financial-Safe)
 * 
 * Safely inserts transactions preventing duplicates.
 * In a real distributed PG environment, this either uses a Postgres function (RPC)
 * for true BEGIN...COMMIT or utilizes bulk insert with ON CONFLICT DO NOTHING.
 */
exports.saveTransactionsSafely = async (userId, transactions, source) => {
    if (!supabase) return { success: false, error: 'Database unavailable' };
    
    // 1. Map to strict table schema (aia_transactions)
    const recordsToInsert = transactions.map(tx => ({
        user_id: userId,
        date: tx.date || new Date().toISOString().split('T')[0],
        description: tx.description || 'Unknown Transaction',
        amount: parseFloat(tx.amount || 0),
        type: (tx.amount >= 0) ? 'income' : 'expense',
        category: tx.category || 'Uncategorized',
        source: source || 'unknown_import',
        reference: tx.reference || null,
        status: 'completed', // Or 'review_required' if low confidence
        confidence_score: tx.confidence_score || Math.min(1.0, Math.max(0.0, tx.amount === 0 ? 0.3 : 0.9))
    }));

    if (recordsToInsert.length === 0) {
        logger.info(`No valid transaction records to insert for user ${userId}`);
        return { success: true, count: 0 };
    }

    try {
        // Validation Layer before insertion
        for (const record of recordsToInsert) {
             if (isNaN(record.amount)) {
                 throw new Error(`Transaction validation failed: Invalid amount for [${record.description}]`);
             }
             if (!record.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                 record.date = new Date().toISOString().split('T')[0]; // fallback
             }
        }

        // Bulk insert - Supabase JS wraps this in a single atomic network request.
        // We rely on the UNIQUE(user_id, date, amount, description) constraint 
        // set in the SQL migration to gracefully ignore duplicates.
        const { data, error } = await supabase
            .from('aia_transactions')
            .upsert(recordsToInsert, { 
                onConflict: 'user_id, date, amount, description',
                ignoreDuplicates: true 
            })
            .select('id');

        if (error) {
            logger.error(`Transaction insert failed for ${userId}: ${error.message}`);
            // Explicit Rollback representation
            throw new Error(`Bulk insert failed: ${error.message}`);
        }

        // COMMIT representation
        logger.info(`Successfully saved ${data?.length || 0} unique transactions for user ${userId}`);
        return { success: true, count: data?.length || 0 };

    } catch (err) {
        logger.error(`Failed executing transaction block: ${err.message}`);
        throw err;
    }
};