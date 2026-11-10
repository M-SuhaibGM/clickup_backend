"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = require("../models/user.model");
exports.UserService = {
    async getSafeUser(id) {
        const user = await user_model_1.UserModel.findById(id);
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            provider: user.provider,
            createdAt: user.createdAt,
        };
    },
    async listUsers() {
        return user_model_1.UserModel.findAll();
    },
};
