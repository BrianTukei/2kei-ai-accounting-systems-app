import { Request, Response } from 'express';
import { forexService } from '../services/forexService';

export class ForexController {
  // Get exchange rate
  async getRate(req: Request, res: Response) {
    try {
      const { base, target } = req.query;

      if (!base || !target) {
        return res.status(400).json({
          success: false,
          error: 'Base and target currency codes are required'
        });
      }

      const result = await forexService.getRate(base as string, target as string);

      res.json({
        success: result.success,
        data: {
          base,
          target,
          rate: result.rate
        },
        error: result.error,
        message: result.success ? 'Exchange rate retrieved' : 'Failed to get exchange rate'
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Convert amount
  async convert(req: Request, res: Response) {
    try {
      const { amount, from, to } = req.query;

      if (!amount || !from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Amount, from, and to currencies are required'
        });
      }

      const numAmount = parseFloat(amount as string);
      
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount'
        });
      }

      const result = await forexService.convert(numAmount, from as string, to as string);

      res.json({
        success: result.success,
        data: {
          original: {
            amount: numAmount,
            currency: from
          },
          converted: {
            amount: result.converted,
            currency: to
          },
          rate: result.rate
        },
        error: result.error,
        message: result.success ? 'Conversion successful' : 'Conversion failed'
      });
    } catch (error) {
      console.error('Error converting currency:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get all rates
  async getAllRates(req: Request, res: Response) {
    try {
      const { base } = req.query;
      const baseCurrency = (base as string) || 'USD';

      const result = await forexService.getAllRates(baseCurrency);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: {
          base: baseCurrency,
          rates: result.rates,
          timestamp: new Date().toISOString()
        },
        message: 'Exchange rates retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching all rates:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get supported currencies
  async getCurrencies(req: Request, res: Response) {
    try {
      const currencies = forexService.getSupportedCurrencies();

      res.json({
        success: true,
        data: currencies,
        message: 'Supported currencies retrieved'
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get cache status
  async getCacheStatus(req: Request, res: Response) {
    try {
      const status = forexService.getCacheStatus();

      res.json({
        success: true,
        data: status,
        message: 'Cache status retrieved'
      });
    } catch (error) {
      console.error('Error fetching cache status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const forexController = new ForexController();
export default forexController;
