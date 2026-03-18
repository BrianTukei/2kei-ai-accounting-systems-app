import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Send, 
  Users, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

/**
 * Email Templates Manager
 * Pre-built email templates for common communications
 */
const EMAIL_TEMPLATES = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to 2K AI Accounting System!',
    message: `Hi {{firstName}},

Welcome to 2K AI Accounting! We're excited to have you on board.

Your account has been successfully created and you can now start managing your business finances with our powerful tools.

Quick Start:
• Complete your company profile
• Add your first transaction
• Generate your first report
• Explore our AI-powered features

If you have any questions, our support team is here to help.

Best regards,
The 2K AI Accounting Team`
  },
  
  payment_reminder: {
    name: 'Payment Reminder',
    subject: 'Payment Reminder - 2K AI Accounting Subscription',
    message: `Hi {{firstName}},

This is a friendly reminder that your subscription payment is due.

Plan: {{planName}}
Amount: ${{amount}}/{{billingCycle}}
Due Date: {{dueDate}}

Please update your payment method to ensure uninterrupted service.

Thank you for choosing 2K AI Accounting!`
  },
  
  expiry_warning: {
    name: 'Subscription Expiry Warning',
    subject: 'Your Subscription Expires in {{daysLeft}} Days',
    message: `Hi {{firstName}},

Your subscription will expire in {{daysLeft}} days.

Current Plan: {{planName}}
Expiry Date: {{expiryDate}}

Don't lose access to your financial data. Renew your subscription today!

Need help? Contact our support team.`
  },
  
  feature_announcement: {
    name: 'Feature Announcement',
    subject: 'Exciting New Features in 2K AI Accounting!',
    message: `Hi {{firstName}},

We're excited to announce new features that will enhance your accounting experience:

🚀 New Features:
• AI-powered transaction categorization
• Advanced reporting dashboard
• Mobile app (coming soon)
• Enhanced multi-currency support

These features are now available in your dashboard. Log in to explore!

We're committed to helping you manage your finances better.

Best,
The 2K AI Team`
  },
  
  maintenance_notice: {
    name: 'Maintenance Notice',
    subject: 'Scheduled Maintenance - 2K AI Accounting',
    message: `Hi {{firstName}},

We will be performing scheduled maintenance to improve our services.

Maintenance Window:
Date: {{date}}
Time: {{time}}
Duration: {{duration}}

During this time, you may experience temporary service interruptions. We apologize for any inconvenience.

All your data is safe and will be available once maintenance is complete.

Thank you for your patience!`
  }
};

/**
 * Email Templates Component
 */
export function EmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    planName: 'Professional',
    amount: '49',
    billingCycle: 'month',
    dueDate: new Date().toLocaleDateString(),
    daysLeft: '7',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    date: 'March 20, 2026',
    time: '2:00 AM UTC',
    duration: '2 hours'
  });

  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Get current template
  const currentTemplate = selectedTemplate ? EMAIL_TEMPLATES[selectedTemplate] : null;

  // Process template with variables
  const processTemplate = (template) => {
    let processed = template;
    
    // Replace variables with preview data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  };

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    if (!currentTemplate) {
      toast.error('Please select a template');
      return;
    }

    setSending(true);
    
    try {
      const response = await api.post('/admin/send-email', {
        emails: [testEmail],
        subject: currentTemplate.subject,
        message: processTemplate(currentTemplate.message),
        type: 'admin_message'
      });

      if (response.data.success) {
        toast.success('Test email sent successfully!');
        setTestEmail('');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Email Templates
        </h1>
        <p className="text-gray-600">Pre-built templates for common communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                <div
                  key={key}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                    </div>
                    {selectedTemplate === key && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Preview & Edit */}
        {currentTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {currentTemplate.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={currentTemplate.subject}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={processTemplate(currentTemplate.message)}
                  readOnly
                  className="bg-gray-50 min-h-[300px]"
                />
              </div>

              {/* Template Variables */}
              <div className="space-y-2">
                <Label>Template Variables</Label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Available variables for this template:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentTemplate.message.match(/{{\w+}}/g)?.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test Email */}
              <div className="space-y-2">
                <Label>Send Test Email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sending || !testEmail}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Variables Editor */}
      {currentTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(previewData).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {{key}}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) => setPreviewData(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EmailTemplates;
