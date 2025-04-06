
import StatCard from '@/components/StatCard';
import { Users, UserPlus, Mail, Shield, Activity } from 'lucide-react';

interface AdminStatsGridProps {
  totalUsers: number;
  newToday: number;
  activeUsers?: number; // Added activeUsers as an optional prop
}

export default function AdminStatsGrid({ totalUsers, newToday, activeUsers = 0 }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Total Users" 
        value={totalUsers.toString()} 
        icon={Users}
        iconClassName="bg-blue-100 text-blue-500"
      />
      <StatCard 
        title="New Today" 
        value={newToday.toString()}
        icon={UserPlus}
        iconClassName="bg-green-100 text-green-500"
      />
      <StatCard 
        title="Active Users" 
        value={activeUsers.toString()}
        icon={Activity}
        iconClassName="bg-amber-100 text-amber-500"
      />
      <StatCard 
        title="Security Status" 
        value="Protected" 
        icon={Shield}
        iconClassName="bg-purple-100 text-purple-500"
      />
    </div>
  );
}
