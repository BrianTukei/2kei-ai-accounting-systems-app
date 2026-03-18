import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminMessagingPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsers(res.data));
  }, []);

  const handleSelect = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSend = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const emails = users.filter(u => selectedUsers.includes(u._id)).map(u => u.email);
      const res = await axios.post('/api/admin/send-email', {
        emails,
        subject,
        message,
      });
      setAlert({ type: 'success', text: res.data.message });
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.error || 'Failed to send email' });
    }
    setLoading(false);
  };

  return (
    <div className="admin-messaging-panel">
      <h2>Send Message to Users</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map(user => (
            <tr key={user._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleSelect(user._id)}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={e => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={handleSend} disabled={loading || !selectedUsers.length || !subject || !message}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
      {alert && <div className={`alert ${alert.type}`}>{alert.text}</div>}
    </div>
  );
}

export default AdminMessagingPanel;
