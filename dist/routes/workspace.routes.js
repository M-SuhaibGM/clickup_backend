"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/workspace.routes.ts
const express_1 = require("express");
const workspaceController = __importStar(require("../controllers/workspace.controller"));
const project_routes_1 = __importDefault(require("./project.routes"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const taskController = __importStar(require("../controllers/task.controller"));
const activityController = __importStar(require("../controllers/activity.controller"));
const automationController = __importStar(require("../controllers/automation.controller")); // ← Import
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// ─── COLLECTION ROUTES ───
router.get('/', workspaceController.listWorkspaces);
router.post('/', workspaceController.createWorkspace);
// ─── SPECIFIC SUB-ROUTES (Must be above /:id) ───
// 1. Nested Projects
router.use('/:workspaceId/projects', project_routes_1.default);
// 2. Tasks assigned to me
router.get('/:workspaceId/my-tasks', taskController.listMyTasks);
// 3. Pending task count (for sidebar badge)
router.get('/:workspaceId/pending-task-count', taskController.getPendingTaskCount);
// 4. Activity History
router.get('/:workspaceId/activities', activityController.getWorkspaceActivities);
// 5. Automations (Workflows)
router.get('/:workspaceId/automations', automationController.listAutomations);
router.post('/:workspaceId/automations', automationController.createAutomation);
router.delete('/:workspaceId/automations/:id', automationController.deleteAutomation);
// 6. Member management
router.post('/:id/members', workspaceController.addMember);
router.patch('/:id/members/:memberId', workspaceController.updateMember);
router.delete('/:id/members/:memberId', workspaceController.removeMember);
// ─── GENERIC WORKSPACE ROUTES (Must be at the bottom) ───
router.get('/:id', workspaceController.getWorkspace);
router.patch('/:id', workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);
exports.default = router;
