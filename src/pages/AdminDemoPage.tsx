/**
 * Admin Demo Requests page — /admin/demos
 */
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import AdminDemoNotifications from '@/components/admin/AdminDemoNotifications';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AdminDemoPage() {
  const navigate = useNavigate();

  return (
    <AdminAccessCheck>
      <PageLayout
        title="Demo requests"
        subtitle="Book-a-demo alerts and follow-ups"
        showBackButton={false}
      >
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin
          </Button>
        </div>
        <AdminDemoNotifications />
      </PageLayout>
    </AdminAccessCheck>
  );
}