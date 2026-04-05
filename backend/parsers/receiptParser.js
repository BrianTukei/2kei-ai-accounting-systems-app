const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
const fs = require('fs');

/**
 * PRODUCTION RECEIPT OCR PARSER
 * Extracted text relies on Tesseract.js in memory and returns a mapped array matching
 * the database schema for `aia_transactions` so they naturally flow into the core ledger
 * with a lower confidence core than bank imports.
 */
exports.parseReceiptFile = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer) {
            throw new Error('No file buffer provided to receipt parser.');
        }

        logger.info(`Starting OCR process for receipt of type ${mimetype}...`);
        
        // Ensure format is image. In a grander system, PDF buffers go to poppler first.
        if (!mimetype.startsWith('image/')) {
            logger.warn('Non-image given to OCR - attempting anyway, but might fail.');
        }

        // Run OCR on the buffer
        const { data: { text } } = await Tesseract.recognize(
            fileBuffer,
            'eng',
            {
                logger: m => {
                    // We can emit this to a websocket if we wanted real-time UI progress
                    if (m.status === 'recognizing text' && m.progress % 0.2 === 0) {
                       logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        logger.info('OCR Complete. Executing pattern extraction...');
        
        // Extract semantic points out of raw text buffer
        const parsedData = extractFields(text);
        
        // Return an array to comply with `saveTransactionsSafely` expectation
        return [parsedData];

    } catch (error) {
        logger.error('Error in receiptParser:', { error: error.message });
        throw new Error(`Receipt Parsing Failed: ${error.message}`);
    }
};

/**
 * Heuristic extraction map for Receipt data -> Transaction Schema format
 * In V2, we pass `ocrText` directly to an LLM provider and ask for JSON back.
 * We'll use reliable Regex to catch 80% here as a blazing fast fallback.
 */
function extractFields(ocrText) {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let total = 0;
    let dateStr = null;
    let vendor = lines[0] ? lines[0].substring(0, 50) : 'Unknown Vendor';

    // Advanced regex traps for totals like "Total: $12,345.67" or "Balance Due    45.00"
    const totalRegex = /(?:total|amount|sum|due|pay)[\s\:\-\.\$]*((?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?)/i;
    // Captures general mm/dd/yy or yyyy-mm-dd shapes
    const dateRegex = /(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;

    lines.forEach(line => {
        // Find Total
        const totalMatch = line.match(totalRegex);
        if (totalMatch && !total) {
             const cleanTotalStr = totalMatch[1].replace(/,/g, '');
             const pt = parseFloat(cleanTotalStr);
             if(!isNaN(pt) && pt > 0) total = pt;
        }
        
        // Find Date
        const dateMatch = line.match(dateRegex);
        if (dateMatch && !dateStr) {
            dateStr = dateMatch[1];
        }
    });

    let cleanDate;
    try {
        let d = new Date(dateStr);
        if(isNaN(d.getTime())) cleanDate = new Date().toISOString().split('T')[0];
        else cleanDate = d.toISOString().split('T')[0];
    } catch (e) {
        cleanDate = new Date().toISOString().split('T')[0];
    }

    // Default Receipt handling = always an expense (-amount)
    let finalAmount = total > 0 ? -total : 0;

    // Formatting structured for aia_transactions insert
    return {
        date: cleanDate,
        description: `${vendor} Receipt`,
        amount: finalAmount,             
        type: 'expense',
        category: 'office_expenses',  // default
        source: 'receipt_scanner',
        confidence_score: 0.75,       // OCR is inherently less reliable than Bank Import
        raw_text_dump: ocrText        // Can save for manual visual review
    };
}
