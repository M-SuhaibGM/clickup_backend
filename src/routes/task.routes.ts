import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// ─── Reorder (MUST BE ABOVE /:id) ───
router.patch('/reorder', taskController.reorderTasks);

// ─── Single Task Routes ───
router.get('/:id', taskController.getTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;