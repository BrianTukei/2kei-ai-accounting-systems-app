import { supabase } from './supabaseBackend';

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  tax_number: string;
  registration_number: string;
  logo_url: string;
  timezone: string;
  fiscal_year_start: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  company_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  tax_number?: string;
  registration_number?: string;
  logo_url?: string;
  timezone?: string;
}

class CompanyService {
  // Create company profile after signup
  async createCompanyProfile(userId: string, data: CreateCompanyData): Promise<{ success: boolean; company?: CompanyProfile; error?: string }> {
    try {
      // Check if user already has a company profile
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingCompany) {
        return {
          success: false,
          error: 'Company profile already exists for this user'
        };
      }

      // Create new company profile
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          user_id: userId,
          company_name: data.company_name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || 'Uganda',
          currency: data.currency || 'UGX',
          tax_number: data.tax_number || null,
          registration_number: data.registration_number || null,
          logo_url: data.logo_url || null,
          timezone: data.timezone || 'Africa/Kampala',
          fiscal_year_start: new Date().toISOString().split('T')[0]
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating company profile:', error);
        return {
          success: false,
          error: 'Failed to create company profile: ' + error.message
        };
      }

      return {
        success: true,
        company: company as CompanyProfile
      };
    } catch (error) {
      console.error('Exception creating company profile:', error);
      return {
        success: false,
        error: 'Exception creating company profile: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Get company profile by user ID
  async getCompanyProfile(userId: string): Promise<{ success: boolean; company?: CompanyProfile; error?: string }> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Company profile not found'
          };
        }
        return {
          success: false,
          error: 'Failed to fetch company profile: ' + error.message
        };
      }

      return {
        success: true,
        company: company as CompanyProfile
      };
    } catch (error) {
      console.error('Exception fetching company profile:', error);
      return {
        success: false,
        error: 'Exception fetching company profile: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Update company profile
  async updateCompanyProfile(userId: string, data: Partial<CreateCompanyData>): Promise<{ success: boolean; company?: CompanyProfile; error?: string }> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: 'Failed to update company profile: ' + error.message
        };
      }

      return {
        success: true,
        company: company as CompanyProfile
      };
    } catch (error) {
      console.error('Exception updating company profile:', error);
      return {
        success: false,
        error: 'Exception updating company profile: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  // Get or create company profile (used during onboarding)
  async getOrCreateCompanyProfile(userId: string, data: CreateCompanyData): Promise<{ success: boolean; company?: CompanyProfile; error?: string }> {
    // First try to get existing profile
    const existing = await this.getCompanyProfile(userId);
    
    if (existing.success && existing.company) {
      return existing;
    }

    // If not found, create new profile
    return await this.createCompanyProfile(userId, data);
  }
}

export const companyService = new CompanyService();
export default companyService;
