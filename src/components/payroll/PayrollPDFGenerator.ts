
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollData, PayrollSummary } from '@/types/PayrollData';
import { toast } from 'sonner';
import { getLogo128 } from '@/utils/pdfLogo';
import { getStoredCurrencySymbol } from '@/components/statements/StatementLayout';

export const generatePayrollPDF = async (payrollData: PayrollData[], summary: PayrollSummary) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add logo
  let startY = 22;
  try {
    const logoDataUrl = await getLogo128();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 18, 18);
      startY = 14;
    }
  } catch { /* continue without logo */ }
  
  // Add company name beside logo
  doc.setFontSize(16);
  doc.setTextColor(85, 74, 179);
  doc.text('2K AI Accounting Systems', 36, startY + 6);
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(85, 74, 179);
  doc.text('Payroll Statement', 14, 38);
  
  // Add date
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 46);
  
  // Get the common currency if all entries use the same one
  const commonCurrency = payrollData.length > 0 && 
    payrollData.every(entry => entry.currency === payrollData[0].currency)
      ? payrollData[0].currency
      : '';
  
  // Add payroll period if all entries have the same period
  if (payrollData.length > 0 && payrollData.every(entry => 
    entry.payPeriodStart === payrollData[0].payPeriodStart && 
    entry.payPeriodEnd === payrollData[0].payPeriodEnd
  )) {
    doc.setFontSize(11);
    doc.text(`Pay Period: ${payrollData[0].payPeriodStart} to ${payrollData[0].payPeriodEnd}`, 14, 54);
  }
  
  // Add report data as a table
  const tableColumn = [
    "Employee", 
    "Position", 
    "Department", 
    `Gross Pay${commonCurrency ? ` (${commonCurrency})` : ''}`, 
    `Deductions${commonCurrency ? ` (${commonCurrency})` : ''}`,
    `Net Pay${commonCurrency ? ` (${commonCurrency})` : ''}`
  ];
  
  const tableRows = payrollData.map(entry => {
    // Calculate total deductions
    const totalDeductions = 
      entry.deductions.incomeTax + 
      entry.deductions.socialSecurity + 
      (entry.deductions.healthInsurance || 0) + 
      (entry.deductions.employeePension || 0) + 
      (entry.deductions.unionDues || 0) + 
      (entry.deductions.loanRepayments || 0) + 
      (entry.deductions.charitableContributions || 0);
    
    return [
      `${entry.employee.firstName} ${entry.employee.lastName}`,
      entry.employee.jobTitle,
      entry.employee.department,
      entry.grossPay.toFixed(2),
      totalDeductions.toFixed(2),
      entry.netPay.toFixed(2)
    ];
  });
  
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
  const fallbackSymbol = commonCurrency || getStoredCurrencySymbol();
  const summaryData = [
    ['Total Employees:', summary.employeeCount.toString()],
    ['Total Gross Pay:', `${fallbackSymbol}${summary.totalGrossPay.toFixed(2)}`],
    ['Total Deductions:', `${fallbackSymbol}${summary.totalDeductions.toFixed(2)}`],
    ['Total Net Pay:', `${fallbackSymbol}${summary.totalNetPay.toFixed(2)}`]
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
      '2K AI Accounting Systems - This report contains confidential payroll information.',
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

// Function to generate individual employee payslip
export const generatePayslipPDF = async (payrollData: PayrollData) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const employee = payrollData.employee;
  
  // Add logo
  let headerStartY = 22;
  try {
    const logoDataUrl = await getLogo128();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 140, 10, 16, 16);
      headerStartY = 14;
    }
  } catch { /* continue without logo */ }
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(85, 74, 179);
  doc.text('Employee Payslip', 14, 22);
  
  // Add a subtitle with current date
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Pay Period: ${payrollData.payPeriodStart} to ${payrollData.payPeriodEnd}`, 14, 30);
  doc.text(`Payment Date: ${payrollData.paymentDate}`, 14, 36);
  
  // Add a company logo or name
  doc.setFontSize(16);
  doc.text('2K AI Accounting Systems', 140, 22);
  
  // Add employee information section
  doc.setFontSize(12);
  doc.setTextColor(85, 74, 179);
  doc.text('Employee Information', 14, 50);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Employee details table
  const employeeData = [
    ['Employee Name:', `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`],
    ['Employee ID:', employee.employeeId],
    ['Position:', employee.jobTitle],
    ['Department:', employee.department],
    ['Employment Type:', employee.employmentType.replace('-', ' ')],
    ['TIN:', employee.taxIdentificationNumber],
  ];
  
  autoTable(doc, {
    body: employeeData,
    startY: 55,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 }
    },
  });
  
  // Add earnings section
  doc.setFontSize(12);
  doc.setTextColor(85, 74, 179);
  doc.text('Earnings', 14, (doc as any).lastAutoTable.finalY + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Prepare earnings data
  const earningsData: string[][] = [];
  
  // Basic Salary
  earningsData.push(['Basic Salary:', `${payrollData.currency} ${payrollData.earnings.basicSalary.toFixed(2)}`]);
  
  // Allowances
  if (payrollData.earnings.allowances) {
    if (payrollData.earnings.allowances.housing) {
      earningsData.push(['Housing Allowance:', `${payrollData.currency} ${payrollData.earnings.allowances.housing.toFixed(2)}`]);
    }
    if (payrollData.earnings.allowances.transport) {
      earningsData.push(['Transport Allowance:', `${payrollData.currency} ${payrollData.earnings.allowances.transport.toFixed(2)}`]);
    }
    if (payrollData.earnings.allowances.meal) {
      earningsData.push(['Meal Allowance:', `${payrollData.currency} ${payrollData.earnings.allowances.meal.toFixed(2)}`]);
    }
  }
  
  // Bonuses
  if (payrollData.earnings.bonuses) {
    if (payrollData.earnings.bonuses.annual) {
      earningsData.push(['Annual Bonus:', `${payrollData.currency} ${payrollData.earnings.bonuses.annual.toFixed(2)}`]);
    }
    if (payrollData.earnings.bonuses.performance) {
      earningsData.push(['Performance Bonus:', `${payrollData.currency} ${payrollData.earnings.bonuses.performance.toFixed(2)}`]);
    }
  }
  
  // Commissions
  if (payrollData.earnings.commissions) {
    earningsData.push(['Commissions:', `${payrollData.currency} ${payrollData.earnings.commissions.toFixed(2)}`]);
  }
  
  // 13th/14th Month Pay
  if (payrollData.earnings.additionalMonthPay) {
    earningsData.push(['Additional Month Pay:', `${payrollData.currency} ${payrollData.earnings.additionalMonthPay.toFixed(2)}`]);
  }
  
  // Overtime
  if (payrollData.earnings.overtime && payrollData.earnings.overtime.hours > 0) {
    earningsData.push([`Overtime (${payrollData.earnings.overtime.hours} hrs @ ${payrollData.earnings.overtime.rate}x):`, 
      `${payrollData.currency} ${(payrollData.earnings.overtime.amount || 0).toFixed(2)}`]);
  }
  
  // Shift Differentials
  if (payrollData.earnings.shiftDifferentials) {
    if (payrollData.earnings.shiftDifferentials.night) {
      earningsData.push(['Night Shift Allowance:', `${payrollData.currency} ${payrollData.earnings.shiftDifferentials.night.toFixed(2)}`]);
    }
    if (payrollData.earnings.shiftDifferentials.holiday) {
      earningsData.push(['Holiday Allowance:', `${payrollData.currency} ${payrollData.earnings.shiftDifferentials.holiday.toFixed(2)}`]);
    }
  }
  
  // Reimbursements
  if (payrollData.earnings.reimbursements) {
    if (payrollData.earnings.reimbursements.travel) {
      earningsData.push(['Travel Reimbursement:', `${payrollData.currency} ${payrollData.earnings.reimbursements.travel.toFixed(2)}`]);
    }
    if (payrollData.earnings.reimbursements.medical) {
      earningsData.push(['Medical Reimbursement:', `${payrollData.currency} ${payrollData.earnings.reimbursements.medical.toFixed(2)}`]);
    }
  }
  
  // Benefits
  if (payrollData.earnings.benefits) {
    if (payrollData.earnings.benefits.companyCar) {
      earningsData.push(['Company Car:', `${payrollData.currency} ${payrollData.earnings.benefits.companyCar.toFixed(2)}`]);
    }
    if (payrollData.earnings.benefits.fuel) {
      earningsData.push(['Fuel Benefit:', `${payrollData.currency} ${payrollData.earnings.benefits.fuel.toFixed(2)}`]);
    }
    if (payrollData.earnings.benefits.stockOptions) {
      earningsData.push(['Stock Options:', `${payrollData.currency} ${payrollData.earnings.benefits.stockOptions.toFixed(2)}`]);
    }
  }
  
  // Gross Pay
  earningsData.push(['Gross Pay:', `${payrollData.currency} ${payrollData.grossPay.toFixed(2)}`]);
  
  // Add the earnings table
  autoTable(doc, {
    body: earningsData,
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'right', cellWidth: 60 }
    },
  });
  
  // Add deductions section
  doc.setFontSize(12);
  doc.setTextColor(85, 74, 179);
  doc.text('Deductions', 14, (doc as any).lastAutoTable.finalY + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Prepare deductions data
  const deductionsData: string[][] = [];
  
  // Income Tax
  deductionsData.push(['Income Tax:', `${payrollData.currency} ${payrollData.deductions.incomeTax.toFixed(2)}`]);
  
  // Social Security
  deductionsData.push(['Social Security:', `${payrollData.currency} ${payrollData.deductions.socialSecurity.toFixed(2)}`]);
  
  // Health Insurance
  if (payrollData.deductions.healthInsurance) {
    deductionsData.push(['Health Insurance:', `${payrollData.currency} ${payrollData.deductions.healthInsurance.toFixed(2)}`]);
  }
  
  // Employee Pension
  if (payrollData.deductions.employeePension) {
    deductionsData.push(['Employee Pension:', `${payrollData.currency} ${payrollData.deductions.employeePension.toFixed(2)}`]);
  }
  
  // Loan Repayments
  if (payrollData.deductions.loanRepayments) {
    deductionsData.push(['Loan Repayments:', `${payrollData.currency} ${payrollData.deductions.loanRepayments.toFixed(2)}`]);
  }
  
  // Union Dues
  if (payrollData.deductions.unionDues) {
    deductionsData.push(['Union Dues:', `${payrollData.currency} ${payrollData.deductions.unionDues.toFixed(2)}`]);
  }
  
  // Charitable Contributions
  if (payrollData.deductions.charitableContributions) {
    deductionsData.push(['Charitable Contributions:', `${payrollData.currency} ${payrollData.deductions.charitableContributions.toFixed(2)}`]);
  }
  
  // Total Deductions
  const totalDeductions = 
    payrollData.deductions.incomeTax + 
    payrollData.deductions.socialSecurity + 
    (payrollData.deductions.healthInsurance || 0) + 
    (payrollData.deductions.employeePension || 0) + 
    (payrollData.deductions.unionDues || 0) + 
    (payrollData.deductions.loanRepayments || 0) + 
    (payrollData.deductions.charitableContributions || 0);
    
  deductionsData.push(['Total Deductions:', `${payrollData.currency} ${totalDeductions.toFixed(2)}`]);
  
  // Add the deductions table
  autoTable(doc, {
    body: deductionsData,
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'right', cellWidth: 60 }
    },
  });
  
  // Add net pay section
  doc.setFontSize(12);
  doc.setTextColor(85, 74, 179);
  doc.text('Payment Summary', 14, (doc as any).lastAutoTable.finalY + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Prepare net pay data
  const netPayData = [
    ['Net Pay:', `${payrollData.currency} ${payrollData.netPay.toFixed(2)}`],
    ['Payment Method:', payrollData.paymentMethod.replace('_', ' ')]
  ];
  
  // Add bank details if available
  if (employee.bankDetails && employee.bankDetails.bankName) {
    netPayData.push(['Bank Name:', employee.bankDetails.bankName]);
    netPayData.push(['Account Number:', employee.bankDetails.accountNumber]);
    if (employee.bankDetails.branchCode) {
      netPayData.push(['Branch Code:', employee.bankDetails.branchCode]);
    }
  }
  
  // Add the net pay table
  autoTable(doc, {
    body: netPayData,
    startY: (doc as any).lastAutoTable.finalY + 20,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { cellWidth: 60 }
    },
  });
  
  // Add notes section if available
  if (payrollData.notes) {
    doc.setFontSize(12);
    doc.setTextColor(85, 74, 179);
    doc.text('Notes', 14, (doc as any).lastAutoTable.finalY + 15);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(payrollData.notes, 14, (doc as any).lastAutoTable.finalY + 25);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      '2K AI Accounting Systems - This document contains confidential payroll information.',
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
  const fileName = `payslip_${employee.firstName}_${employee.lastName}_${payrollData.payPeriodEnd}.pdf`;
  doc.save(fileName);
  toast.success(`Payslip for ${employee.firstName} ${employee.lastName} has been generated`);
};
