import { Router } from 'express';
import { adminEmailController } from '../controllers/adminEmail';

const router = Router();

// GET /api/admin/broadcasts/recipients
router.get('/recipients', adminEmailController.getRecipients);

// GET /api/admin/broadcasts
router.get('/', adminEmailController.getBroadcasts);

// POST /api/admin/broadcasts
router.post('/', adminEmailController.createBroadcast);

// POST /api/admin/broadcasts/:id/test
router.post('/:id/test', adminEmailController.sendTestBroadcast);

// POST /api/admin/broadcasts/:id/send
router.post('/:id/send', adminEmailController.sendBroadcast);

export default router;
