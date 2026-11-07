import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.use(authMiddleware, requireRole('ADMIN'));
router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;