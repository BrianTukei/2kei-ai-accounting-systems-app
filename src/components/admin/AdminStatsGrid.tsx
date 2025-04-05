
import StatCard from '@/components/StatCard';
import { Users, UserPlus, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface AdminStatsGridProps {
  totalUsers?: number;
  newToday?: number;
}

export default function AdminStatsGrid({ totalUsers = 0, newToday = 0 }: AdminStatsGridProps) {
  const [usersCount, setUsersCount] = useState(totalUsers.toString());
  const [newUsersCount, setNewUsersCount] = useState(newToday.toString());
  const [emailStatus, setEmailStatus] = useState('Enabled');
  const [securityStatus, setSecurityStatus] = useState('Protected');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Total Users" 
        icon={Users}
        iconClassName="bg-blue-100 text-blue-500"
        customContent={
          <div className="mt-2">
            <Input
              value={usersCount}
              onChange={(e) => setUsersCount(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-2xl font-bold p-0 border-none focus-visible:ring-0"
              placeholder="Enter user count"
            />
          </div>
        }
      />
      <StatCard 
        title="New Today"
        icon={UserPlus}
        iconClassName="bg-green-100 text-green-500"
        customContent={
          <div className="mt-2">
            <Input
              value={newUsersCount}
              onChange={(e) => setNewUsersCount(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-2xl font-bold p-0 border-none focus-visible:ring-0"
              placeholder="Enter new users"
            />
          </div>
        }
      />
      <StatCard 
        title="Email Notifications" 
        icon={Mail}
        iconClassName="bg-yellow-100 text-yellow-500"
        customContent={
          <div className="mt-2">
            <Input
              value={emailStatus}
              onChange={(e) => setEmailStatus(e.target.value)}
              className="text-2xl font-bold p-0 border-none focus-visible:ring-0"
              placeholder="Status"
            />
          </div>
        }
      />
      <StatCard 
        title="Security Status" 
        icon={Shield}
        iconClassName="bg-purple-100 text-purple-500"
        customContent={
          <div className="mt-2">
            <Input
              value={securityStatus}
              onChange={(e) => setSecurityStatus(e.target.value)}
              className="text-2xl font-bold p-0 border-none focus-visible:ring-0"
              placeholder="Status"
            />
          </div>
        }
      />
    </div>
  );
}
