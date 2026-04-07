const { Queue } = require('bullmq');
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  // password: process.env.REDIS_PASSWORD
};

// Create a new BullMQ queue for email campaigns
const emailCampaignQueue = new Queue('EmailCampaignQueue', { connection });

module.exports = {
  emailCampaignQueue,
  connection
};