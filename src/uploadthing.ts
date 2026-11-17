import { createUploadthing, type FileRouter } from "uploadthing/express";
import { TokenService } from "./services/token.service";

const f = createUploadthing();

export const uploadRouter = {
  // Single profile picture
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization token");
      try {
        const payload = TokenService.verifyAccessToken(authHeader.slice("Bearer ".length));
        return { userId: payload.userId };
      } catch {
        throw new Error("Unauthorized: Invalid or expired token");
      }
    })
    .onUploadComplete(async ({ file }) => ({ ufsUrl: file.ufsUrl })),

  // Screen recordings (clips). The client saves the DB record afterwards via POST /api/clips.
  clipVideo: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization token");
      try {
        const payload = TokenService.verifyAccessToken(authHeader.slice("Bearer ".length));
        return { userId: payload.userId };
      } catch {
        throw new Error("Unauthorized: Invalid or expired token");
      }
    })
    .onUploadComplete(async ({ file }) => ({ ufsUrl: file.ufsUrl, key: file.key, size: file.size })),

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
        const payload = TokenService.verifyAccessToken(token);

        return { userId: payload.userId };
      } catch (error) {
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
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;