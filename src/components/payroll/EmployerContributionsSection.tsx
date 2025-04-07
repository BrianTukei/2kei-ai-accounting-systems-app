
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface EmployerContributionsSectionProps {
  form: UseFormReturn<any>;
}

export default function EmployerContributionsSection({ form }: EmployerContributionsSectionProps) {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-lg font-semibold">Employer Contributions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="employerPension"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Pension (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>E.g., NSSF employer portion</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="workersCompensation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workers Compensation (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payrollTaxes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payroll Taxes (%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>E.g., FICA, Skills Development Levy</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          These employer contributions do not affect the employee's net pay. 
          They represent additional costs to the employer beyond the employee's salary.
        </p>
      </div>
    </div>
  );
}
