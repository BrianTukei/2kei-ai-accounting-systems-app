
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/components/TransactionCard';
import { toast } from 'sonner';

// Base PDF configuration used by all reports
export const configurePdfBase = (doc: jsPDF, title: string) => {
  // Add a title
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  
  // Add a subtitle with current date
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add a company logo or name
  doc.setFontSize(16);
  doc.text('2KÉI Ledgery Accounting', 14, 45);
};

// Add footer to PDF pages
export const addPdfFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      '2KÉI Ledgery Accounting - Confidential financial information',
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25,
      doc.internal.pageSize.height - 10
    );
  }
};

// Generate income-only PDF report
export const generateIncomePDF = (transactions: Transaction[]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  configurePdfBase(doc, 'Monthly Income Report');
  
  // Filter only income transactions
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  // Add report data as a table
  const tableColumn = ["Category", "Description", "Date", "Amount ($)"];
  const tableRows = incomeTransactions.map(item => [
    item.category,
    item.description,
    item.date,
    item.amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  ]);
  
  // Calculate total income
  const totalIncome = incomeTransactions.reduce((sum, item) => sum + item.amount, 0);
  
  // Add the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 55,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 249] }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(12);
  doc.text(`Income Summary`, 14, finalY + 15);
  
  // Add summary data
  doc.setFontSize(10);
  doc.setTextColor(46, 204, 113);
  doc.text(`Total Income: ${totalIncome.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD' 
  })}`, 14, finalY + 25);
  
  doc.setTextColor(0, 0, 0); // Reset text color
  
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('income_report.pdf');
  
  toast.success("Income Report Generated");
  return doc;
};

// Generate expense-only PDF report
export const generateExpensePDF = (transactions: Transaction[]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  configurePdfBase(doc, 'Expense Analysis Report');
  
  // Filter only expense transactions
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Add report data as a table
  const tableColumn = ["Category", "Description", "Date", "Amount ($)"];
  const tableRows = expenseTransactions.map(item => [
    item.category,
    item.description,
    item.date,
    item.amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  ]);
  
  // Calculate total expenses
  const totalExpenses = expenseTransactions.reduce((sum, item) => sum + item.amount, 0);
  
  // Add the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 55,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 249] }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(12);
  doc.text(`Expense Summary`, 14, finalY + 15);
  
  // Add summary data
  doc.setFontSize(10);
  doc.setTextColor(231, 76, 60);
  doc.text(`Total Expenses: ${totalExpenses.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD' 
  })}`, 14, finalY + 25);
  
  doc.setTextColor(0, 0, 0); // Reset text color
  
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('expense_report.pdf');
  
  toast.success("Expense Report Generated");
  return doc;
};

// Generate full financial PDF report
export const generateFinancialPDF = (transactions: Transaction[]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  configurePdfBase(doc, 'Complete Financial Report');
  
  // Add report data as a table
  const tableColumn = ["Category", "Description", "Type", "Amount ($)"];
  const tableRows = transactions.map(item => [
    item.category,
    item.description,
    item.type === 'income' ? 'Income' : 'Expense',
    item.amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
  ]);
  
  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const totalExpenses = transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const netProfit = totalIncome - totalExpenses;
  
  // Add the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 55,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 249] }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(12);
  doc.text(`Summary`, 14, finalY + 15);
  
  // Add summary data
  doc.setFontSize(10);
  doc.text(`Total Income: ${totalIncome.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD' 
  })}`, 14, finalY + 25);
  
  doc.text(`Total Expenses: ${totalExpenses.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })}`, 14, finalY + 35);
  
  // Add net profit with color based on value
  const netProfitText = `Net Profit: ${netProfit.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })}`;
  
  if (netProfit >= 0) {
    doc.setTextColor(34, 197, 94); // Green text for profit
  } else {
    doc.setTextColor(239, 68, 68); // Red text for loss
  }
  
  doc.text(netProfitText, 14, finalY + 45);
  doc.setTextColor(0, 0, 0); // Reset text color
  
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('financial_report.pdf');
  
  toast.success("Complete Financial Report Generated");
  return doc;
};
