const fs = require('fs');
const content = const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
const { extractReceiptData } = require('../services/aiService');

exports.parseReceiptFile = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer) {
            throw new Error('No file buffer provided to receipt parser.');
        }

        logger.info('Starting OCR process for receipt...');
        
        const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
        logger.info('OCR Complete. Executing AI extraction...');
        
        const aiResult = await extractReceiptData(text);
        if (aiResult) {
            return [{
                date: aiResult.date || new Date(),
                description: aiResult.vendor || 'Unknown Receipt',
                amount: aiResult.total || 0,
                type: 'expense',
                confidenceScore: 0.9,
                source: 'ocr_receipt'
            }];
        }

        const parsedData = extractFields(text);
        return [parsedData];

    } catch (error) {
        logger.error('Error in receiptParser:', { error: error.message });
        throw new Error('Receipt Parsing Failed');
    }
};

function extractFields(ocrText) {
    const lines = ocrText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let total = 0;
    let dateStr = null;
    let vendor = lines[0] ? lines[0].substring(0, 50) : 'Unknown Vendor';

    const totalRegex = /(?:total|amount|sum|due|pay)[\\s\\:\\-\\.\\$]*((?:\\d{1,3}(?:,\\d{3})*|\\d+)(?:\\.\\d{2})?)/i;
    const dateRegex = /(\\d{1,4}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})/;

    lines.forEach(line => {
        const tMatch = line.match(totalRegex);
        if (tMatch && tMatch[1]) {
            const parsed = parseFloat(tMatch[1].replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > total) total = parsed;
        }

        const dMatch = line.match(dateRegex);
        if (dMatch && !dateStr) {
            dateStr = dMatch[1];
        }
    });

    let transDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(transDate.getTime())) transDate = new Date();

    return {
        date: transDate,
        amount: total,
        type: 'expense',
        description: vendor,
        source: 'ocr_receipt',
        confidenceScore: 0.75,
        categorization: 'Review Needed'
    };
};
fs.writeFileSync('backend/parsers/receiptParser.js', content);
