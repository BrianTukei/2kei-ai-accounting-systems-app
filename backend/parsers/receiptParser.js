const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 7) File Parser Architecture (Receipt Parser Pipeline)
 * Upload -> OCR -> Line Detection -> Field Mapping -> Validation -> Format
 */
exports.parseReceiptFile = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer) {
            throw new Error('No file buffer provided to receipt parser.');
        }

        // For Tesseract.js in memory, we can pass a Buffer if it's an image
        // If it's a PDF, we might need a different approach (like pdfjs to extract text or image first)
        // For simplicity, we will assume it's an image. If it's PDF, we'd add a converter layer.
        
        logger.info('Starting OCR process for receipt...');
        
        // Run OCR
        const { data: { text } } = await Tesseract.recognize(
            fileBuffer,
            'eng',
            {
                logger: m => {
                    // Optional: could log progress if needed
                    // logger.debug(`OCR Progress: ${m.status} - ${Math.round(m.progress * 100)}%`);
                }
            }
        );

        logger.info('OCR Complete. Extracting fields...');
        
        // Basic Regex and Heuristic Field Extraction (Mocking AI part here, or preparing data for AI)
        const parsedData = extractFields(text);
        
        return parsedData;

    } catch (error) {
        logger.error('Error in receiptParser', { error: error.message });
        throw new Error(`Receipt Parsing Failed: ${error.message}`);
    }
};

/**
 * Heuristic fallback extraction
 * Usually, you'd pass the 'text' to an LLM classifier here, 
 * but having a regex fallback is great for stability.
 */
function extractFields(ocrText) {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let total = 0;
    let date = null;
    let vendor = lines[0] || 'Unknown Vendor'; // top line is often vendor

    // Regex for basic extraction
    const totalRegex = /(?:total|amount|sum|due)[\s]*[:\-]?[\s]*\$?([\d,]+\.\d{2})/i;
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

    lines.forEach(line => {
        // Find Total
        const totalMatch = line.match(totalRegex);
        if (totalMatch && !total) {
            total = parseFloat(totalMatch[1].replace(',', ''));
        }
        
        // Find Date
        const dateMatch = line.match(dateRegex);
        if (dateMatch && !date) {
            date = dateMatch[1];
        }
    });
    
    // In a real production system, this data gets sent to "AI Classifier" step
    // to structure it perfectly.
    return {
        vendor,
        date: date || new Date().toISOString().split('T')[0],
        total: total || 0,
        raw_text: ocrText
    };
}
