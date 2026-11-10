"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = exports.getMe = void 0;
const user_service_1 = require("../services/user.service");
const asyncHandler_1 = require("../utils/asyncHandler");
/** GET /api/users/me (protected) */
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await user_service_1.UserService.getSafeUser(req.user.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json({ user });
});
exports.listUsers = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const users = await user_service_1.UserService.listUsers();
    res.json({ users });
});
