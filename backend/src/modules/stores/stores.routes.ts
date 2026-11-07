import { Router } from 'express';
import {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  approveStore,
  getMyStore,
} from './stores.controller';
import { authMiddleware, requireRole, requireStoreOwnership } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('ADMIN'), getAllStores);
router.get('/me', requireRole('MERCHANT'), requireStoreOwnership, getMyStore);
router.get('/:id', requireRole('ADMIN', 'MERCHANT'), getStoreById);
router.post('/', requireRole('MERCHANT'), createStore);
router.patch('/:id', requireRole('MERCHANT', 'ADMIN'), updateStore);
router.patch('/:id/approve', requireRole('ADMIN'), approveStore);

export default router;