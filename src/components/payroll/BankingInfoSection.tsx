
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface BankingInfoSectionProps {
  form: UseFormReturn<any>;
}

export default function BankingInfoSection({ form }: BankingInfoSectionProps) {
  return (
    <div className="space-y-4 md:col-span-2">
      <h3 className="text-md font-semibold">Banking Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="bankDetails.bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Stanbic Bank" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bankDetails.accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="1234567890" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bankDetails.branchCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch/Sort Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="042" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormDescription>
        Banking information will be used for direct deposit of salary payments.
        This information is encrypted and securely stored.
      </FormDescription>
    </div>
  );
}
