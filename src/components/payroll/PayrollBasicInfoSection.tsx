
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { Employee } from '@/types/PayrollData';
import { getCountryConfig } from '@/utils/taxCalculations';
import { useEffect } from 'react';

interface PayrollBasicInfoSectionProps {
  form: UseFormReturn<any>;
  employees: Employee[];
  selectedEmployee: Employee | null;
}

export default function PayrollBasicInfoSection({ form, employees, selectedEmployee }: PayrollBasicInfoSectionProps) {
  // When employee changes, update the currency and country-specific info
  useEffect(() => {
    if (selectedEmployee) {
      const countryConfig = getCountryConfig(selectedEmployee.nationality);
      form.setValue('currency', countryConfig.currency);
      form.setValue('selectedEmployeeNationality', selectedEmployee.nationality);
    }
  }, [selectedEmployee, form]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee*</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.nationality})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date*</FormLabel>
              <FormControl>
                <Input {...field} type="date" required />
              </FormControl>
              <FormDescription>Date when payment will be made</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name="payPeriodStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay Period Start*</FormLabel>
              <FormControl>
                <Input {...field} type="date" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="payPeriodEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay Period End*</FormLabel>
              <FormControl>
                <Input {...field} type="date" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency*</FormLabel>
              <FormControl>
                <Input {...field} required readOnly />
              </FormControl>
              <FormDescription>Currency is set based on employee's country</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Hidden field to store employee nationality for tax calculations */}
      <FormField
        control={form.control}
        name="selectedEmployeeNationality"
        render={({ field }) => (
          <input type="hidden" {...field} />
        )}
      />
      
      <div className="space-y-1">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method*</FormLabel>
              <FormControl>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {selectedEmployee && (
        <div className="bg-blue-50 p-4 rounded-md mt-4">
          <p className="text-sm text-blue-800">
            Tax calculations will be based on {selectedEmployee.nationality} tax regulations.
          </p>
        </div>
      )}
    </div>
  );
}
