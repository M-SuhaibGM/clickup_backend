// backend/src/controllers/post.controller.ts
import { Request, Response } from 'express';
import { PostService } from '../services/post.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};

const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  try {
    const posts = await PostService.list(req.params.workspaceId as string, req.user!.id, {
      channelId: str(req.query.channelId),
      authorId: str(req.query.authorId),
      type: str(req.query.type),
      sort: str(req.query.sort),
    });
    res.json({ posts });
  } catch (err) { fail(res, err); }
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  try {
    const post = await PostService.create(req.params.workspaceId as string, req.user!.id, req.body ?? {});
    res.status(201).json({ post });
  } catch (err) { fail(res, err); }
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  try {
    await PostService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});
