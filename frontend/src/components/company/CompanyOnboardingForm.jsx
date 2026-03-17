import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, MapPin, Globe, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/countries';

/**
 * Company Onboarding Form
 * Collects company details during signup process
 */
export function CompanyOnboardingForm() {
  const navigate = useNavigate();
  const { createCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      country: 'UG'
    },
    baseCurrency: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
    timezone: 'Africa/Kampala',
    industry: 'other',
    businessType: 'sole_proprietorship'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  // Auto-set currency based on country
  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES[countryCode];
    if (country) {
      handleAddressChange('country', countryCode);
      handleChange('baseCurrency', {
        code: country.currency,
        symbol: country.currencySymbol,
        name: country.currencyName
      });
      handleChange('timezone', country.timezone);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await createCompany(formData);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-2xl">Set Up Your Company</CardTitle>
        </div>
        <CardDescription>
          Enter your business details to get started with 2K AI Accounting
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name (if different)</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  placeholder="e.g., Acme Corp Ltd"
                />
              </div>
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
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+256 700 123 456"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Business Address
            </h3>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.address.country}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(COUNTRIES).map(([code, country]) => (
                    <SelectItem key={code} value={code}>
                      <span className="mr-2">{country.flag}</span>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Kampala"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Region</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="Central Region"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="256"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regional Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Base Currency (Auto-selected)
                </Label>
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
                <Label>Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(v) => handleChange('industry', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Company...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default CompanyOnboardingForm;
