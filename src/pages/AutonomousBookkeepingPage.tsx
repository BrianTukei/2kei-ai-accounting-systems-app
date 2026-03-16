import React from 'react';
import { AutonomousBookkeepingPanel } from '../components/admin/AutonomousBookkeepingPanel';

const AutonomousBookkeepingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          <AutonomousBookkeepingPanel />
        </div>
      </div>
    </div>
  );
};

export default AutonomousBookkeepingPage;
