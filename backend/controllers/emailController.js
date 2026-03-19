const User = require("../models/User");
const EmailLog = require("../models/EmailLog");
const { sendEmail } = require("../services/emailService");

exports.sendEmail = async (req, res) => {
  const { userId, emails, subject, message } = req.body;
  const adminId = req.user._id; // from isAdmin middleware

  let recipients = [];
  if (userId) {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    recipients.push(user.email);
  } else if (Array.isArray(emails)) {
    recipients = emails;
  } else {
    return res.status(400).json({ error: "No recipients specified" });
  }

  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and message required" });
  }

  let results = [];
  for (const email of recipients) {
    const result = await sendEmail({ to: email, subject, text: message });
    await EmailLog.create({
      admin_id: adminId,
      recipient: email,
      subject,
      status: result.success ? "sent" : "failed"
    });
    results.push({ email, status: result.success ? "sent" : "failed" });
  }

  res.json({ results });
};
