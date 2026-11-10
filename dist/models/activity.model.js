"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModel = void 0;
const index_1 = require("./index");
exports.ActivityModel = {
    create(data) {
        return index_1.prisma.activity.create({
            data,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    },
    findAllByWorkspace(workspaceId) {
        return index_1.prisma.activity.findMany({
            where: { workspaceId },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Cap at 100 for performance
        });
    },
};
