// backend/src/routes/project.routes.ts
import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import * as listController from '../controllers/list.controller';
import { requireAuth } from '../middleware/auth.middleware';

// mergeParams: true allows us to access :workspaceId from the parent router
const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Lists nested under project
router.get('/:projectId/lists', listController.listByProject);
router.post('/:projectId/lists', listController.createList);

export default router;