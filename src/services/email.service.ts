import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'ClickUp Clone <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const EmailService = {
  async sendWelcomeEmail(toEmail: string, name: string) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Welcome to ClickUp Clone! 🚀',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Welcome, ${escapeHtml(name)}! 👋</h2>
            <p>We're thrilled to have you on board. ClickUp Clone helps you manage your projects, tasks, and team all in one place.</p>
            <p>Here is what you can do next:</p>
            <ul>
              <li>Create your first Workspace</li>
              <li>Invite your team members</li>
              <li>Start organizing your tasks</li>
            </ul>
            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              Go to Dashboard
            </a>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return;
      }
      console.log('✅ Welcome email sent to:', toEmail);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  },

  async sendTaskAssignedEmail(
    toEmail: string,
    assigneeName: string,
    taskTitle: string,
    taskUrl: string,
    projectName: string
  ) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `You have been assigned a task: ${taskTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>New Task Assigned 📋</h2>
            <p>Hi ${escapeHtml(assigneeName)},</p>
            <p>You have been assigned a new task in the <strong>${escapeHtml(projectName)}</strong> project:</p>

            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0; color: #111827;">${escapeHtml(taskTitle)}</h3>
            </div>

            <a href="${escapeHtml(taskUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              View Task
            </a>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return;
      }
      console.log('✅ Assignment email sent to:', toEmail);
    } catch (err) {
      console.error('Failed to send assignment email:', err);
    }
  },

  // ─── REPLACED: Instead of invite link, we notify them they're added ───
  async sendAddedToWorkspaceEmail(toEmail: string, name: string, workspaceName: string, inviterName: string) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `You've been added to ${workspaceName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>You're in! 🎉</h2>
            <p>Hi ${escapeHtml(name)},</p>
            <p><strong>${escapeHtml(inviterName)}</strong> has added you to the <strong>${escapeHtml(workspaceName)}</strong> workspace on ClickUp Clone.</p>
            <p>You can now collaborate with your team on projects, lists, and tasks.</p>

            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              Go to Workspace
            </a>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return;
      }
      console.log('✅ Added to workspace email sent to:', toEmail);
    } catch (err) {
      console.error('Failed to send added email:', err);
    }
  },
};