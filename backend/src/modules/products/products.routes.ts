import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.controller';
import { authMiddleware, requireRole, requireStoreOwnership } from '../../common/middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.use(authMiddleware, requireRole('MERCHANT', 'ADMIN'));

router.post('/', requireStoreOwnership, createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;