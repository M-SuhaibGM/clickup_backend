import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import * as commentController from '../controllers/comment.controller';
import * as timeController from '../controllers/timeEntry.controller';


const router = Router();
router.use(requireAuth);

// ─── Reorder (MUST BE ABOVE /:id) ───
router.patch('/reorder', taskController.reorderTasks);

router.post('/:taskId/comments', commentController.createComment);
router.patch('/comments/:id/resolve', commentController.resolveComment);
router.patch('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

// ─── Time tracking (above /:id so "time" is never read as a task id) ───
router.delete('/time/:entryId', timeController.deleteTime);
router.post('/:taskId/time/start', timeController.startTimer);
router.post('/:taskId/time/stop', timeController.stopTimer);
router.post('/:taskId/time', timeController.addTime);

// ─── Single Task Routes ───
router.get('/:id', taskController.getTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);


export default router;