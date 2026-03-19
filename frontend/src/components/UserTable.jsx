import React from "react";

export default function UserTable({ users, selectedUsers, setSelectedUsers }) {
  const toggleUser = user => {
    setSelectedUsers(
      selectedUsers.some(u => u._id === user._id)
        ? selectedUsers.filter(u => u._id !== user._id)
        : [...selectedUsers, user]
    );
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Select</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user._id}>
            <td>
              <input
                type="checkbox"
                checked={selectedUsers.some(u => u._id === user._id)}
                onChange={() => toggleUser(user)}
              />
            </td>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
