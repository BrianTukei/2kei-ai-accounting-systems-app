import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

/**
 * Company Context
 * Manages company state globally across the application
 */
const CompanyContext = createContext(undefined);

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch company on mount
  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/company');
      if (response.data.success) {
        setCompany(response.data.data.company);
        setError(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompany = useCallback(async (companyData) => {
    try {
      setLoading(true);
      const response = await api.post('/company', companyData);
      if (response.data.success) {
        setCompany(response.data.data.company);
        toast.success('Company created successfully!');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company');
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (updates) => {
    try {
      if (!company?._id) return { success: false };
      
      const response = await api.put(`/company/${company._id}`, updates);
      if (response.data.success) {
        setCompany(response.data.data.company);
        toast.success('Company updated successfully!');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company');
      return { success: false, error: err.response?.data?.message };
    }
  }, [company]);

  const updateSettings = useCallback(async (settings) => {
    try {
      if (!company?._id) return { success: false };
      
      const response = await api.put(`/company/${company._id}/settings`, settings);
      if (response.data.success) {
        setCompany(prev => ({ ...prev, ...settings }));
        toast.success('Settings updated!');
        return { success: true };
      }
    } catch (err) {
      toast.error('Failed to update settings');
      return { success: false };
    }
  }, [company]);

  const value = {
    company,
    loading,
    error,
    hasCompany: !!company,
    fetchCompany,
    createCompany,
    updateCompany,
    updateSettings,
    baseCurrency: company?.baseCurrency?.code || 'USD',
    currencySymbol: company?.baseCurrency?.symbol || '$'
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}

export default CompanyContext;
