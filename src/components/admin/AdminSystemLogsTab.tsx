
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { SystemChangeLog, UserComplaint } from '@/types/PayrollData';
import { getSystemChanges, getUserComplaints, updateComplaintStatus } from '@/utils/adminUtils';
import SystemChangesTab from './logs/SystemChangesTab';
import ComplaintsTab from './logs/ComplaintsTab';
import LoginActivityTab from './logs/LoginActivityTab';

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
    // In a real app, you would get the admin ID from the authenticated user
    const adminId = "USR003"; // Default admin user
    updateComplaintStatus(complaintId, newStatus, adminId);
    refreshData();
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
                <SystemChangesTab 
                  systemLogs={systemLogs}
                  searchTerm={searchTerm}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="complaints" className="m-0">
                <ComplaintsTab 
                  complaints={complaints}
                  searchTerm={searchTerm}
                  complaintFilter={complaintFilter}
                  setComplaintFilter={setComplaintFilter}
                  handleUpdateStatus={handleUpdateStatus}
                />
              </TabsContent>

              <TabsContent value="logins" className="m-0">
                <LoginActivityTab logins={logins} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
