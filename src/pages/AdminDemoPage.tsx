/**
 * Admin Demo Requests page — /admin/demos
 */
import PageLayout from '@/components/layout/PageLayout';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import AdminDemoNotifications from '@/components/admin/AdminDemoNotifications';

export default function AdminDemoPage() {
  return (
    <AdminAccessCheck>
      <PageLayout
        title="Demo requests"
        subtitle="Book-a-demo alerts and follow-ups"
        showBackButton
      >
        <AdminDemoNotifications />
      </PageLayout>
    </AdminAccessCheck>
  );
}
