
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, Users } from 'lucide-react';
import AdminOverviewTab from './AdminOverviewTab';
import AdminUsersTab from './AdminUsersTab';

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
  logins?: UserLogin[]; // Added logins as an optional prop
}

export default function AdminTabs({ signups, logins = [] }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">
          <Layout className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="h-4 w-4 mr-2" />
          User List
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <AdminOverviewTab />
      </TabsContent>
      
      <TabsContent value="users">
        <AdminUsersTab signups={signups} />
      </TabsContent>
    </Tabs>
  );
}
