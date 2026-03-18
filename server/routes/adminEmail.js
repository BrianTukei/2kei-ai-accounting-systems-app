const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');

router.post('/send-email', isAdmin, async (req, res) => {
  const { userId, emails, subject, message } = req.body;
  let recipients = [];

  if (userId) {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    recipients.push(user.email);
  }
  if (emails && Array.isArray(emails)) {
    recipients = recipients.concat(emails);
  }
  if (!recipients.length) return res.status(400).json({ error: 'No recipients specified' });

  const result = await sendEmail({ recipients, subject, message });

  // Log email
  for (const recipient of recipients) {
    await EmailLog.create({
      admin_id: req.user._id,
      recipient,
      subject,
      status: result.success ? 'sent' : 'failed',
      timestamp: new Date(),
    });
  }

  if (result.success) {
    res.json({ message: 'Email sent successfully', info: result.info });
  } else {
    res.status(500).json({ error: 'Failed to send email', details: result.error });
  }
});

module.exports = router;
