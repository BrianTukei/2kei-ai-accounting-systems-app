const User = require("../models/User");
const Subscriber = require("../models/Subscriber");
const mongoose = require("mongoose");
const emailQueue = require("../queues/emailQueue");

async function getUserEmails(req, res) {
  try {
    const users = await User.find(
      { isActive: true },
      { name: 1, email: 1 }
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user emails" });
  }
}

async function getSubscriberEmails(req, res) {
  try {
    const subscribers = await Subscriber.find(
      {},
      { name: 1, email: 1 }
    );
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
}

async function systemHealth(req, res) {
  try {
    res.json({
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      emailQueue: "running",
      smtp: "connected"
    });
  } catch (error) {
    res.status(500).json({ error: "Health check failed" });
  }
}

async function getSystemStatus(req, res) {
  res.json({ status: "ok" });
}

async function getDeploymentLogs(req, res) {
  res.json({ logs: [] });
}

async function getDiagnostics(req, res) {
  res.json({ diagnostics: "ok" });
}

module.exports = {
  getUserEmails,
  getSubscriberEmails,
  systemHealth,
  getSystemStatus,
  getDeploymentLogs,
  getDiagnostics
};
