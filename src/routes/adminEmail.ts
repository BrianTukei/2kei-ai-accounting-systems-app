import { Router } from 'express';
import { adminEmailController } from '../controllers/adminEmail';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All broadcast management requires authenticated admin
router.use(requireAuth, requireAdmin);

// GET /api/admin/broadcasts/recipients
router.get('/recipients', adminEmailController.getRecipients);
router.get('/outbox', adminEmailController.getOutbox);

// GET /api/admin/broadcasts
router.get('/', adminEmailController.getBroadcasts);

// POST /api/admin/broadcasts
router.post('/', adminEmailController.createBroadcast);

// POST /api/admin/broadcasts/:id/test
router.post('/:id/test', adminEmailController.sendTestBroadcast);

// POST /api/admin/broadcasts/:id/send
router.post('/:id/send', adminEmailController.sendBroadcast);

export default router;
