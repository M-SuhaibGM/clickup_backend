// backend/src/routes/space.routes.ts
// Mounted at /api/spaces (single-space operations).
// Listing/creating spaces is nested under /api/workspaces/:workspaceId/spaces.
import { Router } from 'express';
import * as spaceController from '../controllers/space.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.patch('/:id', spaceController.updateSpace);
router.delete('/:id', spaceController.deleteSpace);

export default router;
