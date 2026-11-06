import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import * as commentController from '../controllers/comment.controller';


const router = Router();
router.use(requireAuth);

// ─── Reorder (MUST BE ABOVE /:id) ───
router.patch('/reorder', taskController.reorderTasks);

router.post('/:taskId/comments', commentController.createComment);
router.patch('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

// ─── Single Task Routes ───
router.get('/:id', taskController.getTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);


export default router;