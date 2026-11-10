"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const project_routes_1 = __importDefault(require("./project.routes")); // ← ADD
const list_routes_1 = __importDefault(require("./list.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const workspace_routes_1 = __importDefault(require("./workspace.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/projects', project_routes_1.default);
router.use('/lists', list_routes_1.default); // ← ADD
router.use('/tasks', task_routes_1.default);
router.use('/workspaces', workspace_routes_1.default);
exports.default = router;
