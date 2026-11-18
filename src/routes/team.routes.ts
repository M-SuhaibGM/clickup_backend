// backend/src/routes/team.routes.ts
// Mounted at /api/teams (single-team operations).
// Listing/creating teams is nested under /api/workspaces/:workspaceId/teams.
import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.patch('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);
router.post('/:id/members', teamController.addTeamMember);
router.delete('/:id/members/:userId', teamController.removeTeamMember);

export default router;
