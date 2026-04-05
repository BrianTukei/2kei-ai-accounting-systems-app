const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');
const { Readable } = require('stream');

/**
 * 7) File Parser Architecture (Bank Statement Parser Pipeline)
 * Upload -> Detect Format -> Parse Rows -> Clean Data -> Validate -> Classify -> Save
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
        } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
             parsedRows = await parseExcel(fileBuffer);
        } else if (mimetype.includes('ofx') || mimetype.includes('qfx')) {
             // parsedRows = parseOFX(fileBuffer);
             throw new Error('OFX parsing module is currently a stub. CSV/Excel supported out of box.');
        } else {
             throw new Error(`Unsupported bank format type: ${mimetype}`);
        }

        // Clean Data
        const cleanedData = cleanData(parsedRows);
        
        // Validate Data
        if (!cleanedData || cleanedData.length === 0) {
            throw new Error('No valid transactions found in bank statement.');
        }
        
        return cleanedData;

    } catch (error) {
        logger.error('Error in bankStatementParser', { error: error.message });
        throw new Error(`Bank Statement Parsing Failed: ${error.message}`);
    }
};

/**
 * Helper to process CSV securely in memory
 * @param {Buffer} buffer 
 * @returns {Promise<Array>}
 */
const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fileContent = buffer.toString('utf-8');

        // Streaming is safer for memory, but string memory is fine for typical < 10MB bank exports
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
               headers[colNumber] = cell.value?.toString().toLowerCase().trim();
           });
       } else {
           // Parse into Object based on headers
           const rowData = {};
           row.eachCell((cell, colNumber) => {
               if (headers[colNumber]) {
                   rowData[headers[colNumber]] = cell.value;
               }
           });
           results.push(rowData);
       }
   });

   return results;
};

/**
 * Normalizes rows across all bank export structures
 * @param {Array} rows 
 * @returns {Array} Clean transactions
 */
const cleanData = (rows) => {
    return rows.map((row, index) => {
       // A robust system tries to find the 'date', 'description'/'payee', 'amount' dynamically
       // The field names in CSV exports vary by bank: 'Date', 'Posted Date', 'Payee', 'Description', 'Amount', 'Credit', 'Debit'
       
       const keys = Object.keys(row).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
       
       let dateStr = row.date || row.posted || row.transactiondate || row[Object.keys(row).find(k => k.toLowerCase().includes('date'))] || null;
       let descStr = row.description || row.payee || row.name || row.memo || row[Object.keys(row).find(k => k.toLowerCase().includes('desc'))] || null;
       let amountStr = row.amount || row[Object.keys(row).find(k => k.toLowerCase().includes('amount'))] || null;

       if (!dateStr || !descStr) return null; // Drop invalid rows

       // Compute amount (Handles Credit / Debit split columns if no main Amount column exists)
       let amount = 0;
       if (amountStr) {
           amount = parseFloat(String(amountStr).replace(/,/g, ''));
       } else {
           let creditStr = row.credit || row[Object.keys(row).find(k => k.toLowerCase() === 'credit')];
           let debitStr = row.debit || row[Object.keys(row).find(k => k.toLowerCase() === 'debit')];
           if (creditStr) amount = parseFloat(String(creditStr).replace(/,/g, ''));
           if (debitStr) amount = -parseFloat(String(debitStr).replace(/,/g, ''));
       }

       return {
           row_index: index,
           date: new Date(dateStr).toISOString().split('T')[0],
           description: descStr.toString().trim(),
           amount: amount,
           type: amount >= 0 ? 'income' : 'expense'
       };
    }).filter(row => row !== null); // Filter out the nulls
};