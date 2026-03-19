import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Building, Mail, Phone, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import DemoBookingForm from '../components/demo/DemoBookingForm';
import BookingSuccess from '../components/demo/BookingSuccess';
import { getAvailableSlots } from '../services/demoService';

export default function BookDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingData(prev => ({
      ...prev,
      preferredDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (bookingData.preferredDate) {
      fetchAvailableSlots();
    }
  }, [bookingData.preferredDate]);

  const fetchAvailableSlots = async () => {
    if (!bookingData.preferredDate) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await getAvailableSlots(bookingData.preferredDate);
      
      if (response.success) {
        setAvailableSlots(response.data.availableSlots);
      } else {
        setError('Failed to fetch available time slots');
      }
    } catch (err) {
      setError('Failed to fetch available time slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/demo/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setBookingResult(result.data.booking);
        setBookingComplete(true);
        setCurrentStep(3);
      } else {
        setError(result.error || 'Failed to book demo');
      }
    } catch (err) {
      setError('Failed to book demo. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (bookingComplete) {
    return (
      <BookingSuccess 
        booking={bookingResult}
        onReset={() => {
          setBookingComplete(false);
          setCurrentStep(1);
          setBookingData({
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
        }}
      />
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
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                    <h3 className="font-semibold mb-1">Live AI Demonstration</h3>
                    <p className="text-blue-100 text-sm">
                      Watch our AI automate bookkeeping, categorization, and reporting in real-time
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
                      Get answers to your specific questions from our product experts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold mb-1">Custom Pricing</h3>
                    <p className="text-blue-100 text-sm">
                      Receive a personalized quote based on your business requirements
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold mb-3">Demo Duration</h3>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>30 minutes</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <h3 className="font-semibold mb-3">What to Prepare</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Your current accounting challenges</li>
                  <li>• Questions about AI automation</li>
                  <li>• Stable internet connection</li>
                  <li>• Optional: Camera and microphone</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-8">
              <DemoBookingForm
                data={bookingData}
                availableSlots={availableSlots}
                loading={loading}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                onDateChange={(date) => handleInputChange('preferredDate', date)}
              />
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">30-day free trial available</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
