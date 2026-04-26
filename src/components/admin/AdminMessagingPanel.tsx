import React, { useState, useEffect } from 'react';
import { Send, Image as ImageIcon, Users, Calendar, Settings, Clock, BarChart3, Mail, Plus, Filter, Paperclip, CheckSquare, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';

export const AdminMessagingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'settings'>('compose');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [scheduleOption, setScheduleOption] = useState('now');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{email: string, name: string}[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBroadcasts();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        try {
          const resData = await adminApiCall("list-all", { page: 1, perPage: 1000 });
          if (resData.users) {
            setAvailableUsers(
              resData.users.map((user: any) => ({
                name: user.full_name || user.user_metadata?.full_name || user.user_metadata?.first_name || user.email.split('@')[0],
                email: user.email
              }))
            );
          }
        } catch (apiError) {
          console.warn("Edge function failed, falling back to profiles table...", apiError);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .limit(1000);
            
          if (profiles) {
            setAvailableUsers(
              profiles.map((p: any) => ({
                name: p.full_name || p.email.split('@')[0],
                email: p.email
              }))
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch available users:', error);
      }
    };
    fetchUsers();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch('/api/admin/broadcasts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBroadcasts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    }
  };

  const handleSend = async (isTest = false) => {
    if (!subject || !message) {
      toast.error('Please enter a subject and message.');
      return;
    }
    
    setIsSending(true);
    try {
      if (isTest) {
         // Send test email
         const testEmail = prompt('Enter email address to send test to:');
         if (!testEmail) return;

         const createResponse = await fetch('/api/admin/broadcasts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: 'Test Broadcast: ' + subject,
              subject,
              message,
              recipient_group: 'specific',
              specific_recipients: [testEmail],
            })
         });
         const createData = await createResponse.json();
         if (!createData.success) throw new Error(createData.error);
         
         const sendResponse = await fetch(`/api/admin/broadcasts/${createData.data.id}/test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ email: testEmail })
         });
         const sendData = await sendResponse.json();
         if (sendData.success) toast.success('Test broadcast sent!');
         else throw new Error(sendData.error);
         
      } else {
         // Save Draft config
         const createResponse = await fetch('/api/admin/broadcasts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: 'Broadcast: ' + subject,
              subject,
              message,
              recipient_group: recipientGroup,
              specific_recipients: recipientGroup === 'specific' ? selectedUsers : [],
            })
         });
         const createData = await createResponse.json();
         if (!createData.success) throw new Error(createData.error);

         if (scheduleOption === 'now') {
             const sendResponse = await fetch(`/api/admin/broadcasts/${createData.data.id}/send`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
             });
             const sendData = await sendResponse.json();
             if (sendData.success) {
                 toast.success('Broadcast is processing!');
                 setSubject('');
                 setMessage('');
                 setActiveTab('history');
             } else throw new Error(sendData.error);
         } else {
             toast.success('Broadcast drafted/scheduled successfully!');
             setActiveTab('history');
         }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request');
    } finally {
      setIsSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Page Title Section */}
      <header className="bg-white border-b border-gray-200 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0 p-0 border-none">Broadcast Email</h1>
          <p className="text-sm text-gray-500 mt-1">Send messages to your users, subscribers, or selected customers.</p>
        </div>
        <div className="flex flex-wrap space-x-2 lg:space-x-3">
          <button onClick={() => setActiveTab('compose')} className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${activeTab === 'compose' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <Plus className="w-4 h-4 mr-2" /> New Broadcast
          </button>
          <button onClick={() => setActiveTab('templates')} className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <CheckSquare className="w-4 h-4 mr-2" /> Templates
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <BarChart3 className="w-4 h-4 mr-2" /> Email History
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 w-full">
        {activeTab === 'compose' && (
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form Left Column */}
            <div className="col-span-1 xl:col-span-2 space-y-6">
              
              {/* Section A - Audience Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-500" /> Select Recipients
                   </h3>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Send To</label>
                    <select value={recipientGroup} onChange={(e) => setRecipientGroup(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-shadow">
                      <option value="all">All Users</option>
                      <option value="subscribers">All Subscribers</option>
                      <option value="active">Active Customers</option>
                      <option value="inactive">Inactive Customers</option>
                      <option value="trial">Trial Users</option>
                      <option value="specific">Specific Email List</option>
                    </select>
                  </div>
                  
                  {recipientGroup === 'specific' && (
                    <div className="pt-2">
                       <p className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                         Select Specific Users 
                       </p>
                       <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                         {availableUsers.map((u) => (
                            <label key={u.email} className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer p-1">
                               <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4" checked={selectedUsers.includes(u.email)} onChange={(e) => {
                                   if (e.target.checked) setSelectedUsers([...selectedUsers, u.email]);
                                   else setSelectedUsers(selectedUsers.filter(x => x !== u.email));
                               }}/>
                               <span>{u.name} ({u.email})</span>
                            </label>
                         ))}
                         {availableUsers.length === 0 && <span className="text-gray-400 text-sm p-1">No active users found.</span>}
                       </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Filter className="w-4 h-4 mr-2 text-gray-500" /> Advanced Filters (Optional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                         <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4" /> 
                         <span>Users with unpaid invoices</span>
                      </label>
                      <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                         <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4" /> 
                         <span>Users with expiring subscriptions</span>
                      </label>
                      <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                         <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4" /> 
                         <span>New users (last 7 days)</span>
                      </label>
                      <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                         <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4" /> 
                         <span>Custom company selection</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section B — Email Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" /> Compose Email
                   </h3>
                   <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center">
                      Generate with AI ✨
                   </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line</label>
                    <input 
                      type="text" 
                      placeholder="Example: Important Update from 2K AI Accounting System" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">Email Body</label>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Rich Text</span>
                    </div>
                    {/* Mock Toolbar */}
                    <div className="flex items-center space-x-1.5 border border-b-0 border-gray-300 rounded-t-md p-2 bg-gray-50/50">
                       <button className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded font-serif font-bold text-sm min-w-[28px] transition-colors">B</button>
                       <button className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded font-serif italic text-sm min-w-[28px] transition-colors">I</button>
                       <button className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded font-serif underline text-sm min-w-[28px] transition-colors">U</button>
                       <div className="w-px h-5 bg-gray-300 mx-1.5"></div>
                       <button className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded text-xs font-medium transition-colors">Link</button>
                       <button className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded text-xs transition-colors"><ImageIcon className="w-4 h-4"/></button>
                    </div>
                    <textarea 
                      placeholder="Dear {{name}},..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full rounded-b-md border border-gray-300 px-4 py-3 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm font-sans"
                    />
                  </div>
                  
                  <div className="pt-2 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Personalization Variables</p>
                    <div className="flex flex-wrap gap-2">
                      {['{{name}}', '{{email}}', '{{company}}', '{{subscription_plan}}', '{{invoice_due}}', '{{login_link}}'].map(v => (
                        <button 
                          key={v} 
                          onClick={() => insertVariable(v)} 
                          className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 rounded shadow-sm text-xs font-mono cursor-pointer transition-all"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column / Sidebar */}
            <div className="col-span-1 space-y-6">
              
              {/* Section C — Attachments */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center">
                      <Paperclip className="w-4 h-4 mr-2 text-gray-500" /> Attachments
                   </h3>
                </div>
                <div className="p-5">
                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-50">
                        <Plus className="w-5 h-5 text-gray-500 group-hover:text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Drag & drop files here</p>
                      <p className="text-xs text-gray-400 mt-1 mb-3">OR</p>
                      <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">Browse Files</button>
                   </div>
                   <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">Supported: PDF, JPG, PNG, DOCX, CSV. <br/>Max size: 10MB per file.</p>
                </div>
              </div>

              {/* Section D — Scheduling */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" /> Schedule Delivery
                   </h3>
                </div>
                <div className="p-5 space-y-4">
                  <label className="flex items-start text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2 transition-colors">
                    <input type="radio" checked={scheduleOption === 'now'} onChange={() => setScheduleOption('now')} className="mr-3 mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500" /> 
                    <div>
                      <span className="font-medium block">Send Now</span>
                      <span className="text-xs text-gray-500 block mt-0.5">Dispatches immediately</span>
                    </div>
                  </label>
                  <label className="flex items-start text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2 transition-colors">
                    <input type="radio" checked={scheduleOption === 'later'} onChange={() => setScheduleOption('later')} className="mr-3 mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500" /> 
                    <div className="w-full">
                      <span className="font-medium block">Schedule for Later</span>
                      {scheduleOption === 'later' && (
                        <div className="grid grid-cols-2 gap-2 mt-3 w-full">
                           <input type="date" className="text-sm border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" />
                           <input type="time" className="text-sm border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="flex items-start text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2 transition-colors">
                    <input type="radio" checked={scheduleOption === 'batch'} onChange={() => setScheduleOption('batch')} className="mr-3 mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500" /> 
                    <div>
                      <span className="font-medium block">Send in Batches</span>
                      <span className="text-xs text-gray-500 block mt-0.5">100 emails per minute</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section E — Safety & Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-gray-500" /> Delivery Settings
                   </h3>
                </div>
                <div className="p-5 grid grid-cols-1 gap-3.5">
                   <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 h-4 w-4" defaultChecked /> Track opens and clicks
                   </label>
                   <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 h-4 w-4" defaultChecked /> Stop if bounce rate exceeds limit
                   </label>
                   <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 h-4 w-4" defaultChecked /> Allow unsubscribe link
                   </label>
                   <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="mr-3 rounded text-blue-600 focus:ring-blue-500 h-4 w-4" /> Send test email first
                   </label>
                </div>
              </div>
              
              {/* Action Buttons (Bottom Sticky area visually placed here for logic) */}
              <div className="pt-4 flex flex-col space-y-3">
                 <button disabled={isSending} onClick={() => handleSend(false)} className={`w-full py-3 rounded-lg text-sm font-medium text-white shadow-sm transition-colors flex items-center justify-center ${isSending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSending ? 'Processing...' : (
                      <><Send className="w-4 h-4 mr-2" /> Send Broadcast</>
                    )}
                 </button>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <button disabled={isSending} onClick={() => handleSend(true)} className="py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                     Send Test Email
                   </button>
                   <button disabled={isSending} onClick={() => handleSend(false)} className="py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                     Save Draft
                   </button>
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* History Tab Formatted matching spec completely */}
        {activeTab === 'history' && (
          <div className="max-w-7xl mx-auto w-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Email History</h3>
                  <p className="text-sm text-gray-500 mt-1">Review all your previous broadcast metrics and status</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                       <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Broadcast Name & Subject</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipients</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent By</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Open Rate</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {broadcasts.length === 0 ? (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">No broadcasts found. Go create one!</td></tr>
                       ) : broadcasts.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{b.name}</div>
                                <div className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{b.subject}</div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-medium">{b.sent_count?.toLocaleString() || 0} users</div>
                                <div className="text-xs text-gray-500 capitalize">{b.recipient_group}</div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  b.status === 'sent' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                  b.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                   {b.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                Admin
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${b.open_rate || 0}%` }}></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{b.open_rate || 0}%</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button className="text-blue-600 hover:text-blue-900 font-medium mr-4">View</button>
                                <button className="text-gray-500 hover:text-gray-900 font-medium mr-4">Resend</button>
                                <button className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
        
        {/* Placeholder Tabs */}
        {activeTab === 'templates' && (
           <div className="p-16 text-center bg-white rounded-lg shadow-sm border border-gray-200">
             <CheckSquare className="mx-auto w-12 h-12 text-gray-300 mb-4" />
             <h3 className="text-lg font-medium text-gray-900">Email Templates Library</h3>
             <p className="mt-2 text-sm text-gray-500">Welcome email, Password reset, Invoice reminder templates coming soon...</p>
           </div>
        )}
        {activeTab === 'settings' && (
           <div className="p-16 text-center bg-white rounded-lg shadow-sm border border-gray-200">
             <Settings className="mx-auto w-12 h-12 text-gray-300 mb-4" />
             <h3 className="text-lg font-medium text-gray-900">Delivery Settings</h3>
             <p className="mt-2 text-sm text-gray-500">Configure global SMTP, Bounce rules, and tracking features coming soon...</p>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminMessagingPanel;
