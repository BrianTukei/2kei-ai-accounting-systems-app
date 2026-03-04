/**
 * AdminBilling.tsx
 * ──────────────────
 * Admin Billing management page.
 * Accessible at /admin/billing — requires admin/superadmin role.
 */

import React from 'react';
import Sidebar from '@/components/Sidebar';
import AdminBillingPanel from '@/components/admin/AdminBillingPanel';

export default function AdminBilling() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Billing Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage subscriber billing, view revenue, and apply overrides
            </p>
          </div>
          <AdminBillingPanel />
        </div>
      </main>
    </div>
  );
}
