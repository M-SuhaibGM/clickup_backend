import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  // Define a route for task attachments
  taskAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    // You can add more types like "blob" for any file
  })
    .middleware(async () => {
      // Optional: Add authentication here using your JWT
      // For now, we'll just return a dummy user ID
      return { userId: "user_123" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Upload complete for userId:", metadata.userId);
      console.log("📎 File URL:", file.ufsUrl);
      
      // IMPORTANT: You will need to save this `file.ufsUrl` to your database later
      // We will handle this in the frontend callback
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;