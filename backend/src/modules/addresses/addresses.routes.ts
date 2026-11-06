import { Router } from 'express';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from './addresses.controller';
import { authMiddleware } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAddresses);
router.get('/:id', getAddressById);
router.post('/', createAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;