import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Export function groups
export * from "./auth";
export * from "./storage";
export * from "./triggers";
export * from "./api";

// Example of a basic HTTP function
export const ping = https.onRequest((request: Request, response: Response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});
