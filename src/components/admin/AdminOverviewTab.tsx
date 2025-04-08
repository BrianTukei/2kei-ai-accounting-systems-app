
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OverviewChart from '@/components/OverviewChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

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

interface AdminOverviewTabProps {
  signups: UserSignup[];
  logins: UserLogin[];
}

export default function AdminOverviewTab({ signups, logins }: AdminOverviewTabProps) {
  // Format data for charts based on signups
  const chartData = signups.reduce((acc: any[], signup) => {
    const date = new Date(signup.date);
    const month = date.toLocaleString('default', { month: 'short' });
    
    const existingMonth = acc.find(item => item.name === month);
    if (existingMonth) {
      existingMonth.signups += 1;
    } else {
      acc.push({ name: month, signups: 1 });
    }
    
    return acc;
  }, []);
  
  // Get the 5 most recent signups
  const recentSignups = [...signups]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  // Get the 5 most recent logins
  const recentLogins = [...logins]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-6">
      <OverviewChart 
        data={chartData}
        title="User Signup Trends"
        description="Monthly user registration activity"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest users who registered to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSignups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell>{signup.name}</TableCell>
                      <TableCell>{signup.email}</TableCell>
                      <TableCell>{format(new Date(signup.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent signups found</p>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Logins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Logins</CardTitle>
            <CardDescription>Latest user login activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogins.map((login, index) => (
                    <TableRow key={index}>
                      <TableCell>{login.email}</TableCell>
                      <TableCell>{format(new Date(login.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent login activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
