import { AutomationModel } from '../models/automation.model';
import { EmailService } from './email.service';
import { prisma } from '../models';

export const AutomationService = {
  list(workspaceId: string) {
    return AutomationModel.findAll(workspaceId);
  },

  create(workspaceId: string, input: { trigger: string; action: string; actionValue?: string }) {
    return AutomationModel.create({ workspaceId, ...input });
  },

  delete(id: string, workspaceId: string) {
    return AutomationModel.delete(id, workspaceId);
  },

  // ─── CORE LOGIC: Run automations when something happens ───
  async runTriggers(workspaceId: string, trigger: string, task: any) {
    const automations = await AutomationModel.findByTrigger(workspaceId, trigger);
    if (automations.length === 0) return;

    for (const auto of automations) {
      try {
        if (auto.action === 'SEND_EMAIL') {
          // Example: Send email to the assignee (or a configured email)
          if (task.assignee?.email) {
            await EmailService.sendTaskAssignedEmail(
              task.assignee.email,
              task.assignee.name,
              task.title,
              `http://localhost:3000/tasks/${task.id}`,
              'Automated Notification'
            );
          }
        } else if (auto.action === 'ASSIGN_TO_ADMIN') {
          // Find the workspace admin and assign the task to them
          const admin = await prisma.workspaceMember.findFirst({
            where: { workspaceId, role: 'ADMIN' },
            include: { user: true },
          });
          if (admin) {
            await prisma.task.update({
              where: { id: task.id },
              data: { assigneeId: admin.userId },
            });
          }
        } else if (auto.action === 'CREATE_SUBTASK') {
          // Example: Auto-create a subtask
          await prisma.task.create({
            data: {
              title: `Auto-generated: Follow up on "${task.title}"`,
              parentId: task.id,
              listId: task.listId,
            },
          });
        }
      } catch (err) {
        console.error(`Automation ${auto.id} failed:`, err);
      }
    }
  },
};