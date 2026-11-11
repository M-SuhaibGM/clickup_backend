import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';   // ← ADD
import listRoutes from './list.routes';
import taskRoutes from './task.routes';
import workspaceRoutes from './workspace.routes';
import aiRoutes from './ai.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);  
router.use('/lists', listRoutes);          // ← ADD
router.use('/tasks', taskRoutes);   
router.use('/workspaces', workspaceRoutes);
router.use('/ai', aiRoutes);


export default router;