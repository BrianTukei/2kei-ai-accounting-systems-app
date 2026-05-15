const emailQueue = require("../queues/emailQueue");
const { getAllRecipients } = require("../services/emailRecipientService");
const User = require("../models/User");
const Subscriber = require("../models/Subscriber");

async function getSubscribers(req, res) {
  try {
    const subscribers = await Subscriber.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: subscribers.length,
      data: subscribers
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get subscribers" });
  }
}

async function addSubscriber(req, res) {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const exists = await Subscriber.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Subscriber already exists" });
    }
    const newSubscriber = new Subscriber({ email, name, status: 'active' });
    await newSubscriber.save();
    res.status(201).json({ success: true, data: newSubscriber });
  } catch (error) {
    res.status(500).json({ error: "Failed to add subscriber" });
  }
}

async function broadcastEmail(req, res) {
  try {
    const { targetGroup, emails, subject, message, scheduledTime } = req.body;

    let recipients = [];
    if (emails && Array.isArray(emails) && emails.length > 0) {
      recipients = emails;
    } else {
      recipients = await getAllRecipients(targetGroup);
    }

    for (let email of recipients) {
      const jobOptions = { attempts: 3 };
      if (scheduledTime) {
        jobOptions.delay = new Date(scheduledTime).getTime() - Date.now();
      }

      await emailQueue.add(
        { email, subject, message },
        jobOptions
      );
    }

    res.json({
      success: true,
      totalRecipients: recipients.length
    });

  } catch (error) {
    res.status(500).json({ error: "Email broadcast failed" });
  }
}

async function getEmailCounts(req, res) {
  try {
    const users = await User.countDocuments({ isActive: true });
    const subscribers = await Subscriber.countDocuments({ status: 'active' });

    res.json({
      subscribers,
      users,
      both: users + subscribers
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get counts" });
  }
}

module.exports = {
  getSubscribers,
  addSubscriber,
  broadcastEmail,
  getEmailCounts
};
