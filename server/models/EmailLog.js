const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EmailLog', EmailLogSchema);
