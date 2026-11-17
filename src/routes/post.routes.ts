// backend/src/routes/post.routes.ts — mounted at /api/posts (single-post operations).
// Listing/creating posts is nested under /api/workspaces/:workspaceId/posts.
import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.delete('/:id', postController.deletePost);

export default router;
