// backend/src/services/channel.service.ts
// Every project owns exactly one channel, named after the project.
import { prisma } from '../models';
import { ProjectModel } from '../models/project.model';
import { WorkspaceModel } from '../models/workspace.model';
import { getIO } from '../config/socket';

const MAX_LENGTH = 4000;
const PAGE_SIZE = 50;

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const senderSelect = { id: true, name: true, avatar: true };
const reactionsInclude = { select: { emoji: true, userId: true }, orderBy: { createdAt: 'asc' as const } };

/** Only these can be used as reactions. */
export const REACTION_EMOJI = ['👍', '✅', '🔥', '❤️', '😂', '🎉', '👀', '🙏'];

const emit = (projectId: string, event: string, payload: object) => {
  try {
    getIO().to(`project:${projectId}`).emit(event, { projectId, ...payload });
  } catch (err) {
    console.error(`Failed to broadcast ${event}`, err); // the write already succeeded
  }
};

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
      include: { sender: { select: senderSelect }, reactions: reactionsInclude },
    });
    // Posts published to this channel come with the first page only (older chat pages don't repeat them)
    const posts = beforeDate
      ? []
      : await prisma.post.findMany({
          where: { channelId: channel.id },
          orderBy: { createdAt: 'desc' },
          take: PAGE_SIZE,
          include: {
            author: { select: senderSelect },
            channel: { select: { id: true, name: true, projectId: true } },
            reactions: reactionsInclude,
          },
        });
    return { channel, messages: rows.reverse(), posts: posts.reverse(), hasMore: rows.length === PAGE_SIZE };
  },

  async send(projectId: string, userId: string, rawText: string) {
    const text = (rawText ?? '').trim();
    if (!text) throw httpError('Message cannot be empty', 400);
    if (text.length > MAX_LENGTH) throw httpError(`Message is too long (max ${MAX_LENGTH})`, 400);

    const channel = await this.getForProject(projectId, userId);
    const message = await prisma.channelMessage.create({
      data: { channelId: channel.id, senderId: userId, text },
      include: { sender: { select: senderSelect }, reactions: reactionsInclude },
    });

    // Everyone with the project open is in the `project:<id>` socket room
    emit(projectId, 'channel:message', { message });
    return message;
  },

  /** Adds the reaction, or removes it if this user already reacted with the same emoji. */
  async react(projectId: string, userId: string, input: { targetType?: string; targetId?: string; emoji?: string }) {
    const { targetType, targetId, emoji } = input;
    if (targetType !== 'message' && targetType !== 'post') throw httpError('Invalid reaction target', 400);
    if (!targetId || typeof targetId !== 'string') throw httpError('Missing target', 400);
    if (!emoji || !REACTION_EMOJI.includes(emoji)) throw httpError('That reaction is not available', 400);

    const channel = await this.getForProject(projectId, userId);
    const key = targetType === 'message' ? 'messageId' : 'postId';
    const exists =
      targetType === 'message'
        ? await prisma.channelMessage.findFirst({ where: { id: targetId, channelId: channel.id }, select: { id: true } })
        : await prisma.post.findFirst({ where: { id: targetId, channelId: channel.id }, select: { id: true } });
    if (!exists) throw httpError('Not found in this channel', 404);

    const where = { userId, emoji, [key]: targetId };
    const existing = await prisma.channelReaction.findFirst({ where });
    if (existing) await prisma.channelReaction.delete({ where: { id: existing.id } });
    else await prisma.channelReaction.create({ data: where as { userId: string; emoji: string } });

    const reactions = await prisma.channelReaction.findMany({
      where: { [key]: targetId },
      select: { emoji: true, userId: true },
      orderBy: { createdAt: 'asc' },
    });
    emit(projectId, 'channel:reaction', { targetType, targetId, reactions });
    return reactions;
  },

  /** The sender, or a workspace admin, can delete a message. */
  async deleteMessage(projectId: string, userId: string, messageId: string) {
    const project = await ProjectModel.findByIdAndMember(projectId, userId);
    if (!project) throw httpError('Project not found or unauthorized', 404);
    const channel = await this.getForProject(projectId, userId);

    const message = await prisma.channelMessage.findFirst({ where: { id: messageId, channelId: channel.id } });
    if (!message) throw httpError('Message not found', 404);
    if (message.senderId !== userId && !(await WorkspaceModel.isAdmin(project.workspaceId, userId))) {
      throw httpError('Only the sender or an admin can delete this message', 403);
    }
    await prisma.channelMessage.delete({ where: { id: messageId } });
    emit(projectId, 'channel:message-deleted', { id: messageId });
  },
};
