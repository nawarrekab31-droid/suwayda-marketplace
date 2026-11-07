import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from './orders.controller';
import { authMiddleware, requireRole, requireOrderOwnership } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', requireRole('CUSTOMER'), createOrder);
router.get('/:id', requireOrderOwnership, getOrderById);
router.patch('/:id/status', requireOrderOwnership, updateOrderStatus);

export default router;