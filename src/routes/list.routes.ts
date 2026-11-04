import { Router } from 'express';
import * as listController from '../controllers/list.controller';
import * as taskController from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// ─── Reorder (MUST BE ABOVE /:id) ───
router.patch('/reorder', listController.reorderLists);

// ─── Tasks (Nested under list) ───
router.get('/:listId/tasks', taskController.listTasks);
router.post('/:listId/tasks', taskController.createTask);

// ─── Single List Routes ───
router.get('/:id', listController.getList);
router.patch('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

export default router;