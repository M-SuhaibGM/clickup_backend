// backend/src/controllers/channel.controller.ts
import { Request, Response } from 'express';
import { ChannelService } from '../services/channel.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err); // unexpected (e.g. database) failure — don't leak internals to the client
  res.status(500).json({ error: 'Something went wrong' });
};

export const getChannel = asyncHandler(async (req: Request, res: Response) => {
  try {
    const channel = await ChannelService.getForProject(req.params.projectId as string, req.user!.id);
    res.json({ channel });
  } catch (err) { fail(res, err); }
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await ChannelService.history(
      req.params.projectId as string,
      req.user!.id,
      typeof req.query.before === 'string' ? req.query.before : undefined,
    );
    res.json(result);
  } catch (err) { fail(res, err); }
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const message = await ChannelService.send(req.params.projectId as string, req.user!.id, req.body?.text);
    res.status(201).json({ message });
  } catch (err) { fail(res, err); }
});
