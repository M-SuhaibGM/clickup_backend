// backend/src/services/post.service.ts
// Posts are published to a channel (every project has exactly one).
import { prisma } from '../models';
import { WorkspaceModel } from '../models/workspace.model';

export const POST_TYPES = ['ANNOUNCEMENT', 'UPDATE', 'DISCUSSION', 'QUESTION'] as const;
export type PostType = (typeof POST_TYPES)[number];

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;
const PAGE_SIZE = 100;

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const include = {
  author: { select: { id: true, name: true, avatar: true } },
  channel: { select: { id: true, name: true, projectId: true } },
};

async function assertMember(workspaceId: string, userId: string) {
  const ws = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
  if (!ws) throw httpError('Workspace not found or unauthorized', 403);
}

export const PostService = {
  async list(
    workspaceId: string,
    userId: string,
    filters: { channelId?: string; authorId?: string; type?: string; sort?: string }
  ) {
    await assertMember(workspaceId, userId);
    if (filters.type && !(POST_TYPES as readonly string[]).includes(filters.type)) {
      throw httpError('Invalid post type', 400);
    }
    const posts = await prisma.post.findMany({
      where: {
        // only channels of projects in this workspace
        channel: { project: { workspaceId } },
        ...(filters.channelId ? { channelId: filters.channelId } : {}),
        ...(filters.authorId ? { authorId: filters.authorId } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      orderBy: { createdAt: filters.sort === 'oldest' ? 'asc' : 'desc' },
      take: PAGE_SIZE,
      include,
    });
    return posts;
  },

  async create(
    workspaceId: string,
    userId: string,
    input: { channelId?: string; type?: string; title?: string; content?: string }
  ) {
    await assertMember(workspaceId, userId);

    if (!input.channelId) throw httpError('Select a channel first', 400);
    const channel = await prisma.channel.findFirst({
      where: { id: input.channelId, project: { workspaceId } },
      select: { id: true },
    });
    if (!channel) throw httpError('Channel not found in this workspace', 404);

    const type = (input.type ?? 'ANNOUNCEMENT') as PostType;
    if (!POST_TYPES.includes(type)) throw httpError('Invalid post type', 400);

    const content = (input.content ?? '').trim();
    if (!content) throw httpError('Post content cannot be empty', 400);
    if (content.length > MAX_CONTENT) throw httpError(`Post is too long (max ${MAX_CONTENT})`, 400);

    const title = (input.title ?? '').trim();
    if (title.length > MAX_TITLE) throw httpError(`Title is too long (max ${MAX_TITLE})`, 400);

    return prisma.post.create({
      data: { channelId: channel.id, authorId: userId, type, title: title || null, content },
      include,
    });
  },

  /** The author, or a workspace admin, can delete a post. */
  async delete(id: string, userId: string) {
    const post = await prisma.post.findFirst({
      where: { id, channel: { project: { workspace: { members: { some: { userId } } } } } },
      include: { channel: { select: { project: { select: { workspaceId: true } } } } },
    });
    if (!post) throw httpError('Post not found', 404);

    const workspaceId = post.channel.project.workspaceId;
    if (post.authorId !== userId && !(await WorkspaceModel.isAdmin(workspaceId, userId))) {
      throw httpError('Only the author or an admin can delete this post', 403);
    }
    await prisma.post.delete({ where: { id } });
  },
};
