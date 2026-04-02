const logger = require('../utils/logger');

// Lightweight notification adapter used by subscription service.
// Keeps backend startup resilient even if email/sms integrations are unavailable.
class NotificationService {
  async sendPaymentConfirmation(user, transaction, subscription) {
    logger.info('Notification: payment confirmation queued', {
      userId: user?._id,
      transactionId: transaction?._id,
      subscriptionId: subscription?._id,
    });
  }

  async sendPaymentFailure(user, transaction) {
    logger.warn('Notification: payment failure queued', {
      userId: user?._id,
      transactionId: transaction?._id,
    });
  }

  async sendUsageLimitNotification(user, feature, limitCheck) {
    logger.warn('Notification: usage limit alert queued', {
      userId: user?._id,
      feature,
      limitCheck,
    });
  }

  async sendAICreditsConfirmation(user, credits, totalCost, transaction) {
    logger.info('Notification: AI credits confirmation queued', {
      userId: user?._id,
      credits,
      totalCost,
      transactionId: transaction?._id,
    });
  }

  async sendExpiryWarning(user, subscription) {
    logger.warn('Notification: subscription expiry warning queued', {
      userId: user?._id,
      subscriptionId: subscription?._id,
    });
  }

  async sendPaymentReminder(user, subscription) {
    logger.info('Notification: payment reminder queued', {
      userId: user?._id,
      subscriptionId: subscription?._id,
    });
  }
}

module.exports = new NotificationService();
