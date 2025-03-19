import { firestore } from "firebase-functions/v2";
import type { Change, FirestoreEvent } from "firebase-functions/v2/firestore";
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

// Helper functions
/**
 * Handles the creation of a new tenant.
 * @param {DocumentData} data - The tenant data.
 */
async function handleTenantCreation(data: DocumentData) {
  // Implement tenant creation logic
  console.log("Processing tenant creation:", data);
}

/**
 * Handles the deletion of a tenant.
 * @param {DocumentData} data - The tenant data.
 */
async function handleTenantDeletion(data: DocumentData) {
  // Implement tenant deletion logic
  console.log("Processing tenant deletion:", data);
}

/**
 * Handles updates to a tenant.
 * @param {DocumentData} oldData - The previous tenant data.
 * @param {DocumentData} newData - The updated tenant data.
 */
async function handleTenantUpdate(oldData: DocumentData, newData: DocumentData) {
  // Implement tenant update logic
  console.log("Processing tenant update:", { oldData, newData });
}

/**
 * Handles the creation of a new lead.
 * @param {DocumentData} data - The lead data.
 */
async function handleLeadCreation(data: DocumentData) {
  // Implement lead creation logic
  console.log("Processing lead creation:", data);
}

/**
 * Handles changes to a lead's status.
 * @param {DocumentData} oldData - The previous lead data.
 * @param {DocumentData} newData - The updated lead data.
 */
async function handleLeadStatusChange(oldData: DocumentData, newData: DocumentData) {
  // Implement lead status change logic
  console.log("Processing lead status change:", { oldData, newData });
}

/**
 * Processes changes to customer data.
 * @param {DocumentData} oldData - The previous customer data.
 * @param {DocumentData} newData - The updated customer data.
 */
async function processCustomerChanges(oldData: DocumentData, newData: DocumentData) {
  // Implement customer changes logic
  console.log("Processing customer changes:", { oldData, newData });
}

/**
 * Updates documents related to a customer.
 * @param {string} customerId - The ID of the customer.
 * @param {DocumentData} data - The customer data.
 */
async function updateRelatedDocuments(customerId: string, data: DocumentData) {
  // Implement related documents update logic
  console.log("Updating related documents for customer:", { customerId, data });
}

// Handle tenant document changes
export const onTenantWrite = firestore.onDocumentWritten(
  "companies/{companyId}/tenants/{tenantId}",
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    try {
      const afterData = event.data?.after?.data();
      const beforeData = event.data?.before?.data();

      // Handle tenant creation
      if (!beforeData && afterData) {
        await handleTenantCreation(afterData);
      }

      // Handle tenant deletion
      if (beforeData && !afterData) {
        await handleTenantDeletion(beforeData);
      }

      // Handle tenant update
      if (beforeData && afterData) {
        await handleTenantUpdate(beforeData, afterData);
      }
    } catch (error) {
      console.error("Error processing tenant write:", error);
      throw new Error("Failed to process tenant write");
    }
  }
);

// Handle lead document changes
export const onLeadWrite = firestore.onDocumentWritten(
  "leads/{leadId}",
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    try {
      const afterData = event.data?.after?.data();
      const beforeData = event.data?.before?.data();

      // Handle lead creation
      if (!beforeData && afterData) {
        await handleLeadCreation(afterData);
      }

      // Handle lead status change
      if (beforeData && afterData && beforeData.status !== afterData.status) {
        await handleLeadStatusChange(beforeData, afterData);
      }
    } catch (error) {
      console.error("Error processing lead write:", error);
      throw new Error("Failed to process lead write");
    }
  }
);

// Handle customer document updates
export const onCustomerUpdate = firestore.onDocumentUpdated(
  "customers/{customerId}",
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    try {
      const afterData = event.data?.after?.data();
      const beforeData = event.data?.before?.data();

      if (beforeData && afterData) {
        // Process customer data changes
        await processCustomerChanges(beforeData, afterData);

        // Update related documents
        await updateRelatedDocuments(event.params.customerId, afterData);
      }
    } catch (error) {
      console.error("Error processing customer update:", error);
      throw new Error("Failed to process customer update");
    }
  }
);
