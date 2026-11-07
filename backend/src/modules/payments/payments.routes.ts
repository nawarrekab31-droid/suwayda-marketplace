import { Router } from 'express';
import {
  createPayment,
  getPayments,
  confirmPayment,
} from './payments.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getPayments);
router.post('/', createPayment);
router.patch('/:id/confirm', requireRole('ADMIN'), confirmPayment);

export default router;