import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware';

// AI calls hit a paid upstream API, so cap them per user (not just per IP).
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: { error: 'You are sending AI requests too quickly. Please wait a moment.' },
});

const router = Router();
router.use(requireAuth);
router.use(aiLimiter);

router.post('/subtasks', aiController.suggestSubtasks);
router.post('/draft', aiController.draftTasks);
router.post('/summarize', aiController.summarizeTask);
router.post('/chat', aiController.chat);

export default router;
