// backend/src/controllers/directMessage.controller.ts
import { Request, Response } from 'express';
import { DirectMessageService } from '../services/directMessage.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  res.status(e.status ?? 400).json({ error: e.message });
};

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json(await DirectMessageService.summary(req.params.workspaceId as string, req.user!.id));
  } catch (err) { fail(res, err); }
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  try {
    const messages = await DirectMessageService.history(
      req.params.workspaceId as string,
      req.user!.id,
      req.params.userId as string,
      typeof req.query.before === 'string' ? req.query.before : undefined,
    );
    res.json({ messages });
  } catch (err) { fail(res, err); }
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const message = await DirectMessageService.send(
      req.params.workspaceId as string,
      req.user!.id,
      req.params.userId as string,
      req.body.text,
    );
    res.status(201).json({ message });
  } catch (err) { fail(res, err); }
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  try {
    const count = await DirectMessageService.markRead(
      req.params.workspaceId as string,
      req.user!.id,
      req.params.userId as string,
    );
    res.json({ success: true, count });
  } catch (err) { fail(res, err); }
});
