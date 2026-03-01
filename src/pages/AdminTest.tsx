/**
 * AdminTest.tsx
 * Simple admin test page to debug access issues
 */

import React from 'react';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

function AdminTestContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="bg-green-950/50 border-b border-green-900/30">
          <CardTitle className="text-green-400 text-center">
            Admin Access Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 text-center">
          <p className="text-white">
            You have admin access.
          </p>
          <p className="text-slate-400 text-sm">
            Logged in as: {user?.email}
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Button 
              onClick={() => navigate('/dev-admin')}
              className="bg-red-600 hover:bg-red-700"
            >
              Go to Dev Admin
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Go to Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminTest() {
  return (
    <AdminAccessCheck>
      <AdminTestContent />
    </AdminAccessCheck>
  );
}
