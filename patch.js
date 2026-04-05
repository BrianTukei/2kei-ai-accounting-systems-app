const fs = require('fs');
let s = fs.readFileSync('src/services/invoiceAI.ts', 'utf8');

const t = \        const { category, type } = categoriseTransaction(safeDesc, debit, credit);
        description: row.description,\;

const n = \        const { category, type } = categoriseTransaction(safeDesc, debit, credit);
        
        return {
            date: row.date,
            description: row.description,`;

if (s.includes(t)) {
    s = s.replace(t, n);
    fs.writeFileSync('src/services/invoiceAI.ts', s);
    console.log("Success");
} else {
    console.log("Could not find exact string. Checking alternative whitespace...");
    // Fallback: Use index offsets to surgically implant `return { date: row.date,`
    
    // Find index of last } before description: 
    const descIdx = s.indexOf('description: row.description,');
    if (descIdx > -1) {
        const insertBefore = "return {\n      date:        row.date,\n      ";
        s = s.substring(0, descIdx) + insertBefore + s.substring(descIdx);
        fs.writeFileSync('src/services/invoiceAI.ts', s);
        console.log("Success with fallback");
    } else {
        console.log("Failed completely.");
    }
}

