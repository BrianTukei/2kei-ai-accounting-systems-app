import React from 'react';
import { CheckCircle, Calendar, Clock, Mail, ArrowRight, Download, Share } from 'lucide-react';

export default function BookingSuccess({ booking, onReset }) {
  const handleAddToCalendar = () => {
    // Create Google Calendar link
    const startDate = new Date(booking.preferredDate);
    const [hours, minutes] = booking.preferredTime.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // 30 minute demo
    
    const title = '2K AI Accounting Demo';
    const description = `Your personalized demo of 2K AI Accounting Systems. Join us to see how AI-powered accounting can transform your business.\n\nCompany: ${booking.company}\nEmail: ${booking.email}`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&dates=${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(description)}&location=Online`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleShareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: '2K AI Accounting Demo Booked',
        text: `I've booked a demo with 2K AI Accounting for ${new Date(booking.preferredDate).toLocaleDateString()} at ${booking.preferredTime}`,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Demo Booked Successfully! 🎉
            </h1>
            <p className="text-green-100">
              Your demo has been scheduled. We've sent a confirmation email to you.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Booking Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Booking Details
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{booking.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{booking.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium text-gray-900">{booking.company}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(booking.preferredDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {booking.preferredTime}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Pending Confirmation
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What's Next?
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Check Your Email</h3>
                    <p className="text-gray-600 text-sm">
                      We've sent a confirmation email with all the details and meeting link.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Add to Calendar</h3>
                    <p className="text-gray-600 text-sm">
                      Add the demo to your calendar so you don't forget.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Prepare for Demo</h3>
                    <p className="text-gray-600 text-sm">
                      Think about your current accounting challenges and questions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">4</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Join the Demo</h3>
                    <p className="text-gray-600 text-sm">
                      Click the meeting link in your email at the scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCalendar}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Add to Google Calendar
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShareBooking}
                  className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
                >
                  <Share className="w-5 h-5 mr-2" />
                  Share
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Save PDF
                </button>
              </div>
              
              <button
                onClick={onReset}
                className="w-full text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Book Another Demo
              </button>
            </div>

            {/* Contact Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-900">Need to Reschedule?</h3>
                  <p className="text-blue-700 text-sm">
                    Simply reply to the confirmation email or call us at +1-555-0123.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="flex justify-center items-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">Free 30-day trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm">No credit card required</span>
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
