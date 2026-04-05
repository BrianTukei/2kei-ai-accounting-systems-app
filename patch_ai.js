const fs = require('fs');
let fileStr = fs.readFileSync('src/services/invoiceAI.ts', 'utf8');
fileStr = fileStr.replace('      const { category, type } = categoriseTransaction(safeDesc, debit, credit);\r\n        description: row.description,', '      const { category, type } = categoriseTransaction(safeDesc, debit, credit);\r\n  \r\n      return {\r\n        date:        row.date,\r\n        description: row.description,');
fileStr = fileStr.replace('      const { category, type } = categoriseTransaction(safeDesc, debit, credit);\n        description: row.description,', '      const { category, type } = categoriseTransaction(safeDesc, debit, credit);\n  \n      return {\n        date:        row.date,\n        description: row.description,');
fs.writeFileSync('src/services/invoiceAI.ts', fileStr);

