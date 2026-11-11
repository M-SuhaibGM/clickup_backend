import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.post('/subtasks', aiController.suggestSubtasks);
router.post('/draft', aiController.draftTasks);
router.post('/summarize', aiController.summarizeTask);

export default router;
