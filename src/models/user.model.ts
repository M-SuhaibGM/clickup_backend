import { prisma } from '.';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export const UserModel = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  },

  createLocal(data: { email: string; password: string; name: string }) {
    return prisma.user.create({
      data: { ...data, provider: 'local' },
    });
  },
  findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: 'asc' },
    });
  },

  async upsertFromGoogle(profile: GoogleProfileInput): Promise<{ user: Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>; isNew: boolean }> {
    // 1. Existing Google account
    let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
    if (user) return { user, isNew: false };

    // 2. Same email exists → link accounts (not a new user)
    user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (user) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, avatar: profile.avatar ?? user.avatar },
      });
      return { user: updated, isNew: false };
    }

    // 3. Brand new user
    const created = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
        provider: 'google',
      },
    });
    return { user: created, isNew: true };
  },
};