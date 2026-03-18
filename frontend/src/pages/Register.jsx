import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Register Component
 * Handles user registration with company creation
 */
export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    // User info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Company info
    companyName: '',
    companyEmail: '',
    baseCurrency: 'USD',
    country: 'US',
    
    // Terms
    agreeToTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // Multi-step registration

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' }
  ];

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'UG', name: 'Uganda' },
    { code: 'KE', name: 'Kenya' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'GH', name: 'Ghana' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.companyEmail) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Company email is invalid';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
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
      const companyData = {
        name: formData.companyName,
        email: formData.companyEmail,
        baseCurrency: {
          code: formData.baseCurrency,
          symbol: currencies.find(c => c.code === formData.baseCurrency)?.symbol || '$',
          name: currencies.find(c => c.code === formData.baseCurrency)?.name || 'US Dollar'
        },
        address: {
          country: formData.country
        },
        timezone: formData.country === 'UG' ? 'Africa/Kampala' : 'UTC'
      };

      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        companyData
      });
      
      if (result.success) {
        toast.success('Registration successful! Welcome to 2K AI Accounting!');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">2K</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your finances with AI-powered accounting
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`h-2 w-8 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`}></div>
            <div className={`h-2 w-8 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Step {step} of 2
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 ? 'Personal Information' : 'Company Information'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? 'Tell us about yourself to get started'
                : 'Set up your company profile'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                // Step 1: Personal Information
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className={errors.firstName ? 'border-red-500' : ''}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className={errors.lastName ? 'border-red-500' : ''}
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Must contain uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              ) : (
                // Step 2: Company Information
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        className={`pl-10 ${errors.companyName ? 'border-red-500' : ''}`}
                        placeholder="Acme Corporation"
                        value={formData.companyName}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.companyName && (
                      <p className="text-sm text-red-600">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        required
                        className={`pl-10 ${errors.companyEmail ? 'border-red-500' : ''}`}
                        placeholder="contact@company.com"
                        value={formData.companyEmail}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.companyEmail && (
                      <p className="text-sm text-red-600">{errors.companyEmail}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        name="country"
                        className="w-full p-2 border rounded-md"
                        value={formData.country}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        {countries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baseCurrency">Base Currency</Label>
                      <select
                        id="baseCurrency"
                        name="baseCurrency"
                        className="w-full p-2 border rounded-md"
                        value={formData.baseCurrency}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, agreeToTerms: checked }))
                        }
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </Label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
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
                      {step === 1 ? 'Next' : 'Creating Account...'}
                    </>
                  ) : (
                    step === 1 ? 'Next Step' : 'Create Account'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Already have an account?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
