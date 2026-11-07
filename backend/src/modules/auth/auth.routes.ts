import { Router } from 'express';
import { login, registerMerchant, refreshToken, changePassword } from './auth.controller';
import { authMiddleware } from '../../common/middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register/merchant', registerMerchant);
router.post('/refresh', refreshToken);
router.post('/change-password', authMiddleware, changePassword);

export default router;