import { Router } from 'express';
import { countryController } from '../controllers/countryController';

const router = Router();

// GET /api/countries - Get all countries
router.get('/', countryController.getAllCountries.bind(countryController));

// GET /api/countries/african - Get African countries
router.get('/african', countryController.getAfricanCountries.bind(countryController));

// GET /api/countries/region/:region - Get countries by region
router.get('/region/:region', countryController.getCountriesByRegion.bind(countryController));

// GET /api/countries/search - Search countries
router.get('/search', countryController.searchCountries.bind(countryController));

// GET /api/countries/:code - Get country by code
router.get('/:code', countryController.getCountryByCode.bind(countryController));

// GET /api/countries/:code/autofill - Get auto-fill data
router.get('/:code/autofill', countryController.getAutoFillData.bind(countryController));

// POST /api/countries/format-number - Format number
router.post('/format-number', countryController.formatNumber.bind(countryController));

// POST /api/countries/format-currency - Format currency
router.post('/format-currency', countryController.formatCurrency.bind(countryController));

export default router;
