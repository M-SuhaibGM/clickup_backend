import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import * as listController from '../controllers/list.controller';   // ← ADD
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Lists nested under project
router.get('/:projectId/lists', listController.listByProject);      // ← ADD
router.post('/:projectId/lists', listController.createList);        // ← ADD

export default router;