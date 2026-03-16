import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Building2, Globe, Clock, DollarSign, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface CountryData {
  code: string;
  name: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  timezone: string;
  phoneCode: string;
  flag: string;
  region: string;
}

interface CompanyFormData {
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  timezone: string;
  tax_number: string;
  registration_number: string;
}

export const CompanyCreationForm: React.FC = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    currency: '',
    timezone: '',
    tax_number: '',
    registration_number: ''
  });

  // Fetch countries on mount
  useEffect(() => {
    fetchAfricanCountries();
  }, []);

  const fetchAfricanCountries = async () => {
    try {
      const response = await fetch('/api/countries/african');
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to load countries');
    }
  };

  // Auto-fill when country is selected
  const handleCountrySelect = async (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    
    if (country) {
      setSelectedCountry(country);
      
      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        country: country.name,
        currency: country.currency,
        timezone: country.timezone,
        phone: country.phoneCode + ' '
      }));

      toast.success(`${country.flag} ${country.name} selected - Currency: ${country.currencySymbol} ${country.currencyName}`);
    }
  };

  // Search countries
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAfricanCountries();
      return;
    }

    try {
      const response = await fetch(`/api/countries/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error('Error searching countries:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Company profile created successfully!');
      } else {
        toast.error(data.error || 'Failed to create company profile');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Group countries by region
  const groupedCountries = countries.reduce((acc, country) => {
    const region = country.region.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (!acc[region]) acc[region] = [];
    acc[region].push(country);
    return acc;
  }, {} as Record<string, CountryData[]>);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Create Your Company Profile
          </CardTitle>
          <CardDescription className="text-blue-100">
            Select your country and we'll automatically set currency, timezone, and regional settings
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Country Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              1. Select Your Country
            </Label>
            
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>

            {/* Country Select */}
            <Select onValueChange={handleCountrySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose your country..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                  <div key={region}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 bg-gray-50">
                      {region}
                    </div>
                    {regionCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {country.currency}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Country Info */}
            {selectedCountry && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{selectedCountry.flag}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{selectedCountry.name}</h4>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {selectedCountry.currency} ({selectedCountry.currencySymbol})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedCountry.timezone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {selectedCountry.phoneCode}
                        </span>
                      </div>
                    </div>
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Company Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              2. Company Details
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="company@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone</Label>
                <Input
                  id="phone"
                  placeholder={selectedCountry ? `${selectedCountry.phoneCode} 700 123 456` : 'Phone number'}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              {/* Currency (Auto-filled) */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Currency (Auto-selected)</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* Timezone (Auto-filled) */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Timezone (Auto-selected)</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Address</Label>
                <Input
                  id="address"
                  placeholder="Enter company address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              {/* Tax Number */}
              <div className="space-y-2">
                <Label htmlFor="tax_number">Tax/VAT Number</Label>
                <Input
                  id="tax_number"
                  placeholder="Tax identification number"
                  value={formData.tax_number}
                  onChange={(e) => handleInputChange('tax_number', e.target.value)}
                />
              </div>

              {/* Registration Number */}
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  placeholder="Company registration number"
                  value={formData.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading || !selectedCountry}
              >
                {isLoading ? 'Creating...' : 'Create Company Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyCreationForm;
