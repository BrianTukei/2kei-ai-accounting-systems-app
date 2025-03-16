
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import AdminTabs from '@/components/admin/AdminTabs';

type UserSignup = {
  id: string;
  name: string;
  email: string;
  date: string;
};

export default function AdminDashboard() {
  const [signups, setSignups] = useState<UserSignup[]>([]);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    // In a real app, this would be an API call to your backend
    try {
      // For now, we'll get data from localStorage
      const storedSignups = localStorage.getItem('userSignups');
      if (storedSignups) {
        setSignups(JSON.parse(storedSignups));
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
      toast.error("Failed to load signup data");
    }
  };

  // Calculate new users today
  const newToday = signups.filter(
    s => new Date(s.date).toDateString() === new Date().toDateString()
  ).length;

  return (
    <AdminAccessCheck>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <AdminHeader />
          <AdminStatsGrid totalUsers={signups.length} newToday={newToday} />
          <AdminTabs signups={signups} />
        </div>
      </div>
    </AdminAccessCheck>
  );
}
