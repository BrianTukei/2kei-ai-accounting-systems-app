
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';

interface EarningsSectionProps {
  form: UseFormReturn<any>;
}

export default function EarningsSection({ form }: EarningsSectionProps) {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-lg font-semibold">Fixed Earnings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-md font-medium">Base Compensation</h4>
          
          <FormField
            control={form.control}
            name="basicSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basic Salary*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="additionalMonthPay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>13th/14th Month Pay</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormDescription>Pro-rated additional month salary</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Allowances</h4>
          
          <FormField
            control={form.control}
            name="housingAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Housing Allowance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="transportAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transport Allowance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="mealAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Allowance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Bonuses & Commissions</h4>
          
          <FormField
            control={form.control}
            name="annualBonus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Bonus</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="performanceBonus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Performance Bonus</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="commissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commissions</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <Separator />
      
      <h3 className="text-lg font-semibold">Variable Earnings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-md font-medium">Overtime</h4>
          
          <FormField
            control={form.control}
            name="overtimeHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Hours</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="overtimeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Rate Multiplier</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.1" />
                </FormControl>
                <FormDescription>E.g., 1.5 for time-and-a-half</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Shift Differentials</h4>
          
          <FormField
            control={form.control}
            name="nightShiftAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Night Shift Allowance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="holidayAllowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Holiday/Weekend Allowance</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Reimbursements</h4>
          
          <FormField
            control={form.control}
            name="travelReimbursement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travel Reimbursement</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="medicalReimbursement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medical Reimbursement</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <Separator />
      
      <h3 className="text-lg font-semibold">Benefits (Taxable & Non-Taxable)</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FormField
          control={form.control}
          name="companyCar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Car</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>Taxable benefit value</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fuelBenefit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Benefit</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="stockOptions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Options/Equity</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>Current period value</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="employerPensionContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Pension Contribution</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormDescription>Non-taxable benefit</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
