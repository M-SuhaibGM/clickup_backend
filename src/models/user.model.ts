import { prisma } from './db';

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

  async upsertFromGoogle(profile: GoogleProfileInput) {
    // 1. Existing Google account
    let user = await prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (user) return user;

    // 2. Same email exists → link
    user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (user) {
      return prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, avatar: profile.avatar ?? user.avatar },
      });
    }

    // 3. New user
    return prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        googleId: profile.googleId,
        provider: 'google',
      },
    });
  },
};