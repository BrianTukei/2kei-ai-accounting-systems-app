import { Request, Response } from 'express';
import { countryService } from '../services/countries';

export class CountryController {
  // Get all countries
  async getAllCountries(req: Request, res: Response) {
    try {
      const countries = countryService.getAllCountries();
      
      res.json({
        success: true,
        data: countries,
        count: countries.length,
        message: 'Countries retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch countries'
      });
    }
  }

  // Get countries by region
  async getCountriesByRegion(req: Request, res: Response) {
    try {
      const { region } = req.params;
      const countries = countryService.getCountriesByRegion(region as any);
      
      res.json({
        success: true,
        data: countries,
        count: countries.length,
        message: `Countries in ${region} retrieved successfully`
      });
    } catch (error) {
      console.error('Error fetching countries by region:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch countries by region'
      });
    }
  }

  // Get African countries
  async getAfricanCountries(req: Request, res: Response) {
    try {
      const countries = countryService.getAfricanCountries();
      
      res.json({
        success: true,
        data: countries,
        count: countries.length,
        message: 'African countries retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching African countries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch African countries'
      });
    }
  }

  // Get country by code
  async getCountryByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const country = countryService.getCountryByCode(code);
      
      if (!country) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      
      res.json({
        success: true,
        data: country,
        message: 'Country retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch country'
      });
    }
  }

  // Get auto-fill data for company creation
  async getAutoFillData(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const autoFillData = countryService.autoFillCompanyData(code);
      
      if (!autoFillData) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      
      res.json({
        success: true,
        data: autoFillData,
        message: 'Auto-fill data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching auto-fill data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch auto-fill data'
      });
    }
  }

  // Search countries
  async searchCountries(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }
      
      const countries = countryService.searchCountries(query);
      
      res.json({
        success: true,
        data: countries,
        count: countries.length,
        message: 'Countries search completed'
      });
    } catch (error) {
      console.error('Error searching countries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search countries'
      });
    }
  }

  // Format number according to country
  async formatNumber(req: Request, res: Response) {
    try {
      const { countryCode, value } = req.body;
      
      if (!countryCode || typeof value !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Country code and numeric value are required'
        });
      }
      
      const formatted = countryService.formatNumber(value, countryCode);
      
      res.json({
        success: true,
        data: { formatted },
        message: 'Number formatted successfully'
      });
    } catch (error) {
      console.error('Error formatting number:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to format number'
      });
    }
  }

  // Format currency according to country
  async formatCurrency(req: Request, res: Response) {
    try {
      const { countryCode, amount } = req.body;
      
      if (!countryCode || typeof amount !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Country code and amount are required'
        });
      }
      
      const formatted = countryService.formatCurrency(amount, countryCode);
      
      res.json({
        success: true,
        data: { formatted },
        message: 'Currency formatted successfully'
      });
    } catch (error) {
      console.error('Error formatting currency:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to format currency'
      });
    }
  }
}

export const countryController = new CountryController();
export default countryController;
