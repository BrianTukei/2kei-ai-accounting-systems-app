import React, { useState, useEffect } from "react";
import { fetchUsers, sendEmail } from "../services/adminMessagingService";
import UserTable from "./UserTable";
import EmailModal from "./EmailModal";

export default function AdminMessagingPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  const handleSend = async (subject, message) => {
    const emails = selectedUsers.map(u => u.email);
    const response = await sendEmail({ emails, subject, message });
    setAlert(response.results);
    setShowModal(false);
  };

  return (
    <div>
      <h2>Admin Messaging Panel</h2>
      <UserTable users={users} selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
      <button disabled={selectedUsers.length === 0} onClick={() => setShowModal(true)}>
        Send Email
      </button>
      {showModal && (
        <EmailModal onSend={handleSend} onClose={() => setShowModal(false)} />
      )}
      {alert && (
        <div>
          {alert.map(r => (
            <div key={r.email}>
              {r.email}: {r.status === "sent" ? "✅ Sent" : "❌ Failed"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
