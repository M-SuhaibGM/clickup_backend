"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const automation_model_1 = require("../models/automation.model");
const email_service_1 = require("./email.service");
const models_1 = require("../models");
exports.AutomationService = {
    list(workspaceId) {
        return automation_model_1.AutomationModel.findAll(workspaceId);
    },
    create(workspaceId, input) {
        return automation_model_1.AutomationModel.create({ workspaceId, ...input });
    },
    delete(id, workspaceId) {
        return automation_model_1.AutomationModel.delete(id, workspaceId);
    },
    // ─── CORE LOGIC: Run automations when something happens ───
    async runTriggers(workspaceId, trigger, task) {
        const automations = await automation_model_1.AutomationModel.findByTrigger(workspaceId, trigger);
        if (automations.length === 0)
            return;
        for (const auto of automations) {
            try {
                if (auto.action === 'SEND_EMAIL') {
                    // Example: Send email to the assignee (or a configured email)
                    if (task.assignee?.email) {
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        await email_service_1.EmailService.sendTaskAssignedEmail(task.assignee.email, task.assignee.name, task.title, `${frontendUrl}/tasks/${task.id}`, 'Automated Notification');
                    }
                }
                else if (auto.action === 'ASSIGN_TO_ADMIN') {
                    // Find the workspace admin and assign the task to them
                    const admin = await models_1.prisma.workspaceMember.findFirst({
                        where: { workspaceId, role: 'ADMIN' },
                        include: { user: true },
                    });
                    if (admin) {
                        await models_1.prisma.task.update({
                            where: { id: task.id },
                            data: { assigneeId: admin.userId },
                        });
                    }
                }
                else if (auto.action === 'CREATE_SUBTASK') {
                    // Example: Auto-create a subtask
                    await models_1.prisma.task.create({
                        data: {
                            title: `Auto-generated: Follow up on "${task.title}"`,
                            parentId: task.id,
                            listId: task.listId,
                        },
                    });
                }
            }
            catch (err) {
                console.error(`Automation ${auto.id} failed:`, err);
            }
        }
    },
};
