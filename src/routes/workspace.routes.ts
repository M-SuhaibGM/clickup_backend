// backend/src/routes/workspace.routes.ts
import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller';
import projectRoutes from './project.routes';
import { requireAuth } from '../middleware/auth.middleware';
import * as taskController from '../controllers/task.controller';
import * as activityController from '../controllers/activity.controller';

const router = Router();
router.use(requireAuth);

// ─── COLLECTION ROUTES ───
router.get('/', workspaceController.listWorkspaces);
router.post('/', workspaceController.createWorkspace);

// ─── SPECIFIC SUB-ROUTES (Must be above /:id) ───
// 1. Nested Projects
router.use('/:workspaceId/projects', projectRoutes);

// 2. Tasks assigned to me
router.get('/:workspaceId/my-tasks', taskController.listMyTasks);

// 3. Pending task count (for sidebar badge)
router.get('/:workspaceId/pending-task-count', taskController.getPendingTaskCount);
router.get('/:workspaceId/activities', activityController.getWorkspaceActivities);


// 4. Member management
router.post('/:id/members', workspaceController.addMember);
router.patch('/:id/members/:memberId', workspaceController.updateMember);
router.delete('/:id/members/:memberId', workspaceController.removeMember);


// ─── GENERIC WORKSPACE ROUTES (Must be at the bottom) ───
router.get('/:id', workspaceController.getWorkspace);
router.patch('/:id', workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

export default router;