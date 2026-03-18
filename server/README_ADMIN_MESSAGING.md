# Admin Messaging Feature

## Backend

- Email service: `server/services/emailService.js`
- Email logs: `server/models/EmailLog.js`
- Admin email API: `server/routes/adminEmail.js`
- Admin user list API: `server/routes/adminUsers.js`
- Admin middleware: `server/middleware/isAdmin.js`
- User model: `server/models/User.js`

## Frontend

- Admin Messaging Panel: `src/components/admin/AdminMessagingPanel.jsx`
- Admin Messaging Page: `src/pages/admin/AdminMessagingPage.jsx`

## Example API Request

POST `/api/admin/send-email`
```
{
  "emails": ["user1@example.com", "user2@example.com"],
  "subject": "Important Update",
  "message": "Your account has been updated."
}
```

Response:
```
{
  "message": "Email sent successfully",
  "info": { ...nodemailer info... }
}
```

## Folder Structure

```
server/
  services/
    emailService.js
  models/
    EmailLog.js
    User.js
  routes/
    adminEmail.js
    adminUsers.js
  middleware/
    isAdmin.js
src/
  components/
    admin/
      AdminMessagingPanel.jsx
  pages/
    admin/
      AdminMessagingPage.jsx
```

## Production Notes
- Use environment variables for email credentials
- Only admin can access messaging routes
- Logs all email sends
- Handles bulk and single messaging
- Shows success/error states in UI
