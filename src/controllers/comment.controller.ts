// backend/src/controllers/comment.controller.ts
import { Request, Response } from 'express';
import { CommentService } from '../services/comment.service';
import { CommentModel } from '../models/comment.model';
import { asyncHandler } from '../utils/asyncHandler';

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comment = await CommentService.create(req.params.taskId as string, req.user!.id, req.body.text);
    res.status(201).json({ comment });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: (err as Error).message });
  }
});
export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  try {
    await CommentService.update(req.params.id as string, req.user!.id, req.body.text);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const resolveComment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const comment = await CommentService.setResolved(req.params.id as string, req.user!.id, req.body?.resolved !== false);
    res.json({ comment });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  try {
    await CommentService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const listAssignedComments = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type === 'delegated' ? 'delegated' : 'assigned';
  const comments = await CommentModel.findForAssignee(req.params.workspaceId as string, req.user!.id, type);
  res.json({ comments });
});
