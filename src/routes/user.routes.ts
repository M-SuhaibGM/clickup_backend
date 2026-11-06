import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();


router.get('/', requireAuth, userController.listUsers);
router.get('/me', requireAuth, userController.getMe);

export default router;