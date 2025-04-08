
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SystemChangeLog, UserComplaint } from '@/types/PayrollData';
import { getSystemChanges, getUserComplaints, updateComplaintStatus } from '@/utils/adminUtils';
import { AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';

type UserSignup = {
  id: string;
  name: string;
  email: string;
  date: string;
};

type UserLogin = {
  email: string;
  timestamp: string;
};

interface AdminSystemLogsTabProps {
  signups?: UserSignup[];
  logins?: UserLogin[];
}

export default function AdminSystemLogsTab({ signups = [], logins = [] }: AdminSystemLogsTabProps) {
  const [systemLogs, setSystemLogs] = useState<SystemChangeLog[]>(getSystemChanges());
  const [complaints, setComplaints] = useState<UserComplaint[]>(getUserComplaints());
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [complaintFilter, setComplaintFilter] = useState<string>('all');
  
  // Refresh data
  const refreshData = () => {
    setSystemLogs(getSystemChanges());
    setComplaints(getUserComplaints());
  };
  
  // Filter system logs
  const filteredLogs = systemLogs.filter(log => {
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.actionType.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    if (complaintFilter !== 'all' && complaint.status !== complaintFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        complaint.userName.toLowerCase().includes(searchLower) ||
        complaint.subject.toLowerCase().includes(searchLower) ||
        complaint.message.toLowerCase().includes(searchLower) ||
        complaint.category.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Update complaint status
  const handleUpdateStatus = (complaintId: string, newStatus: "new" | "in-progress" | "resolved" | "closed") => {
    // In a real app, you would get the admin ID from the authenticated user
    const adminId = "USR003"; // Default admin user
    updateComplaintStatus(complaintId, newStatus, adminId);
    refreshData();
  };
  
  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500';
      case 'medium': return 'bg-blue-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-blue-500';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short'
    }).format(date);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Logs & User Complaints</span>
          <Button size="sm" onClick={refreshData}>Refresh</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="changes">
          <TabsList className="mb-4">
            <TabsTrigger value="changes">System Changes</TabsTrigger>
            <TabsTrigger value="complaints">User Complaints</TabsTrigger>
            <TabsTrigger value="logins">Login Activity</TabsTrigger>
          </TabsList>
          
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <TabsContent value="changes" className="m-0">
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="employee">Employees</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="setting">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="complaints" className="m-0">
                <Select value={complaintFilter} onValueChange={setComplaintFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="logins" className="m-0">
                <span className="text-sm text-muted-foreground">
                  Showing {logins.length} recent logins
                </span>
              </TabsContent>
            </div>
          </div>
          
          <TabsContent value="changes">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead className="hidden md:table-cell">Entity ID</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>
                          <Badge className={
                            log.actionType === 'create' ? 'bg-green-500' :
                            log.actionType === 'update' ? 'bg-blue-500' :
                            'bg-red-500'
                          }>
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {log.entityId}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No system logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="complaints">
            <div className="space-y-4">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <Card key={complaint.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-4 flex-grow">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {complaint.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(complaint.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-md font-bold">{complaint.subject}</h4>
                        <p className="text-sm text-gray-700 mt-2">{complaint.message}</p>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">From:</span> {complaint.userName} ({complaint.userEmail})
                        </div>
                        
                        {complaint.resolution && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Resolution:</p>
                            <p className="text-sm text-gray-600">{complaint.resolution}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex md:flex-col p-4 gap-2 bg-gray-50">
                        {complaint.status === "new" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus(complaint.id, "in-progress")}
                            className="w-full"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                        
                        {(complaint.status === "new" || complaint.status === "in-progress") && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleUpdateStatus(complaint.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                        
                        {complaint.status !== "closed" && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => handleUpdateStatus(complaint.id, "closed")}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center p-8 border rounded">
                  <p className="text-gray-500">No complaints found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logins">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>User Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logins.length > 0 ? (
                    logins.map((login, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(login.timestamp)}
                        </TableCell>
                        <TableCell>{login.email}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No login activity found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
