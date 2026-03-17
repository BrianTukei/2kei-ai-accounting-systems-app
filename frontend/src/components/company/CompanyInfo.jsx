import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Mail, Phone, MapPin, Globe, DollarSign } from 'lucide-react';

/**
 * CompanyInfoCard
 * Displays company information in a compact card format
 * Used in Dashboard, Reports, Invoices
 */
export function CompanyInfoCard({ showAddress = true, compact = false }) {
  const { company, loading } = useCompany();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-800">
            Company information not available. Please complete onboarding.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'text-sm' : ''}>
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {company.name}
            </h3>
            
            {!compact && company.legalName && company.legalName !== company.name && (
              <p className="text-sm text-gray-500">{company.legalName}</p>
            )}
            
            <div className={`mt-2 space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
              
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{company.phone}</span>
                </div>
              )}
              
              {showAddress && company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5" />
                  <span>
                    {company.address.city}, {company.address.country}
                  </span>
                </div>
              )}
              
              {company.baseCurrency && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>
                    {company.baseCurrency.symbol} {company.baseCurrency.code}
                  </span>
                </div>
              )}
              
              {company.timezone && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{company.timezone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CompanyHeader
 * Full company header for invoices and reports
 */
export function CompanyHeader({ showLogo = true }) {
  const { company } = useCompany();

  if (!company) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          {company.legalName && company.legalName !== company.name && (
            <p className="text-gray-600">{company.legalName}</p>
          )}
        </div>
        
        {showLogo && company.logo && (
          <img 
            src={company.logo} 
            alt={company.name}
            className="h-16 object-contain"
          />
        )}
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        {company.address?.street && <p>{company.address.street}</p>}
        <p>
          {company.address?.city}{company.address?.city && company.address?.state && ', '}
          {company.address?.state} {company.address?.postalCode}
        </p>
        <p>{company.address?.country}</p>
        
        {company.email && <p>Email: {company.email}</p>}
        {company.phone && <p>Phone: {company.phone}</p>}
        {company.taxId && <p>Tax ID: {company.taxId}</p>}
      </div>
    </div>
  );
}

export default CompanyInfoCard;
