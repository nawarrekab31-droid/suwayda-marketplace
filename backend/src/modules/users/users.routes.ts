import { Router } from 'express';
import { getAllUsers, getUserById } from './users.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);

export default router;