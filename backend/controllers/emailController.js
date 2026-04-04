const User = require("../models/User");
const EmailLog = require("../models/EmailLog");
const Subscriber = require("../models/Subscriber");
const { sendEmail } = require("../services/emailService");
const { v4: uuidv4 } = require("uuid");

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
    const messageId = uuidv4();
    try {
      const result = await sendEmail({ to: email, subject, text: message, html: message });
      const success = result && result.success;
      
      await EmailLog.create({
        messageId,
        recipient: email,
        subject,
        message,
        admin: adminId,
        status: success ? "sent" : "failed",
        type: "admin_message"
      });
      results.push({ email, status: success ? "sent" : "failed" });
    } catch (err) {
      await EmailLog.create({
        messageId,
        recipient: email,
        subject,
        message,
        admin: adminId,
        status: "failed",
        error: { message: err.message },
        type: "admin_message"
      });
      results.push({ email, status: "failed" });
    }
  }

  res.json({ results });
};

exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ success: true, count: subscribers.length, subscribers });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
};

exports.addSubscriber = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.status !== 'active') {
        existing.status = 'active';
        await existing.save();
        return res.json({ success: true, message: "Subscriber reactivated", subscriber: existing });
      }
      return res.status(400).json({ error: "Subscriber already exists" });
    }

    const subscriber = new Subscriber({ email, name });
    await subscriber.save();

    res.status(201).json({ success: true, message: "Subscriber added successfully", subscriber });
  } catch (error) {
    console.error("Error adding subscriber:", error);
    res.status(500).json({ error: "Failed to add subscriber" });
  }
};

exports.broadcastEmail = async (req, res) => {
  try {
    const { subject, message, sendTo } = req.body;
    const adminId = req.user._id;

    if (!subject || !message || !sendTo) {
      return res.status(400).json({ error: "Subject, message, and sendTo are required" });
    }

    let recipients = [];
    if (sendTo === 'all') {
      const subscribers = await Subscriber.find({ status: 'active' });
      recipients = subscribers.map(sub => sub.email);
    } else if (Array.isArray(sendTo)) {
      recipients = sendTo;
    } else {
      return res.status(400).json({ error: "Invalid sendTo format" });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: "No recipients found" });
    }

    const bulkId = uuidv4();
    let sentCount = 0;
    let failedCount = 0;
    let results = [];

    for (const email of recipients) {
      const messageId = uuidv4();
      try {
        const result = await sendEmail({ to: email, subject, text: message, html: message });
        const success = result && result.success;
        
        await EmailLog.create({
          messageId,
          recipient: email,
          subject,
          message,
          admin: adminId,
          status: success ? 'sent' : 'failed',
          type: 'bulk_campaign',
          bulkId
        });

        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }
        results.push({ email, status: success ? 'sent' : 'failed' });
      } catch (err) {
        await EmailLog.create({
          messageId,
          recipient: email,
          subject,
          message,
          admin: adminId,
          status: 'failed',
          error: { message: err.message },
          type: 'bulk_campaign',
          bulkId
        });
        failedCount++;
        results.push({ email, status: 'failed' });
      }
    }

    res.json({
      success: true,
      message: `Broadcast completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      summary: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount
      },
      bulkId,
      results
    });
  } catch (error) {
    console.error("Error broadcasting emails:", error);
    res.status(500).json({ error: "Failed to broadcast emails" });
  }
};
