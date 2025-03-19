import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { Request as ExpressRequest, Response, NextFunction } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";

interface AuthRequest extends ExpressRequest {
  user?: DecodedIdToken;
}

// Middleware to verify Firebase ID token
const validateFirebaseIdToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Create a new lead
export const createLead = https.onRequest(async (req: AuthRequest, res: Response) => {
  try {
    await validateFirebaseIdToken(req, res, async () => {
      const { tenantId, companyId, ...leadData } = req.body;

      // Validate required fields
      if (!tenantId || !companyId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Create lead document
      const leadRef = await admin.firestore().collection("leads").add({
        ...leadData,
        tenantId,
        companyId,
        status: "new",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user?.uid || "anonymous",
      });

      // Get the created lead
      const lead = await leadRef.get();

      res.status(201).json({
        id: lead.id,
        ...lead.data(),
      });
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get tenant statistics
export const getTenantStats = https.onRequest(async (req: AuthRequest, res: Response) => {
  try {
    await validateFirebaseIdToken(req, res, async () => {
      const { tenantId, companyId } = req.query as { tenantId?: string; companyId?: string };

      // Validate required parameters
      if (!tenantId || !companyId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      // Get tenant document
      const tenantDoc = await admin.firestore()
        .collection("companies")
        .doc(companyId)
        .collection("tenants")
        .doc(tenantId)
        .get();

      if (!tenantDoc.exists) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      // Get leads statistics
      const leadsSnapshot = await admin.firestore()
        .collection("leads")
        .where("tenantId", "==", tenantId)
        .get();

      // Get customers statistics
      const customersSnapshot = await admin.firestore()
        .collection("customers")
        .where("tenantId", "==", tenantId)
        .get();

      // Calculate statistics
      const stats = {
        tenant: tenantDoc.data(),
        totalLeads: leadsSnapshot.size,
        totalCustomers: customersSnapshot.size,
        leadsByStatus: {} as Record<string, number>,
        customersByType: {} as Record<string, number>,
      };

      // Calculate lead statistics
      leadsSnapshot.forEach((doc) => {
        const lead = doc.data();
        stats.leadsByStatus[lead.status] = (stats.leadsByStatus[lead.status] || 0) + 1;
      });

      // Calculate customer statistics
      customersSnapshot.forEach((doc) => {
        const customer = doc.data();
        stats.customersByType[customer.type] = (stats.customersByType[customer.type] || 0) + 1;
      });

      res.json(stats);
    });
  } catch (error) {
    console.error("Error getting tenant stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Webhook for external integrations
export const webhook = https.onRequest(async (req: ExpressRequest, res: Response) => {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  // Validate API key
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  try {
    interface WebhookData {
      type: "lead.created" | "customer.updated";
      data: {
        customerId?: string;
        updates?: Record<string, unknown>;
        [key: string]: unknown;
      };
    }

    const webhookData = req.body as WebhookData;
    if (webhookData.type === "lead.created") {
      const customerId = webhookData.data.customerId;
      if (customerId) {
        await admin.firestore().collection("customers").doc(customerId).set({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "new",
        });
      }
    }
    if (webhookData.type === "customer.updated") {
      const customerId = webhookData.data.customerId;
      if (customerId) {
        const updates = webhookData.data.updates || {};
        await admin.firestore().collection("customers").doc(customerId).update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
