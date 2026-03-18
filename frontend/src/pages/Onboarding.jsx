import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

/**
 * Onboarding Page
 * Company setup for new users
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { createCompany, loading } = useCompany();
  
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    baseCurrency: { code: 'USD', symbol: '$', name: 'US Dollar' },
    timezone: 'UTC',
    industry: 'other',
    businessType: 'sole_proprietorship'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const countries = [
    { code: 'US', name: 'United States', currency: 'USD', symbol: '$', timezone: 'America/New_York' },
    { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh', timezone: 'Africa/Kampala' },
    { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', timezone: 'Africa/Nairobi' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh', timezone: 'Africa/Dar_es_Salaam' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', timezone: 'Africa/Lagos' },
    { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵', timezone: 'Africa/Accra' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', timezone: 'Africa/Johannesburg' },
    { code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'ZK', timezone: 'Africa/Lusaka' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', timezone: 'Europe/London' },
    { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', timezone: 'Europe/Paris' }
  ];

  const industries = [
    { value: 'retail', label: 'Retail' },
    { value: 'services', label: 'Services' },
    { value: 'technology', label: 'Technology' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  const businessTypes = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llc', label: 'Limited Liability Company' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'non_profit', label: 'Non-Profit' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      handleAddressChange('country', countryCode);
      handleChange('baseCurrency', {
        code: country.currency,
        symbol: country.symbol,
        name: `${country.name} ${country.currency}`
      });
      handleChange('timezone', country.timezone);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Company email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.address.country) {
      newErrors.country = 'Country is required';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createCompany(formData);
      
      if (result.success) {
        toast.success('Company setup completed successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Failed to complete setup');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Set Up Your Company
          </h1>
          <p className="mt-2 text-gray-600">
            Let's get your business profile configured
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`}></div>
            <div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Step {step} of 2
          </p>
        </div>

        {/* Onboarding Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 ? 'Basic Information' : 'Location & Settings'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? 'Tell us about your company'
                : 'Configure your regional settings'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                // Step 1: Basic Information
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g., Acme Corporation"
                        className={errors.name ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legalName">Legal Name (if different)</Label>
                      <Input
                        id="legalName"
                        value={formData.legalName}
                        onChange={(e) => handleChange('legalName', e.target.value)}
                        placeholder="e.g., Acme Corp Ltd"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Business Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="contact@company.com"
                          className={errors.email ? 'border-red-500' : ''}
                          disabled={isSubmitting}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+1 234 567 8900"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://www.company.com"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <select
                          value={formData.industry}
                          onChange={(e) => handleChange('industry', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          disabled={isSubmitting}
                        >
                          {industries.map(industry => (
                            <option key={industry.value} value={industry.value}>
                              {industry.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Business Type</Label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => handleChange('businessType', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          disabled={isSubmitting}
                        >
                          {businessTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Step 2: Location & Settings
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <select
                        id="country"
                        value={formData.address.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        disabled={isSubmitting}
                      >
                        <option value="">Select country</option>
                        {countries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-sm text-red-600">{errors.country}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        placeholder="123 Main Street"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          placeholder="New York"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State/Region</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          placeholder="NY"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.address.postalCode}
                          onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                          placeholder="10001"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Base Currency (Auto-selected)</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <span className="font-medium">
                            {formData.baseCurrency.symbol} {formData.baseCurrency.code}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            {formData.baseCurrency.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Currency is automatically set based on your country
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone (Auto-selected)</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          <span className="font-medium">{formData.timezone}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Timezone is automatically set based on your country
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Error Alert */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex space-x-3">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {step === 1 ? 'Next' : 'Completing Setup...'}
                    </>
                  ) : (
                    step === 1 ? 'Next Step' : 'Complete Setup'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-gray-500"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
