import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { SystemChangeLog, UserComplaint } from '@/types/PayrollData';
import { getSystemChanges, getUserComplaints, updateComplaintStatus } from '@/utils/adminUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
  
  // Update complaint status
  const handleUpdateStatus = (complaintId: string, newStatus: "new" | "in-progress" | "resolved" | "closed") => {
    const adminId = "USR003";
    updateComplaintStatus(complaintId, newStatus, adminId);
    refreshData();
  };

  // Filter functions
  const filteredLogs = systemLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = entityFilter === 'all' || log.entityType === entityFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = complaintFilter === 'all' || complaint.status === complaintFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedLogins = [...logins].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const loginTime = new Date(timestamp);
    const diffInHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const isRecentLogin = (timestamp: string) => {
    const now = new Date();
    const loginTime = new Date(timestamp);
    const diffInHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    return diffInHours < 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'in-progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
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
          </div>

          <TabsContent value="changes">
            <div className="space-y-4">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entityType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.entityId}</TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'DELETE' ? 'destructive' : 'default'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{log.adminId}</TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No system changes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="complaints">
            <div className="space-y-4">
              <Select value={complaintFilter} onValueChange={setComplaintFilter}>
                <SelectTrigger className="w-48">
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
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="text-sm">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{complaint.userName}</div>
                            <div className="text-sm text-muted-foreground">{complaint.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{complaint.subject}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {complaint.message}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{complaint.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(complaint.status)}>
                            {complaint.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {complaint.status === 'new' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateStatus(complaint.id, 'in-progress')}
                              >
                                Start
                              </Button>
                            )}
                            {complaint.status === 'in-progress' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                            )}
                            {complaint.status === 'resolved' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateStatus(complaint.id, 'closed')}
                              >
                                Close
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredComplaints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No complaints found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logins">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Time Ago</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLogins.map((login, index) => (
                    <TableRow key={`${login.email}-${login.timestamp}-${index}`}>
                      <TableCell className="font-medium">{login.email}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(login.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getTimeAgo(login.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isRecentLogin(login.timestamp) ? 'default' : 'secondary'}>
                          {isRecentLogin(login.timestamp) ? 'Active' : 'Previous'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedLogins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No login activity recorded
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