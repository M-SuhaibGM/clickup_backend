"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationModel = void 0;
const index_1 = require("./index");
exports.AutomationModel = {
    findByTrigger(workspaceId, trigger) {
        return index_1.prisma.automation.findMany({
            where: { workspaceId, trigger, isActive: true },
        });
    },
    findAll(workspaceId) {
        return index_1.prisma.automation.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
    },
    create(data) {
        return index_1.prisma.automation.create({ data });
    },
    delete(id, workspaceId) {
        return index_1.prisma.automation.deleteMany({ where: { id, workspaceId } });
    },
};
