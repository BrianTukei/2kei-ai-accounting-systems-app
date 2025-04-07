
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface IdentityInfoSectionProps {
  form: UseFormReturn<any>;
}

export default function IdentityInfoSection({ form }: IdentityInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold">Identity Information</h3>
      
      <FormField
        control={form.control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nationality*</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Ugandan" required />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="passportNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Passport Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="P12345678" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="nationalIdNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>National ID Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="ID12345678" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="taxIdentificationNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax ID Number (TIN)*</FormLabel>
            <FormControl>
              <Input {...field} placeholder="123-45-6789" required />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
