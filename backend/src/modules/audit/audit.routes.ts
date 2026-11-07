import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authMiddleware, requireRole } from '../../common/middleware/auth';

const router = Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/', getAuditLogs);

export default router;