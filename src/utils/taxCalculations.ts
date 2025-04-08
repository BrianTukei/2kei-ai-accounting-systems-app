
import { CountryTaxConfig, TaxBracket } from '@/types/PayrollData';

// Country-specific tax configurations
export const countryTaxConfigs: { [key: string]: CountryTaxConfig } = {
  'Uganda': {
    name: 'Uganda',
    code: 'UG',
    currency: 'UGX',
    currencySymbol: 'USh',
    incomeTaxBrackets: [
      { min: 0, max: 235000, rate: 0 }, // First 235,000 UGX is tax-free
      { min: 235001, max: 335000, rate: 10 }, // Next 100,000 UGX at 10%
      { min: 335001, max: 410000, rate: 20 }, // Next 75,000 UGX at 20%
      { min: 410001, max: 10000000, rate: 30 }, // Above 410,000 UGX at 30%
      { min: 10000001, rate: 40 } // Above 10,000,000 UGX at 40%
    ],
    socialSecurityRate: {
      employee: 5,
      employer: 10
    },
    hasPayrollTax: true,
    payrollTaxRate: 1,
    hasVAT: true,
    VATRate: 18,
    hasPAYE: true,
    PAYERate: 30,
    hasNSSF: true,
    NSSFRate: {
      employee: 5,
      employer: 10
    }
  },
  'Kenya': {
    name: 'Kenya',
    code: 'KE',
    currency: 'KES',
    currencySymbol: 'KSh',
    incomeTaxBrackets: [
      { min: 0, max: 24000, rate: 10 }, // First 24,000 KES at 10%
      { min: 24001, max: 32333, rate: 25 }, // Next 8,333 KES at 25%
      { min: 32334, max: 500000, rate: 30 }, // Next 467,666 KES at 30%
      { min: 500001, max: 800000, rate: 32.5 }, // Next 300,000 KES at 32.5%
      { min: 800001, rate: 35 } // Above 800,000 KES at 35%
    ],
    socialSecurityRate: {
      employee: 6,
      employer: 6
    },
    healthInsuranceRate: {
      employee: 2.5,
      employer: 2.5
    },
    hasPayrollTax: true,
    payrollTaxRate: 0.5,
    hasVAT: true,
    VATRate: 16,
    hasPAYE: true,
    PAYERate: 30,
    hasNSSF: true,
    NSSFRate: {
      employee: 6,
      employer: 6
    }
  },
  'Nigeria': {
    name: 'Nigeria',
    code: 'NG',
    currency: 'NGN',
    currencySymbol: '₦',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 7 }, // First 300,000 NGN at 7%
      { min: 300001, max: 600000, rate: 11 }, // Next 300,000 NGN at 11%
      { min: 600001, max: 1100000, rate: 15 }, // Next 500,000 NGN at 15%
      { min: 1100001, max: 1600000, rate: 19 }, // Next 500,000 NGN at 19%
      { min: 1600001, max: 3200000, rate: 21 }, // Next 1,600,000 NGN at 21%
      { min: 3200001, rate: 24 } // Above 3,200,000 NGN at 24%
    ],
    socialSecurityRate: {
      employee: 8,
      employer: 10
    },
    hasPayrollTax: true,
    payrollTaxRate: 1,
    hasVAT: true,
    VATRate: 7.5,
    hasPAYE: true,
    PAYERate: 24,
    hasNSSF: false
  }
};

// Calculate progressive income tax
export const calculateProgressiveIncomeTax = (income: number, brackets: TaxBracket[]): number => {
  let tax = 0;
  let remainingIncome = income;

  for (let i = 0; i < brackets.length; i++) {
    const { min, max, rate } = brackets[i];
    
    if (remainingIncome <= 0) break;
    
    if (max === undefined) {
      // This is the highest bracket
      tax += (remainingIncome * rate) / 100;
      break;
    } else {
      // Calculate tax for this bracket
      const taxableInThisBracket = Math.min(remainingIncome, max - min + 1);
      tax += (taxableInThisBracket * rate) / 100;
      remainingIncome -= taxableInThisBracket;
    }
  }

  return tax;
};

// Calculate PAYE (Pay As You Earn) tax
export const calculatePAYE = (grossPay: number, country: string): number => {
  const config = countryTaxConfigs[country];
  if (!config || !config.hasPAYE) return 0;
  
  return (grossPay * config.PAYERate!) / 100;
};

// Calculate NSSF (National Social Security Fund)
export const calculateNSSF = (grossPay: number, country: string, isEmployer: boolean = false): number => {
  const config = countryTaxConfigs[country];
  if (!config || !config.hasNSSF) return 0;
  
  const rate = isEmployer ? config.NSSFRate!.employer : config.NSSFRate!.employee;
  return (grossPay * rate) / 100;
};

// Calculate VAT (Value Added Tax)
export const calculateVAT = (amount: number, country: string): number => {
  const config = countryTaxConfigs[country];
  if (!config || !config.hasVAT) return 0;
  
  return (amount * config.VATRate!) / 100;
};

// Get country config by nationality or default to Uganda
export const getCountryConfig = (nationality: string): CountryTaxConfig => {
  const normalizedNationality = nationality.trim();
  
  for (const [country, config] of Object.entries(countryTaxConfigs)) {
    if (normalizedNationality.toLowerCase() === country.toLowerCase()) {
      return config;
    }
  }
  
  // Default to Uganda if country not found
  return countryTaxConfigs['Uganda'];
};

// Calculate all taxes for an employee
export const calculateAllTaxes = (grossPay: number, employee: { nationality: string }) => {
  const countryConfig = getCountryConfig(employee.nationality);
  
  const incomeTax = calculateProgressiveIncomeTax(grossPay, countryConfig.incomeTaxBrackets);
  const socialSecurity = (grossPay * countryConfig.socialSecurityRate.employee) / 100;
  const PAYE = calculatePAYE(grossPay, countryConfig.name);
  const NSSF = calculateNSSF(grossPay, countryConfig.name);
  const employerNSSF = calculateNSSF(grossPay, countryConfig.name, true);
  
  return {
    incomeTax,
    socialSecurity,
    PAYE,
    NSSF,
    employerNSSF,
    totalDeductions: incomeTax + socialSecurity + PAYE + NSSF,
    country: countryConfig.name,
    currency: countryConfig.currency,
    currencySymbol: countryConfig.currencySymbol
  };
};
