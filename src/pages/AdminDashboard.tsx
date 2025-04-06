
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

type UserLogin = {
  email: string;
  timestamp: string;
};

export default function AdminDashboard() {
  const [signups, setSignups] = useState<UserSignup[]>([]);
  const [logins, setLogins] = useState<UserLogin[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);

  useEffect(() => {
    fetchSignups();
    fetchLogins();
  }, []);

  const fetchSignups = async () => {
    try {
      const storedSignups = localStorage.getItem('userSignups');
      if (storedSignups) {
        setSignups(JSON.parse(storedSignups));
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
      toast.error("Failed to load signup data");
    }
  };

  const fetchLogins = async () => {
    try {
      const storedLogins = localStorage.getItem('loginHistory');
      if (storedLogins) {
        const loginData = JSON.parse(storedLogins);
        setLogins(loginData);
        
        // Calculate active users (unique logins in the last 24 hours)
        const last24Hours = new Date();
        last24Hours.setDate(last24Hours.getDate() - 1);
        
        const activeUserEmails = new Set(
          loginData
            .filter((login: UserLogin) => new Date(login.timestamp) > last24Hours)
            .map((login: UserLogin) => login.email)
        );
        
        setActiveUsers(activeUserEmails.size);
      }
    } catch (error) {
      console.error('Error fetching logins:', error);
      toast.error("Failed to load login history");
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
          <AdminStatsGrid 
            totalUsers={signups.length} 
            newToday={newToday}
            activeUsers={activeUsers}
          />
          <AdminTabs 
            signups={signups} 
            logins={logins}
          />
        </div>
      </div>
    </AdminAccessCheck>
  );
}
