
import { useState } from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Employee } from '@/types/PayrollData';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

// Import our new component sections
import PersonalInfoSection from './PersonalInfoSection';
import IdentityInfoSection from './IdentityInfoSection';
import ContactInfoSection from './ContactInfoSection';
import EmploymentDetailsSection from './EmploymentDetailsSection';
import BankingInfoSection from './BankingInfoSection';

interface EmployeeFormProps {
  onAddEmployee: (employee: Employee) => void;
}

export default function EmployeeForm({ onAddEmployee }: EmployeeFormProps) {
  const form = useForm({
    defaultValues: {
      employeeId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      nationality: '',
      passportNumber: '',
      nationalIdNumber: '',
      taxIdentificationNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      contactNumber: '',
      email: '',
      employmentStartDate: '',
      employmentEndDate: '',
      jobTitle: '',
      department: '',
      employmentType: 'full-time',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        branchCode: '',
      }
    }
  });

  const onSubmit = (data: any) => {
    const employee: Employee = {
      id: uuidv4(),
      ...data,
    };
    
    onAddEmployee(employee);
    form.reset();
  };

  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader>
        <CardTitle>Add New Employee</CardTitle>
        <CardDescription>Enter employee details for payroll processing</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PersonalInfoSection form={form} />
              <IdentityInfoSection form={form} />
              <ContactInfoSection form={form} />
            </div>
            
            <Separator />
            
            {/* Employment Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EmploymentDetailsSection form={form} />
              <BankingInfoSection form={form} />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit">
                Add Employee
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
