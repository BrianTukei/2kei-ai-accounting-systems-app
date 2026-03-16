import { Router } from 'express';
import { companyController } from '../controllers/companyController';

const router = Router();

// POST /api/company - Create company profile
router.post('/', companyController.createCompany.bind(companyController));

// GET /api/company - Get company profile
router.get('/', companyController.getCompany.bind(companyController));

// PUT /api/company - Update company profile
router.put('/', companyController.updateCompany.bind(companyController));

// POST /api/company/get-or-create - Get or create company profile
router.post('/get-or-create', companyController.getOrCreateCompany.bind(companyController));

export default router;
