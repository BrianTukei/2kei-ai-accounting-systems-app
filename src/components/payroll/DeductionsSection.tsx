
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { getCountryConfig } from '@/utils/taxCalculations';

interface DeductionsSectionProps {
  form: UseFormReturn<any>;
}

export default function DeductionsSection({ form }: DeductionsSectionProps) {
  const [countryConfig, setCountryConfig] = useState<any>(null);
  
  useEffect(() => {
    const selectedEmployeeNationality = form.watch('selectedEmployeeNationality');
    
    if (selectedEmployeeNationality) {
      const config = getCountryConfig(selectedEmployeeNationality);
      setCountryConfig(config);
    }
  }, [form.watch('selectedEmployeeNationality')]);
  
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-lg font-semibold">Statutory Deductions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-md font-medium">Income Tax</h4>
          
          <FormField
            control={form.control}
            name="incomeTaxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Income Tax Rate (%)*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" required />
                </FormControl>
                <FormDescription>
                  {countryConfig ? 
                    `Progressive tax rates in ${countryConfig.name}` : 
                    'Applied to taxable income'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Social Security</h4>
          
          <FormField
            control={form.control}
            name="socialSecurityRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Security Rate (%)*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" required />
                </FormControl>
                <FormDescription>
                  {countryConfig ? 
                    `${countryConfig.name} rate: ${countryConfig.socialSecurityRate.employee}%` : 
                    'E.g., NSSF, Social Security'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Health Insurance</h4>
          
          <FormField
            control={form.control}
            name="healthInsurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Health Insurance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormDescription>Employee portion</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      {countryConfig && countryConfig.hasNSSF && (
        <div className="p-4 border rounded bg-blue-50 mt-4">
          <h4 className="text-md font-medium mb-2">Country-Specific Deductions ({countryConfig.name})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countryConfig.hasPAYE && (
              <div>
                <p className="text-sm font-medium">PAYE Tax</p>
                <p className="text-sm text-gray-600">
                  Rate: {countryConfig.PAYERate}% (calculated automatically)
                </p>
              </div>
            )}
            
            {countryConfig.hasNSSF && (
              <div>
                <p className="text-sm font-medium">NSSF Contribution</p>
                <p className="text-sm text-gray-600">
                  Employee: {countryConfig.NSSFRate.employee}%, 
                  Employer: {countryConfig.NSSFRate.employer}% 
                  (calculated automatically)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Separator />
      
      <h3 className="text-lg font-semibold">Voluntary Deductions</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FormField
          control={form.control}
          name="employeePension"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Pension</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>Additional contributions</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="loanRepayments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Repayments</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="unionDues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Union Dues</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="charitableContributions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Charitable Contributions</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
