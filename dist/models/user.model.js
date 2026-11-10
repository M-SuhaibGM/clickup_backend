"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const _1 = require(".");
exports.UserModel = {
    findById(id) {
        return _1.prisma.user.findUnique({ where: { id } });
    },
    findByEmail(email) {
        return _1.prisma.user.findUnique({ where: { email } });
    },
    findByGoogleId(googleId) {
        return _1.prisma.user.findUnique({ where: { googleId } });
    },
    createLocal(data) {
        return _1.prisma.user.create({
            data: { ...data, provider: 'local' },
        });
    },
    findAll() {
        return _1.prisma.user.findMany({
            select: { id: true, name: true, email: true, avatar: true },
            orderBy: { name: 'asc' },
        });
    },
    async upsertFromGoogle(profile) {
        // 1. Existing Google account
        let user = await _1.prisma.user.findUnique({
            where: { googleId: profile.googleId },
        });
        if (user)
            return user;
        // 2. Same email exists → link
        user = await _1.prisma.user.findUnique({ where: { email: profile.email } });
        if (user) {
            return _1.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.googleId, avatar: profile.avatar ?? user.avatar },
            });
        }
        // 3. New user
        return _1.prisma.user.create({
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
