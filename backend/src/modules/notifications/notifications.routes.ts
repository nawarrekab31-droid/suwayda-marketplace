import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notifications.controller';
import { authMiddleware } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;