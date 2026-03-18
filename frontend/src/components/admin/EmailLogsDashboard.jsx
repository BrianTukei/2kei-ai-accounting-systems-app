import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Users,
  BarChart3,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

/**
 * Email Logs Dashboard
 * Shows email sending history and statistics
 */
export function EmailLogsDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [selectedPeriod]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/email-logs');
      if (response.data.success) {
        setLogs(response.data.data.emails);
      }
    } catch (error) {
      toast.error('Failed to fetch email logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/admin/email-stats?period=${selectedPeriod}`);
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      toast.error('Failed to fetch email statistics');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'opened':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'clicked':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      sent: 'default',
      delivered: 'default',
      opened: 'secondary',
      clicked: 'secondary',
      failed: 'destructive',
      bounced: 'destructive',
      pending: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(log => 
    log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSent = stats.reduce((sum, stat) => 
    ['sent', 'delivered', 'opened', 'clicked'].includes(stat._id) ? sum + stat.count : sum, 0
  );

  const totalFailed = stats.reduce((sum, stat) => 
    ['failed', 'bounced'].includes(stat._id) ? sum + stat.count : sum, 0
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Communication
          </h1>
          <p className="text-gray-600">Track email campaigns and user communications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-green-600">{totalSent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalSent > 0 ? Math.round((stats.find(s => s._id === 'opened')?.count || 0) / totalSent * 100) : 0}%
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalSent + totalFailed > 0 ? Math.round(totalSent / (totalSent + totalFailed) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Logs
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by subject or recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 p-8">
                  No email logs found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Recipient</th>
                        <th className="text-left p-3 font-medium">Subject</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log._id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{log.recipient}</div>
                              {log.userId && (
                                <div className="text-sm text-gray-500">
                                  {log.userId.firstName} {log.userId.lastName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-xs truncate" title={log.subject}>
                              {log.subject}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              {getStatusBadge(log.status)}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {log.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <Card key={stat._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">{stat._id}</p>
                      <p className="text-2xl font-bold">{stat.count}</p>
                      <p className="text-xs text-gray-500">
                        Last: {formatDate(stat.latest)}
                      </p>
                    </div>
                    {getStatusIcon(stat._id)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailLogsDashboard;
