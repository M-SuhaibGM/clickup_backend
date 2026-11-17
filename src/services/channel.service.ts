// backend/src/services/channel.service.ts
// Every project owns exactly one channel, named after the project.
import { prisma } from '../models';
import { ProjectModel } from '../models/project.model';
import { getIO } from '../config/socket';

const MAX_LENGTH = 4000;
const PAGE_SIZE = 50;

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const senderSelect = { id: true, name: true, avatar: true };

export const ChannelService = {
  /**
   * The project's channel. Created on demand for projects that predate channels,
   * so the "one channel per project" rule always holds. `projectId @unique`
   * makes concurrent creates safe (the loser just re-reads).
   */
  async getForProject(projectId: string, userId: string) {
    const project = await ProjectModel.findByIdAndMember(projectId, userId);
    if (!project) throw httpError('Project not found or unauthorized', 404);

    const existing = await prisma.channel.findUnique({ where: { projectId } });
    if (existing) return existing;

    try {
      return await prisma.channel.create({ data: { projectId, name: project.name } });
    } catch {
      const raced = await prisma.channel.findUnique({ where: { projectId } });
      if (raced) return raced;
      throw httpError('Failed to create channel', 500);
    }
  },

  /** Newest page first from the DB, returned oldest → newest. */
  async history(projectId: string, userId: string, before?: string) {
    const channel = await this.getForProject(projectId, userId);
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && isNaN(beforeDate.getTime())) throw httpError('Invalid "before" date', 400);

    const rows = await prisma.channelMessage.findMany({
      where: { channelId: channel.id, ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      include: { sender: { select: senderSelect } },
    });
    return { channel, messages: rows.reverse(), hasMore: rows.length === PAGE_SIZE };
  },

  async send(projectId: string, userId: string, rawText: string) {
    const text = (rawText ?? '').trim();
    if (!text) throw httpError('Message cannot be empty', 400);
    if (text.length > MAX_LENGTH) throw httpError(`Message is too long (max ${MAX_LENGTH})`, 400);

    const channel = await this.getForProject(projectId, userId);
    const message = await prisma.channelMessage.create({
      data: { channelId: channel.id, senderId: userId, text },
      include: { sender: { select: senderSelect } },
    });

    // Everyone with the project open is in the `project:<id>` socket room
    getIO().to(`project:${projectId}`).emit('channel:message', { projectId, message });
    return message;
  },
};
