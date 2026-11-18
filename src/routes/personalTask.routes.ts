// backend/src/routes/personalTask.routes.ts — mounted at /api/personal-tasks (single-task operations).
// Listing/creating is nested under /api/workspaces/:workspaceId/personal-tasks.
import { Router } from 'express';
import * as controller from '../controllers/personalTask.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.patch('/:id', controller.updatePersonalTask);
router.delete('/:id', controller.deletePersonalTask);

export default router;
