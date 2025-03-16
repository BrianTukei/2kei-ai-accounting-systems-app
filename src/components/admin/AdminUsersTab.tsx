
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type UserSignup = {
  id: string;
  name: string;
  email: string;
  date: string;
};

interface AdminUsersTabProps {
  signups: UserSignup[];
}

export default function AdminUsersTab({ signups }: AdminUsersTabProps) {
  return (
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
  );
}
