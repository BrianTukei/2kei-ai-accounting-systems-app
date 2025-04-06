
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Edit, UserPlus } from 'lucide-react';
import { Employee } from '@/types/PayrollData';

interface EmployeeTableProps {
  employees: Employee[];
  onDeleteEmployee: (id: string) => void;
  onSelectEmployee: (employee: Employee) => void;
}

export default function EmployeeTable({ 
  employees, 
  onDeleteEmployee, 
  onSelectEmployee 
}: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card className="glass-card glass-card-hover">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Manage your employees for payroll processing</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, job title or department..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredEmployees.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName}</div>
                        <div className="text-sm text-muted-foreground">ID: {employee.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.employmentType === 'full-time' 
                          ? 'bg-green-100 text-green-800' 
                          : employee.employmentType === 'part-time'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {employee.employmentType.replace('-', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>{employee.employmentStartDate}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectEmployee(employee)}
                      >
                        <UserPlus className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3">
              <UserPlus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {employees.length === 0 
                ? "Add your first employee using the form above." 
                : "No employees match your search criteria."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
