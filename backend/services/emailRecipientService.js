const User = require("../models/User");
const Subscriber = require("../models/Subscriber");

async function getAllRecipients(targetGroup) {
  let users = [];
  let subscribers = [];

  if (targetGroup === "users" || targetGroup === "both") {
    users = await User.find(
      { isActive: true }, // Not status 'active' due to schema mapping issues in previous interactions
      { email: 1 }
    );
  }

  if (targetGroup === "subscribers" || targetGroup === "both") {
    subscribers = await Subscriber.find(
      {},
      { email: 1 }
    );
  }

  const emails = [
    ...users.map(u => u.email),
    ...subscribers.map(s => s.email)
  ];

  return [...new Set(emails)];
}

module.exports = {
  getAllRecipients
};
