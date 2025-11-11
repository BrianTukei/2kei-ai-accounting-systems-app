
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AdminHeader() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Track user signups and system performance</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          Manage Admins
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
