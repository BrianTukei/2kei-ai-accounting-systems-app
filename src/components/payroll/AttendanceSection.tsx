
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface AttendanceSectionProps {
  form: UseFormReturn<any>;
}

export default function AttendanceSection({ form }: AttendanceSectionProps) {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-lg font-semibold">Attendance and Leave</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FormField
          control={form.control}
          name="daysWorked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days Worked</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.5" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="vacationDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vacation Days</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.5" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sickDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sick Days</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.5" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="unpaidLeave"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unpaid Leave</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.5" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
