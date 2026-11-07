import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from './cart.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware, requireRole('CUSTOMER'));

router.get('/', getCart);
router.post('/add', addToCart);
router.patch('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

export default router;