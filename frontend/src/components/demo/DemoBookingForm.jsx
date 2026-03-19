import React, { useState, useEffect } from 'react';
import { User, Building, Mail, Phone, Globe, Calendar, Clock, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'EST', label: 'EST (Eastern Standard Time)' },
  { value: 'CST', label: 'CST (Central Standard Time)' },
  { value: 'MST', label: 'MST (Mountain Standard Time)' },
  { value: 'PST', label: 'PST (Pacific Standard Time)' },
  { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
  { value: 'CET', label: 'CET (Central European Time)' },
  { value: 'IST', label: 'IST (India Standard Time)' },
  { value: 'JST', label: 'JST (Japan Standard Time)' },
  { value: 'AEST', label: 'AEST (Australian Eastern Standard Time)' }
];

export default function DemoBookingForm({ data, availableSlots, loading, onChange, onSubmit, onDateChange }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (data.name.trim().length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }
    
    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!data.company.trim()) {
      newErrors.company = 'Company name is required';
    } else if (data.company.trim().length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    } else if (data.company.trim().length > 200) {
      newErrors.company = 'Company name cannot exceed 200 characters';
    }
    
    if (data.phone && !/^[+]?[\d\s\-\(\)]+$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (data.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(data.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }
    
    if (!data.preferredDate) {
      newErrors.preferredDate = 'Preferred date is required';
    } else {
      const selectedDate = new Date(data.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.preferredDate = 'Please select a future date';
      }
    }
    
    if (!data.preferredTime) {
      newErrors.preferredTime = 'Preferred time is required';
    }
    
    if (data.message && data.message.length > 1000) {
      newErrors.message = 'Message cannot exceed 1000 characters';
    }
    
    return newErrors;
  };

  const handleInputChange = (field, value) => {
    onChange(field, value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setSubmitting(true);
      try {
        await onSubmit(data);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!data.preferredDate) return [];
    
    const selectedDate = new Date(data.preferredDate);
    const dayOfWeek = selectedDate.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }
    
    return availableSlots.filter(slot => slot.isAvailable);
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={data.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
                disabled={loading || submitting}
              />
            </div>
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={data.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
                disabled={loading || submitting}
              />
            </div>
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={data.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                onBlur={() => handleBlur('company')}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.company && touched.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Acme Corporation"
                disabled={loading || submitting}
              />
            </div>
            {errors.company && touched.company && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.company}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                  disabled={loading || submitting}
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={data.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  onBlur={() => handleBlur('website')}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.website && touched.website ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                  disabled={loading || submitting}
                />
              </div>
              {errors.website && touched.website && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.website}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Schedule Your Demo
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={data.preferredDate}
                onChange={(e) => {
                  handleInputChange('preferredDate', e.target.value);
                  onDateChange(e.target.value);
                }}
                onBlur={() => handleBlur('preferredDate')}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.preferredDate && touched.preferredDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || submitting}
              />
            </div>
            {errors.preferredDate && touched.preferredDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.preferredDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={data.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                onBlur={() => handleBlur('preferredTime')}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.preferredTime && touched.preferredTime ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || submitting}
              >
                <option value="">Select a time</option>
                {availableTimeSlots.map((slot) => (
                  <option key={slot._id} value={slot.time}>
                    {slot.time}
                  </option>
                ))}
              </select>
            </div>
            {errors.preferredTime && touched.preferredTime && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.preferredTime}
              </p>
            )}
            {availableTimeSlots.length === 0 && data.preferredDate && (
              <p className="mt-1 text-sm text-gray-500">
                No available time slots for this date. Please select another date.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={data.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || submitting}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Additional Information
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={data.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              onBlur={() => handleBlur('message')}
              rows={4}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.message && touched.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tell us about your accounting challenges and what you'd like to see in the demo..."
              disabled={loading || submitting}
            />
          </div>
          <div className="mt-1 text-right">
            <span className={`text-sm ${
              data.message.length > 900 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              {data.message.length} / 1000
            </span>
          </div>
          {errors.message && touched.message && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={loading || submitting || availableTimeSlots.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Booking Demo...
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              Book Your Demo
            </>
          )}
        </button>
        
        <p className="mt-3 text-sm text-gray-500 text-center">
          By booking a demo, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </form>
  );
}
