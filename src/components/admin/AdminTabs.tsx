
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminOverviewTab from "./AdminOverviewTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminSystemLogsTab from "./AdminSystemLogsTab";
import AdminTransactionsTab from "./AdminTransactionsTab";
import { Transaction } from "@/components/TransactionCard";

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
  transactions: Transaction[];
}

export default function AdminTabs({ signups, logins, transactions }: AdminTabsProps) {
  return (
    <Tabs defaultValue="overview" className="mt-6">
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users Management</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="system-logs">System Logs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <AdminOverviewTab signups={signups} logins={logins} />
      </TabsContent>
      
      <TabsContent value="users">
        <AdminUsersTab signups={signups} />
      </TabsContent>
      
      <TabsContent value="transactions">
        <AdminTransactionsTab transactions={transactions} />
      </TabsContent>
      
      <TabsContent value="system-logs">
        <AdminSystemLogsTab signups={signups} logins={logins} />
      </TabsContent>
    </Tabs>
  );
}
