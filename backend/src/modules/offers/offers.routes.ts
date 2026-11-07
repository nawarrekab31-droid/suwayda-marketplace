import { Router } from 'express';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from './offers.controller';
import { authMiddleware, requireRole, requireStoreOwnership } from '../../common/middleware/auth';

const router = Router();

router.get('/', getOffers);
router.get('/:id', getOfferById);

router.use(authMiddleware, requireRole('MERCHANT', 'ADMIN'));

router.post('/', requireStoreOwnership, createOffer);
router.patch('/:id', updateOffer);
router.delete('/:id', deleteOffer);

export default router;