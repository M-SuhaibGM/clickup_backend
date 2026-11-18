import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';   // ← ADD
import listRoutes from './list.routes';
import taskRoutes from './task.routes';
import workspaceRoutes from './workspace.routes';
import spaceRoutes from './space.routes';
import teamRoutes from './team.routes';
import personalTaskRoutes from './personalTask.routes';
import postRoutes from './post.routes';
import aiRoutes from './ai.routes';
import clipRoutes from './clip.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);  
router.use('/lists', listRoutes);          // ← ADD
router.use('/tasks', taskRoutes);   
router.use('/workspaces', workspaceRoutes);
router.use('/spaces', spaceRoutes);
router.use('/teams', teamRoutes);
router.use('/personal-tasks', personalTaskRoutes);
router.use('/posts', postRoutes);
router.use('/ai', aiRoutes);
router.use('/clips', clipRoutes);


export default router;