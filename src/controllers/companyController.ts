import { Request, Response } from 'express';
import { companyService } from '../services/company';

export class CompanyController {
  // Create company profile
  async createCompany(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { company_name, email, phone, address, city, country, currency, tax_number, registration_number } = req.body;

      if (!company_name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Company name and email are required'
        });
      }

      const result = await companyService.createCompanyProfile(userId, {
        company_name,
        email,
        phone,
        address,
        city,
        country,
        currency,
        tax_number,
        registration_number
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.company,
        message: 'Company profile created successfully'
      });
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get company profile
  async getCompany(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await companyService.getCompanyProfile(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        data: result.company,
        message: 'Company profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update company profile
  async updateCompany(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const updateData = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = await companyService.updateCompanyProfile(userId, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: result.company,
        message: 'Company profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get or create company (used during onboarding)
  async getOrCreateCompany(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { company_name, email, phone, address, city, country, currency, tax_number, registration_number } = req.body;

      if (!company_name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Company name and email are required'
        });
      }

      const result = await companyService.getOrCreateCompanyProfile(userId, {
        company_name,
        email,
        phone,
        address,
        city,
        country,
        currency,
        tax_number,
        registration_number
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: result.company,
        message: result.company ? 'Company profile retrieved' : 'Company profile created successfully'
      });
    } catch (error) {
      console.error('Error in getOrCreate company:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const companyController = new CompanyController();
export default companyController;
