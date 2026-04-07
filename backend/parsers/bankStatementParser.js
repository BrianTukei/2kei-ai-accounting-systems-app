const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');
const { categorizeTransaction } = require('../services/aiService');

/**
 * PRODUCTION BANK STATEMENT PARSER
 * Decodes CSV, Excel, and PDF files securely in memory and normalizes bank transactions
 * mapped to the new enterprise SQL schema (aia_transactions).
 */

exports.parseStatementFile = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer) {
            throw new Error('No file buffer provided to bank statement parser.');
        }
        
        let parsedRows = [];

        logger.info(`Starting bank statement parser for format: ${mimetype}`);

        if (mimetype === 'text/csv' || mimetype === 'application/csv') {
             parsedRows = await parseCSV(fileBuffer);
        } else if (mimetype.includes('excel') || mimetype.includes('spreadsheetml')) {
             parsedRows = await parseExcel(fileBuffer);
        } else if (mimetype === 'application/pdf') {
             parsedRows = await parsePDF(fileBuffer);
        } else if (mimetype.includes('ofx') || mimetype.includes('qfx')) {
             throw new Error('OFX parsing module is currently a stub. CSV/Excel/PDF supported out of box.');
        } else {
             throw new Error(`Unsupported bank format type: ${mimetype}`);
        }

        // Clean Data
        const cleanedData = cleanData(parsedRows);
        
        // Validate Data
        if (!cleanedData || cleanedData.length === 0) {
            throw new Error('No valid transactions found in bank statement. Check if headers like Date, Description, Amount exist.');
        }
        
        // AI Categorization for all
        for (const t of cleanedData) {
           const aiResult = await categorizeTransaction(t.description, t.amount);
           if(aiResult && aiResult.category) {
               t.category = aiResult.category;
           } else {
               t.category = categorizeTransactionFallback(t.description);
           }
        }
        
        return cleanedData;

    } catch (error) {
        logger.error('Error in bankStatementParser', { error: error.message });
        throw new Error(`Bank Statement Parsing Failed: ${error.message}`);
    }
};

/**
 * Fallback Manual Categorization
 */
function categorizeTransactionFallback(description) {
    if(!description) return "Other";
    const text = String(description).toLowerCase();
    if (text.includes("fuel") || text.includes("gas") || text.includes("petrol")) return "Travel";
    if (text.includes("restaurant") || text.includes("eat") || text.includes("food")) return "Meals";
    if (text.includes("rent") || text.includes("lease")) return "Rent";
    if (text.includes("salary") || text.includes("payroll")) return "Payroll";
    if (text.includes("electricity") || text.includes("water") || text.includes("pg&e")) return "Utilities";
    if (text.includes("software") || text.includes("aws") || text.includes("google") || text.includes("itunes")) return "Software";
    if (text.includes("office") || text.includes("staples")) return "Office Supplies";
    if (text.includes("marketing") || text.includes("facebook") || text.includes("adwords")) return "Marketing";
    return "Other";
}

/**
 * Handle basic unstructured PDF Statements parsing lines manually.
 */
const parsePDF = async (buffer) => {
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n').filter(l => l.trim().length > 0);
    const results = [];
    
    const dateRegex = /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/;
    const amountRegex = /(-?\$?[\d,]+\.\d{2})$/;

    lines.forEach(line => {
        let dateMatch = line.match(dateRegex);
        let amountMatch = line.match(amountRegex);
        
        if (dateMatch && amountMatch) {
            let desc = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
            results.push({
                date: dateMatch[0],
                description: desc,
                amount: amountMatch[0]
            });
        }
    });
    
    return results;
};

/**
 * Helper to process CSV securely in memory
 * @param {Buffer} buffer 
 * @returns {Promise<Array>}
 */
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const fileContent = buffer.toString('utf-8');

        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: function(parsed) {
                resolve(parsed.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
};

/**
 * Helper to process Excel securely in memory
 * @param {Buffer} buffer
 * @returns {Promise<Array>}
 */
const parseExcel = async (buffer) => {
   const workbook = new ExcelJS.Workbook();
   await workbook.xlsx.load(buffer);
   
   const worksheet = workbook.worksheets[0]; // grab first sheet
   const results = [];
   const headers = [];

   worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
       // Assume first row is headers
       if (rowNumber === 1) {
           row.eachCell((cell, colNumber) => {
               headers[colNumber] = cell.value?.toString().toLowerCase().trim() || `col_${colNumber}`;
           });
       } else {
           // Parse into Object based on headers
           const rowData = {};
           row.eachCell((cell, colNumber) => {
               if (headers[colNumber]) {
                   // Clean up dates if they come as raw ISODates in JS
                   rowData[headers[colNumber]] = cell.type === ExcelJS.ValueType.Date ? cell.value.toISOString() : cell.value;
               }
           });
           results.push(rowData);
       }
   });

   return results;
};

/**
 * Normalizes rows across all bank export structures and maps them straight into
 * the DB-ready aia_transactions model shape.
 * @param {Array} rows 
 * @returns {Array} Clean transactions
 */
const cleanData = (rows) => {
    return rows.map((row, index) => {
       const keys = Object.keys(row);
       const rowMapping = {};
       
       // Build lowercase unspaced map to find column names loosely
       keys.forEach(k => {
           rowMapping[k.toLowerCase().replace(/[^a-z]/g, '')] = row[k];
       });
       
       let dateStr = rowMapping.date || rowMapping.transactiondate || rowMapping.postingdate || rowMapping.posteddate || null;
       let descStr = rowMapping.description || rowMapping.payee || rowMapping.name || rowMapping.memo || rowMapping.particulars || null;
       let amountStr = rowMapping.amount || rowMapping.transactionamount || null;

       if (!dateStr || !descStr) return null; // Drop invalid header/footer rows

       // Compute amount (Handles Credit / Debit split columns if no main Amount column exists)
       let amount = 0;
       if (amountStr) {
           amount = parseFloat(String(amountStr).replace(/[$,]/g, ''));
       } else {
           let creditStr = rowMapping.credit || rowMapping.deposit || rowMapping.moneyin;
           let debitStr = rowMapping.debit || rowMapping.withdrawal || rowMapping.moneyout;
           
           if (creditStr) amount = parseFloat(String(creditStr).replace(/[$,]/g, ''));
           // Convert debit columns to negative values
           if (debitStr) {
               const debitFloat = parseFloat(String(debitStr).replace(/[$,]/g, ''));
               amount = -Math.abs(debitFloat);
           }
       }
       
       if (isNaN(amount) || amount === 0) return null; // Safety check
       
       // Fallback Date parser
       let cleanDateStr;
       try {
           let d = new Date(dateStr);
           if(isNaN(d.getTime())) cleanDateStr = new Date().toISOString().split('T')[0];
           else cleanDateStr = d.toISOString().split('T')[0];
       } catch (e) {
           cleanDateStr = new Date().toISOString().split('T')[0];
       }

       return {
           date: cleanDateStr, // YYYY-MM-DD
           description: descStr.toString().trim(),
           amount: amount,
           type: amount >= 0 ? 'income' : 'expense',
           category: 'Uncategorized', // AI classification stage updates this
           source: 'bank_import',
           confidence_score: 1.00 // Direct import -> absolute truth source
       };
    }).filter(row => row !== null); // Filter out the nulls
};