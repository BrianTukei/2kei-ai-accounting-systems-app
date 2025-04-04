
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollData, PayrollSummary } from '@/types/PayrollData';
import { generateBasePDF } from '@/components/statements/StatementLayout';
import { toast } from 'sonner';

export const generatePayrollPDF = (payrollData: PayrollData[], summary: PayrollSummary) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add a title
  doc.setFontSize(20);
  doc.setTextColor(85, 74, 179); // Purple color
  doc.text('Payroll Statement', 14, 22);
  
  // Add a subtitle with current date
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add a company logo or name
  doc.setFontSize(16);
  doc.text('2KÉI Ledgery', 14, 45);
  
  // Add payroll period if all entries have the same period
  if (payrollData.length > 0 && payrollData.every(entry => 
    entry.payPeriodStart === payrollData[0].payPeriodStart && 
    entry.payPeriodEnd === payrollData[0].payPeriodEnd
  )) {
    doc.setFontSize(11);
    doc.text(`Pay Period: ${payrollData[0].payPeriodStart} to ${payrollData[0].payPeriodEnd}`, 14, 52);
  }
  
  // Add report data as a table
  const tableColumn = [
    "Employee", 
    "ID", 
    "Position", 
    "Base Salary ($)", 
    "OT Hours",
    "Bonus ($)",
    "Net Pay ($)"
  ];
  
  const tableRows = payrollData.map(entry => [
    entry.employeeName,
    entry.employeeId,
    entry.position,
    entry.baseSalary.toFixed(2),
    entry.overtimeHours.toString(),
    entry.bonus.toFixed(2),
    entry.netPay.toFixed(2)
  ]);
  
  // Add the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [155, 135, 245], textColor: 255 }, // Purple color for header
    alternateRowStyles: { fillColor: [240, 244, 249] }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(14);
  doc.setTextColor(85, 74, 179);
  doc.text(`Payroll Summary`, 14, finalY + 15);
  
  // Calculate summary data
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Add summary as a small table
  const summaryData = [
    ['Total Employees:', summary.employeeCount.toString()],
    ['Total Gross Pay:', `$${summary.totalGrossPay.toFixed(2)}`],
    ['Total Deductions:', `$${summary.totalDeductions.toFixed(2)}`],
    ['Total Net Pay:', `$${summary.totalNetPay.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    body: summaryData,
    startY: finalY + 20,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }
    },
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      '2KÉI Ledgery - This report contains confidential payroll information.',
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Save the PDF
  doc.save(`payroll_statement_${new Date().toISOString().split('T')[0]}.pdf`);
  toast.success('Payroll PDF has been generated');
};
