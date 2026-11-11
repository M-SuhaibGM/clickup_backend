"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("uploadthing/express");
const token_service_1 = require("./services/token.service");
const f = (0, express_1.createUploadthing)();
exports.uploadRouter = {
    // Define a route for task attachments
    taskAttachment: f({
        image: { maxFileSize: "4MB", maxFileCount: 5 },
        pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    })
        .middleware(async ({ req }) => {
        // Authenticate user via JWT token from Authorization header
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                throw new Error("Missing authorization token");
            }
            const token = authHeader.slice("Bearer ".length);
            const payload = token_service_1.TokenService.verifyAccessToken(token);
            return { userId: payload.userId };
        }
        catch (error) {
            throw new Error("Unauthorized: Invalid or expired token");
        }
    })
        .onUploadComplete(async ({ metadata, file }) => {
        // Log upload with user ID (without sensitive file URLs in production logs)
        if (process.env.NODE_ENV === "development") {
            console.log("✅ Upload complete for userId:", metadata.userId);
            console.log("📎 File URL:", file.ufsUrl);
        }
        // TODO: Save file.ufsUrl to database with userId and task association
        // This should be done in the frontend callback to link file to specific task
    }),
};
