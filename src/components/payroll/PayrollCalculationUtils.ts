
/**
 * Utility functions for payroll calculations
 */
export const calculateGrossAndNetPay = (data: any) => {
  // Fixed Earnings
  const basicSalary = Number(data.basicSalary) || 0;
  const housingAllowance = Number(data.housingAllowance) || 0;
  const transportAllowance = Number(data.transportAllowance) || 0;
  const mealAllowance = Number(data.mealAllowance) || 0;
  const annualBonus = Number(data.annualBonus) || 0;
  const performanceBonus = Number(data.performanceBonus) || 0;
  const commissions = Number(data.commissions) || 0;
  const additionalMonthPay = Number(data.additionalMonthPay) || 0;
  
  // Variable Earnings
  const overtimeHours = Number(data.overtimeHours) || 0;
  const overtimeRate = Number(data.overtimeRate) || 1.5;
  const hourlyRate = basicSalary / 176; // Assuming 22 working days of 8 hours each
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  
  const nightShiftAllowance = Number(data.nightShiftAllowance) || 0;
  const holidayAllowance = Number(data.holidayAllowance) || 0;
  const travelReimbursement = Number(data.travelReimbursement) || 0;
  const medicalReimbursement = Number(data.medicalReimbursement) || 0;
  
  // Benefits (Taxable)
  const companyCar = Number(data.companyCar) || 0;
  const fuelBenefit = Number(data.fuelBenefit) || 0;
  const stockOptions = Number(data.stockOptions) || 0;
  
  // Calculate gross pay
  const grossPay = basicSalary +
    housingAllowance + transportAllowance + mealAllowance +
    annualBonus + performanceBonus + commissions + additionalMonthPay +
    overtimePay + nightShiftAllowance + holidayAllowance +
    travelReimbursement + medicalReimbursement +
    companyCar + fuelBenefit + stockOptions;
    
  // Deductions
  const incomeTaxRate = Number(data.incomeTaxRate) || 0;
  const incomeTax = grossPay * (incomeTaxRate / 100);
  
  const socialSecurityRate = Number(data.socialSecurityRate) || 0;
  const socialSecurity = grossPay * (socialSecurityRate / 100);
  
  const healthInsurance = Number(data.healthInsurance) || 0;
  const employeePension = Number(data.employeePension) || 0;
  const loanRepayments = Number(data.loanRepayments) || 0;
  const unionDues = Number(data.unionDues) || 0;
  const charitableContributions = Number(data.charitableContributions) || 0;
  
  // Calculate total deductions
  const totalDeductions = incomeTax + socialSecurity + healthInsurance +
    employeePension + loanRepayments + unionDues + charitableContributions;
  
  // Calculate net pay
  const netPay = grossPay - totalDeductions;
  
  return { grossPay, netPay };
};

export const createPayrollEntryData = (data: any, selectedEmployee: any, grossPay: number, netPay: number) => {
  const earnings = {
    basicSalary: Number(data.basicSalary),
    allowances: {
      housing: Number(data.housingAllowance),
      transport: Number(data.transportAllowance),
      meal: Number(data.mealAllowance),
    },
    bonuses: {
      annual: Number(data.annualBonus),
      performance: Number(data.performanceBonus),
    },
    commissions: Number(data.commissions),
    additionalMonthPay: Number(data.additionalMonthPay),
    overtime: {
      hours: Number(data.overtimeHours),
      rate: Number(data.overtimeRate),
      amount: Number(data.overtimeHours) * (Number(data.basicSalary) / 176) * Number(data.overtimeRate),
    },
    shiftDifferentials: {
      night: Number(data.nightShiftAllowance),
      holiday: Number(data.holidayAllowance),
    },
    reimbursements: {
      travel: Number(data.travelReimbursement),
      medical: Number(data.medicalReimbursement),
    },
    benefits: {
      companyCar: Number(data.companyCar),
      fuel: Number(data.fuelBenefit),
      stockOptions: Number(data.stockOptions),
      employerPensionContribution: Number(data.employerPensionContribution),
    },
  };
  
  const deductions = {
    incomeTax: grossPay * (Number(data.incomeTaxRate) / 100),
    socialSecurity: grossPay * (Number(data.socialSecurityRate) / 100),
    healthInsurance: Number(data.healthInsurance),
    employeePension: Number(data.employeePension),
    loanRepayments: Number(data.loanRepayments),
    unionDues: Number(data.unionDues),
    charitableContributions: Number(data.charitableContributions),
  };
  
  const employerContributions = {
    employerPension: grossPay * (Number(data.employerPension) / 100),
    workersCompensationInsurance: grossPay * (Number(data.workersCompensation) / 100),
    payrollTaxes: grossPay * (Number(data.payrollTaxes) / 100),
  };
  
  const attendance = {
    daysWorked: Number(data.daysWorked),
    paidLeave: {
      vacation: Number(data.vacationDays),
      sick: Number(data.sickDays),
    },
    unpaidLeave: Number(data.unpaidLeave),
  };
  
  return {
    earnings,
    deductions,
    employerContributions,
    attendance
  };
};
