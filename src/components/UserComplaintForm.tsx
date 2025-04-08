
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { submitUserComplaint } from '@/utils/adminUtils';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

interface UserComplaintFormProps {
  onClose?: () => void;
}

export default function UserComplaintForm({ onClose }: UserComplaintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const form = useForm({
    defaultValues: {
      subject: '',
      message: '',
      category: 'other',
      priority: 'medium',
    }
  });
  
  // Load user from localStorage
  useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  });
  
  const onSubmit = async (data: any) => {
    if (!user) {
      toast.error("You must be logged in to submit a complaint");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = submitUserComplaint(
        user.id || 'guest',
        user.name || 'Guest User',
        user.email || 'guest@example.com',
        data.subject,
        data.message,
        data.category,
        data.priority
      );
      
      if (result) {
        toast.success("Your complaint has been submitted successfully");
        form.reset();
        if (onClose) onClose();
      } else {
        toast.error("Failed to submit your complaint");
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error("An error occurred while submitting your complaint");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
          Submit a Complaint or Issue
        </CardTitle>
        <CardDescription>
          Let us know about any issues you're experiencing or suggestions you have
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="payroll">Payroll Issue</SelectItem>
                        <SelectItem value="user-access">User Access</SelectItem>
                        <SelectItem value="technical">Technical Problem</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best fits your issue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide detailed information about the issue you're experiencing..." 
                      rows={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include steps to reproduce the issue, time it occurred, and any other relevant details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-2">
                Your report will be reviewed by our team and you'll be notified when there's an update.
              </p>
              
              {!user && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                  <p className="text-sm text-yellow-800">
                    You're not logged in. Please log in to receive updates about your complaint.
                  </p>
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Complaint"}
        </Button>
      </CardFooter>
    </Card>
  );
}
