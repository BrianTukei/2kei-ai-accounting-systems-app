import fs from 'fs';
let b = fs.readFileSync('src/services/invoiceAI.ts', 'utf8');
const search = 'const { category, type } = categoriseTransaction(safeDesc, debit, credit);';
const index = b.indexOf(search);
const end = b.indexOf('};', index);

if (index > -1) {
  const replaceStr = \const { category, type } = categoriseTransaction(safeDesc, debit, credit);

    return {
      date:        row.date,
      description: row.description,
      debit,
      credit,
      balance:     row.balance ?? null,
      aiCategory:  category,
      aiType:      type,
      isDuplicate,\;
      
  b = b.substring(0, index) + replaceStr + b.substring(end);
  fs.writeFileSync('src/services/invoiceAI.ts', b);
  console.log('saved');
}
