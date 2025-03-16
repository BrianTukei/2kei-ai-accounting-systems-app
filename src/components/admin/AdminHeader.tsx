
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
      <Button onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
