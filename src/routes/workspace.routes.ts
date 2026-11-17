// backend/src/routes/workspace.routes.ts
import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import * as spaceController from '../controllers/space.controller';
import * as workspaceController from '../controllers/workspace.controller';
import projectRoutes from './project.routes';
import { requireAuth } from '../middleware/auth.middleware';
import * as taskController from '../controllers/task.controller';
import * as activityController from '../controllers/activity.controller';
import * as dmController from '../controllers/directMessage.controller';
import * as automationController from '../controllers/automation.controller'; // ← Import

const router = Router();
router.use(requireAuth);

// ─── COLLECTION ROUTES ───
router.get('/', workspaceController.listWorkspaces);
router.post('/', workspaceController.createWorkspace);

// ─── SPECIFIC SUB-ROUTES (Must be above /:id) ───
// 0. Spaces (workspace -> spaces -> projects)
router.get('/:workspaceId/spaces', spaceController.listSpaces);
router.post('/:workspaceId/spaces', spaceController.createSpace);

// 0b. Posts (published to a project's channel)
router.get('/:workspaceId/posts', postController.listPosts);
router.post('/:workspaceId/posts', postController.createPost);

// 1. Nested Projects
router.use('/:workspaceId/projects', projectRoutes);

// 2. Tasks assigned to me
router.get('/:workspaceId/my-tasks', taskController.listMyTasks);

// 3. Pending task count (for sidebar badge)
router.get('/:workspaceId/pending-task-count', taskController.getPendingTaskCount);

// 4. Activity History
router.get('/:workspaceId/activities', activityController.getWorkspaceActivities);

// 5. Automations (Workflows)
router.get('/:workspaceId/automations', automationController.listAutomations);
router.post('/:workspaceId/automations', automationController.createAutomation);
router.delete('/:workspaceId/automations/:id', automationController.deleteAutomation);

// 6. Direct messages (1:1 chat between workspace members)
router.get('/:workspaceId/dm', dmController.getSummary);
router.get('/:workspaceId/dm/:userId', dmController.getConversation);
router.post('/:workspaceId/dm/:userId', dmController.sendMessage);
router.post('/:workspaceId/dm/:userId/read', dmController.markRead);

// 7. Member management
router.get('/:id/members', workspaceController.listMembers);           // ← ADD
router.post('/:id/members', workspaceController.addMember);
router.patch('/:id/members/:memberId', workspaceController.updateMember);
router.delete('/:id/members/:memberId', workspaceController.removeMember);

// ─── GENERIC WORKSPACE ROUTES (Must be at the bottom) ───
router.get('/:id', workspaceController.getWorkspace);
router.patch('/:id', workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

export default router;