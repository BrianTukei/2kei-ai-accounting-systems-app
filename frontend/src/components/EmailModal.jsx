import React, { useState } from "react";
import { Mail, Send, X, FileText, AlertCircle, Clock } from "lucide-react";

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    message: ''
  },
  {
    id: 'welcome',
    name: 'Welcome Message',
    subject: 'Welcome to 2K AI Accounting!',
    message: `Dear {firstName},

Welcome to 2K AI Accounting! We're excited to have you on board.

Your account has been set up and you now have access to all our powerful features:
- Smart financial dashboard
- Automated expense tracking
- AI-powered insights
- Professional invoicing

If you have any questions, please don't hesitate to reach out to our support team.

Best regards,
The 2K AI Accounting Team`
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    subject: 'Payment Reminder - 2K AI Accounting',
    message: `Dear {firstName},

This is a friendly reminder about your subscription payment for 2K AI Accounting.

Your payment is due to ensure uninterrupted access to all features:
- Real-time financial insights
- Automated bookkeeping
- AI-powered recommendations
- Priority support

Please update your payment method at your earliest convenience.

Thank you for your continued support!

Best regards,
The 2K AI Accounting Team`
  },
  {
    id: 'feature_update',
    name: 'Feature Update',
    subject: 'Exciting New Features in 2K AI Accounting!',
    message: `Dear {firstName},

We're excited to announce new features in 2K AI Accounting:

🚀 New Features:
- Enhanced AI-powered financial insights
- Improved dashboard with real-time analytics
- Advanced reporting capabilities
- Mobile app for on-the-go management

These updates are designed to help you make smarter financial decisions and save time on your accounting tasks.

Log in to your account to explore these new features!

Best regards,
The 2K AI Accounting Team`
  },
  {
    id: 'expiry_warning',
    name: 'Subscription Expiry Warning',
    subject: 'Action Required: Subscription Expiring Soon',
    message: `Dear {firstName},

This is an important notice regarding your 2K AI Accounting subscription.

Your subscription will expire in {days} days. To continue enjoying:
- Unlimited transactions
- AI-powered insights
- Priority support
- Advanced reporting

Please renew your subscription before the expiry date to avoid any interruption in service.

Need help? Our support team is here to assist you.

Best regards,
The 2K AI Accounting Team`
  }
];

export default function EmailModal({ onSend, onClose, selectedCount = 0 }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!message.trim()) {
      newErrors.message = "Message is required";
    }
    
    if (message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    if (message.length > 10000) {
      newErrors.message = "Message cannot exceed 10,000 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTemplateChange = (templateId) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setMessage(template.message);
      setErrors({});
    }
  };

  const handleSend = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(subject, message, selectedTemplate);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const characterCount = message.length;
  const maxCharacters = 10000;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-25" onClick={onClose} />
        
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Send Email</h2>
                <p className="text-sm text-gray-500">
                  {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {EMAIL_TEMPLATES.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={200}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.message && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.message}
                  </p>
                )}
                <span className={`text-sm ${
                  characterCount > maxCharacters * 0.9 ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {characterCount} / {maxCharacters}
                </span>
              </div>
            </div>

            {/* Template Variables Info */}
            {selectedTemplate !== 'custom' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Template Variables</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Available variables: {'{firstName}'}, {'{days}'}, etc.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              <Clock className="w-4 h-4 inline mr-1" />
              Emails will be sent immediately
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || selectedCount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedCount} {selectedCount === 1 ? 'User' : 'Users'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
