import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailCampaignManager = () => {
  const [counts, setCounts] = useState({
    subscriberCount: 0,
    userCount: 0,
    bothCount: 0,
  });
  
  const [formData, setFormData] = useState({
    name: 'Campaign ' + new Date().toISOString().split('T')[0],
    subject: '',
    message: '',
    recipient_group: 'both',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      // Assuming authorization token is available globally or via interceptor
      const res = await axios.get('/api/admin/broadcasts/recipients', {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
      });
      setCounts(res.data.data);
    } catch (err) {
      console.error('Error fetching recipient counts:', err);
    }
  };

  const handleSendOrSave = async (isDraft = false) => {
    setLoading(true);
    setMessage('');
    
    try {
      const payload = {
        name: formData.name,
        subject: formData.subject,
        message: formData.message,
        recipient_group: formData.recipient_group,
        status: isDraft ? 'draft' : 'draft', // we first create a draft
      };

      const res = await axios.post('/api/admin/broadcasts', payload, {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
      });

      const broadcastId = res.data.data.id;

      if (!isDraft) {
        // Automatically send the broadcast to the queue
        await axios.post(`/api/admin/broadcasts/\${broadcastId}/send`, {}, {
          headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
        });
        setMessage('Campaign has been successfully queued for sending!');
      } else {
        setMessage('Draft saved successfully!');
      }
    } catch (err) {
      setMessage('Error processing campaign: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const testEmail = prompt("Enter email address to send test to:");
    if (!testEmail) return;

    try {
      // First save draft
      const payload = {
        name: formData.name + ' (Test)',
        subject: formData.subject,
        message: formData.message,
        recipient_group: formData.recipient_group,
        status: 'draft',
      };

      const res = await axios.post('/api/admin/broadcasts', payload, {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
      });

      const broadcastId = res.data.data.id;
      
      await axios.post(`/api/admin/broadcasts/\${broadcastId}/test`, { email: testEmail }, {
        headers: { Authorization: `Bearer \${localStorage.getItem('token')}` }
      });
      alert('Test email queued/sent!');
    } catch (error) {
      alert('Error sending test email.');
    }
  };

  return (
    <div className="campaign-manager-container p-6 max-w-4xl mx-auto bg-white shadow rounded-md">
      <h1 className="text-2xl font-bold mb-2">Email Campaign Manager</h1>
      <p className="text-gray-600 mb-6">Send announcements, updates, reminders, and alerts.</p>
      
      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}

      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Target Audience</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="recipient_group" 
              value="subscribers"
              checked={formData.recipient_group === 'subscribers'}
              onChange={(e) => setFormData({ ...formData, recipient_group: e.target.value })}
            />
            <span>Target Subscribers ({counts.subscriberCount})</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="recipient_group" 
              value="users"
              checked={formData.recipient_group === 'users'}
              onChange={(e) => setFormData({ ...formData, recipient_group: e.target.value })}
            />
            <span>System Users ({counts.userCount})</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="radio" 
              name="recipient_group" 
              value="both"
              checked={formData.recipient_group === 'both'}
              onChange={(e) => setFormData({ ...formData, recipient_group: e.target.value })}
            />
            <span>Both Lists De-duplicated ({counts.bothCount})</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input
            className="w-full border rounded p-2"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            className="w-full border rounded p-2"
            placeholder="[ Enter email subject ]"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Message (HTML Supported)</label>
          <textarea
            className="w-full border rounded p-2 h-40"
            placeholder="<html><body><h1>Your message here</h1>...</body></html>"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button 
          onClick={() => handleSendOrSave(false)}
          disabled={loading || !formData.subject || !formData.message}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Send Bulk Campaign'}
        </button>
        <button 
          onClick={handleTest}
          disabled={loading || !formData.subject || !formData.message}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Send Test Email
        </button>
        <button 
          onClick={() => handleSendOrSave(true)}
          disabled={loading || !formData.subject || !formData.message}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Save Draft
        </button>
      </div>
    </div>
  );
};

export default EmailCampaignManager;