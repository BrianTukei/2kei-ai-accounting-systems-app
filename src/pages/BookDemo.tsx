import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

interface BookingData {
  name: string;
  email: string;
  company: string;
  phone: string;
  website?: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  message?: string;
  source: string;
}

export default function BookDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    preferredDate: '',
    preferredTime: '',
    timezone: 'UTC',
    message: '',
    source: 'website'
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [error, setError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Initialize with tomorrow's date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      preferredDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = (): boolean => {
    if (!bookingData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!bookingData.email.trim() || !bookingData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!bookingData.company.trim()) {
      setError('Please enter your company name');
      return false;
    }
    if (!bookingData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!bookingData.preferredDate) {
      setError('Please select a preferred date');
      return false;
    }
    if (!bookingData.preferredTime) {
      setError('Please select a preferred time');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (submittingForm) return;
    
    try {
      setSubmittingForm(true);
      setError('');

      const response = await fetch('/api/demo/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        setBookingResult(result.data?.booking || bookingData);
        setBookingComplete(true);
        setCurrentStep(3);
      } else {
        setError(result.error || result.message || 'Failed to book demo');
      }
    } catch (err) {
      setError('Failed to book demo. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleReset = () => {
    setBookingComplete(false);
    setCurrentStep(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData({
      name: '',
      email: '',
      company: '',
      phone: '',
      website: '',
      preferredDate: tomorrow.toISOString().split('T')[0],
      preferredTime: '',
      timezone: 'UTC',
      message: '',
      source: 'website'
    });
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Booked Successfully!
          </h2>
          {bookingResult && (
            <>
              <p className="text-gray-600 mb-4">
                Thank you, <span className="font-semibold">{bookingResult.name}</span>!
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Date:</strong> {bookingResult.preferredDate}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Time:</strong> {bookingResult.preferredTime}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Timezone:</strong> {bookingResult.timezone}
                </p>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                A confirmation email has been sent to <span className="font-semibold">{bookingResult.email}</span>
              </p>
            </>
          )}
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Book Another Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book a Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how 2K AI Accounting can transform your business with a personalized demo
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <User className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Your Info
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <Calendar className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Schedule
              </span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Info */}
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h2 className="text-2xl font-bold mb-6">
                What to Expect in Your Demo
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold mb-1">Personalized Walkthrough</h3>
                    <p className="text-blue-100 text-sm">
                      See exactly how 2K AI Accounting works for your specific business needs
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold mb-1">Q&A Session</h3>
                    <p className="text-blue-100 text-sm">
                      Ask questions and get answers from our accounting and AI experts
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold mb-1">Special Offer</h3>
                    <p className="text-blue-100 text-sm">
                      Exclusive discounts and pricing for demo participants
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/20">
                <div className="flex items-center text-sm text-blue-100">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Duration: 30 minutes</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="john@company.com"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={bookingData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Your Company"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={bookingData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="https://company.com"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={bookingData.preferredDate}
                    onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time *
                  </label>
                  <select
                    value={bookingData.preferredTime}
                    onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">Select a time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={bookingData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern (EST)</option>
                    <option value="CST">Central (CST)</option>
                    <option value="MST">Mountain (MST)</option>
                    <option value="PST">Pacific (PST)</option>
                    <option value="GMT">GMT</option>
                    <option value="CET">Central European (CET)</option>
                    <option value="IST">Indian (IST)</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={bookingData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Tell us about your business and what you'd like to see in the demo..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition mt-6"
                >
                  {submittingForm ? 'Booking...' : 'Book Your Demo'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>* Required fields</p>
        </div>
      </div>
    </div>
  );
}
