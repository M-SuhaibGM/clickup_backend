"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = void 0;
const comment_service_1 = require("../services/comment.service");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.createComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const comment = await comment_service_1.CommentService.create(req.params.taskId, req.user.id, req.body.text);
        res.status(201).json({ comment });
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
});
exports.updateComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        await comment_service_1.CommentService.update(req.params.id, req.user.id, req.body.text);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.deleteComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        await comment_service_1.CommentService.delete(req.params.id, req.user.id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
