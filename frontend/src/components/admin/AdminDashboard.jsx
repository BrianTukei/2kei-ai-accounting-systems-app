import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Mail, 
  FileText, 
  BarChart3,
  Settings,
  Users,
  Send,
  Clock
} from 'lucide-react';

/**
 * Admin Dashboard
 * Main admin interface with navigation to all admin features
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('messaging');

  const adminStats = {
    totalUsers: 1247,
    activeUsers: 892,
    emailsSent: 5432,
    openRate: 68.5,
    successRate: 94.2
  };

  const quickActions = [
    {
      title: 'Send Message',
      description: 'Send email to users',
      icon: Send,
      color: 'bg-blue-500',
      action: () => setActiveTab('messaging')
    },
    {
      title: 'View Templates',
      description: 'Manage email templates',
      icon: FileText,
      color: 'bg-green-500',
      action: () => setActiveTab('templates')
    },
    {
      title: 'Email Logs',
      description: 'View email history',
      icon: Mail,
      color: 'bg-purple-500',
      action: () => setActiveTab('logs')
    },
    {
      title: 'User Management',
      description: 'Manage registered users',
      icon: Users,
      color: 'bg-orange-500',
      action: () => setActiveTab('users')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage user communications and system administration</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{adminStats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{adminStats.activeUsers.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 opacity-20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold">{adminStats.emailsSent.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold">{adminStats.openRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                onClick={action.action}
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messaging" className="mt-6">
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select the Messaging tab to access the Admin Messaging Panel</p>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select the Templates tab to access Email Templates</p>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select the Logs tab to access Email Logs Dashboard</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="smtp.gmail.com"
                    defaultValue="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    placeholder="587"
                    defaultValue="587"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email User</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    placeholder="admin@yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="2K AI Accounting"
                    defaultValue="2K AI Accounting"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>Save Settings</Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
