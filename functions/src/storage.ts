import { storage } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import sharp from "sharp";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

interface ResizeOptions {
  width: number;
  height: number;
  fit?: keyof sharp.FitEnum;
}

// Process uploaded images
export const processImage = storage.onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  const bucket = admin.storage().bucket(event.data.bucket);

  // Only process images
  if (!contentType?.startsWith("image/")) {
    console.log("Not an image, skipping processing");
    return;
  }

  try {
    // Download file
    const tempFilePath = join(tmpdir(), filePath.split("/").pop() || "temp");
    await bucket.file(filePath).download({ destination: tempFilePath });

    // Define resize configurations
    const sizes: Record<string, ResizeOptions> = {
      thumbnail: { width: 150, height: 150, fit: "cover" },
      medium: { width: 800, height: 800, fit: "inside" },
    };

    // Process each size
    const uploadPromises = Object.entries(sizes).map(async ([size, options]) => {
      const resizedFileName = filePath.replace(
        /(\.[^.]+)$/,
        `_${size}$1`
      );
      const resizedTempPath = join(tmpdir(), `resized_${size}_${filePath.split("/").pop()}`);

      // Resize image
      await sharp(tempFilePath)
        .resize(options.width, options.height, { fit: options.fit })
        .toFile(resizedTempPath);

      // Upload resized image
      await bucket.upload(resizedTempPath, {
        destination: resizedFileName,
        metadata: {
          contentType,
          metadata: {
            resizedFrom: filePath,
            size,
          },
        },
      });

      // Clean up temp file
      await unlink(resizedTempPath);
    });

    // Wait for all sizes to be processed
    await Promise.all(uploadPromises);

    // Clean up original temp file
    await unlink(tempFilePath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
});

// Clean up files when document is deleted
export const cleanupFiles = storage.onObjectDeleted(async (event) => {
  const filePath = event.data.name;
  const bucket = admin.storage().bucket(event.data.bucket);

  try {
    // Delete all related files (thumbnails, etc.)
    const [files] = await bucket.getFiles({
      prefix: filePath.replace(/\.[^.]+$/, ""),
    });

    const deletePromises = files.map((file) => file.delete());
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error cleaning up files:", error);
  }
});
