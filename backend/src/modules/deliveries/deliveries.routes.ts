import { Router } from 'express';
import {
  getMyDeliveries,
  updateDeliveryStatus,
  getDeliveryById,
  assignDriver,
} from './deliveries.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/my', requireRole('DRIVER'), getMyDeliveries);
router.get('/:id', getDeliveryById);
router.patch('/:id/status', requireRole('DRIVER'), updateDeliveryStatus);
router.post('/assign', requireRole('ADMIN'), assignDriver);

export default router;