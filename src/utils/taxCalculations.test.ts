
import { describe, it, expect } from 'vitest';
import { countryTaxConfigs, calculateProgressiveIncomeTax } from './taxCalculations';

describe('calculateProgressiveIncomeTax', () => {
  it('should correctly calculate progressive income tax for Uganda', () => {
    const ugandaConfig = countryTaxConfigs['Uganda'];
    const income = 500000; // Example income
    const expectedTax = 52000;
    const calculatedTax = calculateProgressiveIncomeTax(income, ugandaConfig.incomeTaxBrackets);
    expect(calculatedTax).toBeCloseTo(expectedTax, 2);
  });
});
