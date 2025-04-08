
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminOverviewTab from "./AdminOverviewTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminSystemLogsTab from "./AdminSystemLogsTab";

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

interface AdminTabsProps {
  signups: UserSignup[];
  logins: UserLogin[];
}

export default function AdminTabs({ signups, logins }: AdminTabsProps) {
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users Management</TabsTrigger>
        <TabsTrigger value="system-logs">System Logs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <AdminOverviewTab signups={signups} logins={logins} />
      </TabsContent>
      
      <TabsContent value="users">
        <AdminUsersTab signups={signups} />
      </TabsContent>
      
      <TabsContent value="system-logs">
        <AdminSystemLogsTab />
      </TabsContent>
    </Tabs>
  );
}
