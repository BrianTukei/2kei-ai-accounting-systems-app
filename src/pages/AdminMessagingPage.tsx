import React from 'react';
import { AdminMessagingPanel } from '../components/admin/AdminMessagingPanel';

const AdminMessagingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          <AdminMessagingPanel />
        </div>
      </div>
    </div>
  );
};

export default AdminMessagingPage;
