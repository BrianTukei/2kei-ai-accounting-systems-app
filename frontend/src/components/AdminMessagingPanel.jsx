import React, { useState, useEffect } from "react";
import { fetchUsers, sendEmail } from "../services/adminMessagingService";
import UserTable from "./UserTable";
import EmailModal from "./EmailModal";
import { Search, Users, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function AdminMessagingPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [alert, setAlert] = useState(null);
  const [stats, setStats] = useState({ total: 0, selected: 0, sent: 0, failed: 0 });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      setAlert({ type: "error", message: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(user => user.isActive === (filterStatus === "active"));
    }

    setFilteredUsers(filtered);
    updateStats(filtered);
  };

  const updateStats = (filtered = users) => {
    setStats({
      total: users.length,
      selected: selectedUsers.length,
      sent: 0,
      failed: 0
    });
  };

  const handleSend = async (subject, message, emailType = "admin_message") => {
    try {
      setLoading(true);
      
      const emails = selectedUsers.map(u => u.email);
      const response = await sendEmail({ emails, subject, message, type: emailType });
      
      if (response.success) {
        const sent = response.data.results?.filter(r => r.success).length || 0;
        const failed = response.data.results?.filter(r => !r.success).length || 0;
        
        setAlert({
          type: "success",
          message: `Email sent successfully! ${sent} sent, ${failed} failed`,
          details: response.data.results
        });
        
        setStats(prev => ({ ...prev, sent, failed }));
        setSelectedUsers([]);
        setShowModal(false);
      } else {
        setAlert({ type: "error", message: response.error || "Failed to send email" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Failed to send email" });
    } finally {
      setLoading(false);
    }
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers);
    }
  };

  const clearAlert = () => {
    setAlert(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Messaging</h1>
              <p className="text-sm text-gray-500">Send messages to users</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Selected Users</p>
              <p className="text-lg font-semibold text-blue-600">{stats.selected}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={selectedUsers.length === 0 || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-blue-600">{stats.selected}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="accountant">Accountant</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button
            onClick={selectAllUsers}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`rounded-lg border p-4 ${
          alert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {alert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                alert.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {alert.message}
              </p>
              {alert.details && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Email Details:</p>
                  <div className="space-y-1">
                    {alert.details.map((result, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{result.recipient}</span>
                        <span className={`flex items-center ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.success ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Sent
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Failed
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={clearAlert}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <UserTable
          users={filteredUsers}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          loading={loading}
        />
      </div>

      {/* Email Modal */}
      {showModal && (
        <EmailModal
          onSend={handleSend}
          onClose={() => setShowModal(false)}
          selectedCount={selectedUsers.length}
        />
      )}
    </div>
  );
}
