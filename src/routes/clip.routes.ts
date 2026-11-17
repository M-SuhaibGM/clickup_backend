import { Router } from 'express';
import { UTApi } from 'uploadthing/server';
import { prisma } from '../models';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(requireAuth);

const utapi = new UTApi();

const optInt = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clips = await prisma.clip.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ clips });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, url, fileKey, duration, size } = req.body ?? {};
    if (
      typeof title !== 'string' || !title.trim() ||
      typeof url !== 'string' || !/^https:\/\//.test(url) ||
      typeof fileKey !== 'string' || !fileKey
    ) {
      return res.status(400).json({ error: 'Invalid clip data' });
    }
    const clip = await prisma.clip.create({
      data: {
        title: title.trim().slice(0, 200),
        url,
        fileKey,
        duration: optInt(duration),
        size: optInt(size),
        userId: req.user!.id,
      },
    });
    res.status(201).json({ clip });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const clip = await prisma.clip.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });
    if (!clip) return res.status(404).json({ error: 'Clip not found' });
    await prisma.clip.delete({ where: { id: clip.id } });
    // Best-effort removal of the stored file; the DB record is already gone.
    try {
      await utapi.deleteFiles(clip.fileKey);
    } catch (err) {
      console.error('Failed to delete clip file from UploadThing', err);
    }
    res.json({ success: true });
  })
);

export default router;
