import { Router } from 'express';
import { forexController } from '../controllers/forexController';

const router = Router();

// GET /api/forex/rate - Get exchange rate
router.get('/rate', forexController.getRate.bind(forexController));

// GET /api/forex/convert - Convert amount
router.get('/convert', forexController.convert.bind(forexController));

// GET /api/forex/rates - Get all rates for base currency
router.get('/rates', forexController.getAllRates.bind(forexController));

// GET /api/forex/currencies - Get supported currencies
router.get('/currencies', forexController.getCurrencies.bind(forexController));

// GET /api/forex/cache-status - Get cache status
router.get('/cache-status', forexController.getCacheStatus.bind(forexController));

export default router;
