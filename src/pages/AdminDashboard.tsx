
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, Users, Mail, Shield, UserPlus } from 'lucide-react';
import StatCard from '@/components/StatCard';
import OverviewChart from '@/components/OverviewChart';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// This would be replaced with real API calls in a production environment
const mockSignupData = [
  { date: 'Jan', count: 5 },
  { date: 'Feb', count: 12 },
  { date: 'Mar', count: 8 },
  { date: 'Apr', count: 15 },
  { date: 'May', count: 22 },
  { date: 'Jun', count: 18 },
];

type UserSignup = {
  id: string;
  name: string;
  email: string;
  date: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [signups, setSignups] = useState<UserSignup[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error("Please sign in to access the admin dashboard");
      navigate('/auth');
      return;
    }

    const userData = JSON.parse(user);
    // In a real app, you would check if the user has admin privileges
    // For now, we'll just check if the email is the admin email
    if (userData.email === 'tukeibrian5@gmail.com') {
      setIsAdmin(true);
      fetchSignups();
    } else {
      toast.error("You don't have permission to access this page");
      navigate('/dashboard');
    }
  }, [navigate]);

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

  // Format data for the chart - fixed to match OverviewChart's expected format
  const getChartData = () => {
    // Group signups by month and map to the format expected by OverviewChart
    const signupsByMonth = mockSignupData.reduce((acc, { date, count }) => {
      return [...acc, { 
        name: date, 
        income: count, // Use 'income' instead of 'signups'
        expenses: Math.floor(count * 0.3) // Use 'expenses' instead of 'target'
      }];
    }, [] as { name: string; income: number; expenses: number }[]);
    
    return signupsByMonth;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You don't have permission to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Track user signups and system performance</p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Users" 
            value={signups.length.toString()} 
            icon={Users}
            iconClassName="bg-blue-100 text-blue-500"
          />
          <StatCard 
            title="New Today" 
            value={signups.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length.toString()}
            icon={UserPlus}
            iconClassName="bg-green-100 text-green-500"
          />
          <StatCard 
            title="Email Notifications" 
            value="Enabled" 
            icon={Mail}
            iconClassName="bg-yellow-100 text-yellow-500"
          />
          <StatCard 
            title="Security Status" 
            value="Protected" 
            icon={Shield}
            iconClassName="bg-purple-100 text-purple-500"
          />
        </div>
        
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
            <OverviewChart 
              data={getChartData()}
              title="User Signup Trends"
              description="Monthly user registration activity"
            />
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>Complete list of all user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Name</th>
                        <th className="py-3 px-4 text-left font-medium">Email</th>
                        <th className="py-3 px-4 text-left font-medium">Signup Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.length > 0 ? (
                        signups.map((user) => (
                          <tr key={user.id} className="border-t">
                            <td className="px-4 py-3">{user.name}</td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">{new Date(user.date).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            No user signup data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
