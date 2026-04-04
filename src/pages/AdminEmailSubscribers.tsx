import { useState, useEffect, useCallback } from 'react';
import AdminAccessCheck from '@/components/admin/AdminAccessCheck';
import PageLayout from '@/components/layout/PageLayout';
import { Mail, Send, Users, Activity, Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminEmailSubscribers() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [systemUsersCount, setSystemUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendTo, setSendTo] = useState<'all' | 'system_users' | 'both'>('all');
  
  // Add subscriber state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addingSub, setAddingSub] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscribers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        if (data.systemUsersCount !== undefined) {
          setSystemUsersCount(data.systemUsersCount);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscribers', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAddingSub(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, name: newName })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message || 'Subscriber added' });
        setNewEmail('');
        setNewName('');
        fetchSubscribers();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Failed to add subscriber' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add subscriber' });
    } finally {
      setAddingSub(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Subject and message are required' });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/broadcast-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          message,
          sendTo
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setSubject('');
        setMessage('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Failed to send broadcast' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during broadcast' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAccessCheck>
      <PageLayout 
        title="Admin Email Campaign Manager" 
        subtitle="Manage subscribers and broadcast emails" 
        showSidebar={false} 
        requireAuth={false}
      >
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Send Email Form */}
            <Card className="lg:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="flex items-center text-lg text-slate-800">
                  <Send className="w-5 h-5 mr-2 text-blue-600" />
                  Compose Broadcast
                </CardTitle>
                <CardDescription>Send announcements, updates, or alerts to your subscribers.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleBroadcast} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Send To</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={sendTo === 'all'} 
                          onChange={() => setSendTo('all')} 
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        Target Subscribers ({subscribers.filter(s => s.status === 'active').length})
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={sendTo === 'system_users'} 
                          onChange={() => setSendTo('system_users')} 
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        System Users ({systemUsersCount})
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={sendTo === 'both'} 
                          onChange={() => setSendTo('both')} 
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        Both lists
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Subject</label>
                    <Input 
                      placeholder="e.g. Awesome New Updates from 2K AI Accounting" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Message (HTML supported)</label>
                    <Textarea 
                      placeholder="Write your email body here. Supports HTML formatting..." 
                      className="min-h-[250px] font-mono text-sm"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={sending || (sendTo === 'all' && subscribers.filter(s => s.status === 'active').length === 0) || (sendTo === 'system_users' && systemUsersCount === 0)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {sending ? (
                      <span className="flex items-center"><Activity className="animate-spin w-4 h-4 mr-2" /> Sending Broadcast...</span>
                    ) : (
                      <span className="flex items-center"><Send className="w-4 h-4 mr-2" /> Send Email</span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Col: Manage Subscribers */}
            <div className="space-y-6">
              
              {/* Quick Add Subscriber */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-md flex items-center text-slate-800">
                    <Plus className="w-5 h-5 mr-2 text-green-600" />
                    Add Subscriber
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-6">
                  <form onSubmit={handleAddSubscriber} className="space-y-3">
                    <Input 
                      placeholder="Name (Optional)" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      className="text-sm"
                    />
                    <Input 
                      type="email" 
                      placeholder="Email Address *" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      required 
                      className="text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={addingSub} className="w-full mt-2">
                      {addingSub ? 'Adding...' : 'Add to List'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Subscribers List */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-md flex items-center justify-between text-slate-800">
                    <span className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-600" />
                      Subscribers
                    </span>
                    <Badge variant="secondary">{subscribers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center">
                      <Activity className="w-4 h-4 animate-spin mr-2" /> Loading...
                    </div>
                  ) : subscribers.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No subscribers yet. List is empty.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {subscribers.map((sub: any) => (
                        <li key={sub._id || sub.email} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="bg-slate-100 text-slate-600 w-8 h-8 rounded flex items-center justify-center font-semibold text-xs shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {sub.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{sub.email}</p>
                            </div>
                          </div>
                          <div>
                            {sub.status === 'active' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </PageLayout>
    </AdminAccessCheck>
  );
}