# Firebase API Reference

## Overview

This document provides a comprehensive API reference for all Firebase services used in the LeadLink CRM application. It includes details on services, methods, parameters, return types, and examples to guide developers in using the Firebase implementation.

## Table of Contents

- [Authentication Service](#authentication-service)
- [Firestore Services](#firestore-services)
- [Storage Service](#storage-service)
- [Cloud Functions](#cloud-functions)
- [Analytics Service](#analytics-service)
- [Notification Service](#notification-service)
- [Document Generation Service](#document-generation-service)
- [Environment Configuration Service](#environment-configuration-service)
- [Monitoring Service](#monitoring-service)

## Authentication Service

### Class: `AuthenticationService`

The Authentication Service manages user authentication, registration, and session management.

#### Methods

##### `register(email: string, password: string, profile?: UserProfile): Promise<UserCredential>`

Creates a new user account with email and password.

**Parameters:**
- `email`: User's email address
- `password`: User's password
- `profile` (optional): Additional user profile information

**Returns:** A Promise resolving to a Firebase UserCredential

**Example:**
```typescript
const auth = new AuthenticationService();
const userCredential = await auth.register(
  'user@example.com', 
  'Password123!', 
  { firstName: 'John', lastName: 'Doe' }
);
```

##### `login(email: string, password: string): Promise<UserCredential>`

Authenticates a user with email and password.

**Parameters:**
- `email`: User's email address
- `password`: User's password

**Returns:** A Promise resolving to a Firebase UserCredential

**Example:**
```typescript
const auth = new AuthenticationService();
const userCredential = await auth.login('user@example.com', 'Password123!');
```

##### `loginWithGoogle(): Promise<UserCredential>`

Authenticates a user with Google OAuth provider.

**Returns:** A Promise resolving to a Firebase UserCredential

**Example:**
```typescript
const auth = new AuthenticationService();
const userCredential = await auth.loginWithGoogle();
```

##### `loginWithGithub(): Promise<UserCredential>`

Authenticates a user with GitHub OAuth provider.

**Returns:** A Promise resolving to a Firebase UserCredential

**Example:**
```typescript
const auth = new AuthenticationService();
const userCredential = await auth.loginWithGithub();
```

##### `loginWithPhone(phoneNumber: string): Promise<ConfirmationResult>`

Initiates phone number authentication flow.

**Parameters:**
- `phoneNumber`: User's phone number in E.164 format

**Returns:** A Promise resolving to a Firebase ConfirmationResult

**Example:**
```typescript
const auth = new AuthenticationService();
const confirmationResult = await auth.loginWithPhone('+12025550123');
```

##### `confirmPhoneLogin(verificationCode: string, confirmationResult: ConfirmationResult): Promise<UserCredential>`

Completes phone number authentication flow.

**Parameters:**
- `verificationCode`: 6-digit verification code
- `confirmationResult`: ConfirmationResult from loginWithPhone

**Returns:** A Promise resolving to a Firebase UserCredential

**Example:**
```typescript
const auth = new AuthenticationService();
// After loginWithPhone:
const userCredential = await auth.confirmPhoneLogin('123456', confirmationResult);
```

##### `logout(): Promise<void>`

Signs out the current user.

**Returns:** A Promise that resolves when sign-out is complete

**Example:**
```typescript
const auth = new AuthenticationService();
await auth.logout();
```

##### `resetPassword(email: string): Promise<void>`

Sends a password reset email to the user.

**Parameters:**
- `email`: User's email address

**Returns:** A Promise that resolves when the email is sent

**Example:**
```typescript
const auth = new AuthenticationService();
await auth.resetPassword('user@example.com');
```

##### `updatePassword(newPassword: string): Promise<void>`

Updates the current user's password.

**Parameters:**
- `newPassword`: New password

**Returns:** A Promise that resolves when the password is updated

**Example:**
```typescript
const auth = new AuthenticationService();
await auth.updatePassword('NewPassword123!');
```

##### `enableMFA(): Promise<MultiFactorSession>`

Enables multi-factor authentication for the current user.

**Returns:** A Promise resolving to a MultiFactorSession

**Example:**
```typescript
const auth = new AuthenticationService();
const mfaSession = await auth.enableMFA();
```

##### `getCurrentUser(): User | null`

Gets the currently signed-in user.

**Returns:** The current Firebase User object or null if no user is signed in

**Example:**
```typescript
const auth = new AuthenticationService();
const user = auth.getCurrentUser();
```

##### `onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe`

Sets up an observer for authentication state changes.

**Parameters:**
- `callback`: Function to call when auth state changes

**Returns:** An unsubscribe function to stop listening

**Example:**
```typescript
const auth = new AuthenticationService();
const unsubscribe = auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
});

// Later, to stop listening:
unsubscribe();
```

## Firestore Services

### Class: `BasicCrudService<T>`

Base service for Firestore CRUD operations.

#### Methods

##### `create(data: T): Promise<string>`

Creates a new document in the collection.

**Parameters:**
- `data`: Object with the document data

**Returns:** A Promise resolving to the new document ID

**Example:**
```typescript
const userService = new UserService();
const userId = await userService.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
});
```

##### `getById(id: string): Promise<T | null>`

Retrieves a document by ID.

**Parameters:**
- `id`: Document ID

**Returns:** A Promise resolving to the document data or null if not found

**Example:**
```typescript
const userService = new UserService();
const user = await userService.getById('userId123');
```

##### `update(id: string, data: Partial<T>): Promise<void>`

Updates a document.

**Parameters:**
- `id`: Document ID
- `data`: Object with fields to update

**Returns:** A Promise that resolves when the update is complete

**Example:**
```typescript
const userService = new UserService();
await userService.update('userId123', { 
  firstName: 'Jane',
  lastLogin: new Date()
});
```

##### `delete(id: string): Promise<void>`

Deletes a document.

**Parameters:**
- `id`: Document ID

**Returns:** A Promise that resolves when the delete is complete

**Example:**
```typescript
const userService = new UserService();
await userService.delete('userId123');
```

##### `getAll(): Promise<T[]>`

Retrieves all documents in the collection.

**Returns:** A Promise resolving to an array of document data

**Example:**
```typescript
const userService = new UserService();
const allUsers = await userService.getAll();
```

##### `query(conditions: QueryCondition[]): Promise<T[]>`

Retrieves documents that match the specified conditions.

**Parameters:**
- `conditions`: Array of query conditions

**Returns:** A Promise resolving to an array of matching document data

**Example:**
```typescript
const userService = new UserService();
const activeAdmins = await userService.query([
  { field: 'role', operator: '==', value: 'admin' },
  { field: 'status', operator: '==', value: 'active' }
]);
```

##### `watch(id: string, callback: (data: T | null) => void): Unsubscribe`

Sets up a real-time listener for a document.

**Parameters:**
- `id`: Document ID
- `callback`: Function to call when document changes

**Returns:** An unsubscribe function to stop listening

**Example:**
```typescript
const userService = new UserService();
const unsubscribe = userService.watch('userId123', (userData) => {
  if (userData) {
    console.log('User data updated:', userData);
  } else {
    console.log('User document deleted or not found');
  }
});

// Later, to stop listening:
unsubscribe();
```

### Class: `LeadService extends BasicCrudService<Lead>`

Service for managing leads.

#### Additional Methods

##### `assignLead(leadId: string, userId: string): Promise<void>`

Assigns a lead to a user.

**Parameters:**
- `leadId`: Lead document ID
- `userId`: User document ID

**Returns:** A Promise that resolves when the assignment is complete

**Example:**
```typescript
const leadService = new LeadService();
await leadService.assignLead('lead123', 'user456');
```

##### `getLeadsByStatus(status: LeadStatus): Promise<Lead[]>`

Retrieves leads with a specific status.

**Parameters:**
- `status`: Lead status (enum value)

**Returns:** A Promise resolving to an array of leads

**Example:**
```typescript
const leadService = new LeadService();
const newLeads = await leadService.getLeadsByStatus(LeadStatus.NEW);
```

### Class: `CustomerService extends BasicCrudService<Customer>`

Service for managing customers.

#### Additional Methods

##### `getCustomersByTenant(tenantId: string): Promise<Customer[]>`

Retrieves customers for a specific tenant.

**Parameters:**
- `tenantId`: Tenant ID

**Returns:** A Promise resolving to an array of customers

**Example:**
```typescript
const customerService = new CustomerService();
const tenantCustomers = await customerService.getCustomersByTenant('tenant123');
```

## Storage Service

### Class: `StorageService`

Service for file storage operations.

#### Methods

##### `uploadFile(file: File, path: string): Promise<string>`

Uploads a file to Firebase Storage.

**Parameters:**
- `file`: File object
- `path`: Storage path where the file should be saved

**Returns:** A Promise resolving to the file's download URL

**Example:**
```typescript
const storageService = new StorageService();
const downloadUrl = await storageService.uploadFile(
  fileObject, 
  `users/${userId}/profile/avatar.jpg`
);
```

##### `deleteFile(path: string): Promise<void>`

Deletes a file from Firebase Storage.

**Parameters:**
- `path`: Storage path of the file to delete

**Returns:** A Promise that resolves when the delete is complete

**Example:**
```typescript
const storageService = new StorageService();
await storageService.deleteFile(`users/${userId}/profile/avatar.jpg`);
```

##### `getDownloadUrl(path: string): Promise<string>`

Gets the download URL for a file.

**Parameters:**
- `path`: Storage path of the file

**Returns:** A Promise resolving to the download URL

**Example:**
```typescript
const storageService = new StorageService();
const url = await storageService.getDownloadUrl(`users/${userId}/profile/avatar.jpg`);
```

##### `listFiles(directory: string): Promise<FileInfo[]>`

Lists files in a directory.

**Parameters:**
- `directory`: Storage path of the directory

**Returns:** A Promise resolving to an array of file information

**Example:**
```typescript
const storageService = new StorageService();
const files = await storageService.listFiles(`users/${userId}/documents`);
```

## Cloud Functions

### Functions

#### `createUser(data: CreateUserData): Promise<UserRecord>`

Creates a new user with Cloud Functions.

**Parameters:**
- `data`: Object with user data

**Returns:** A Promise resolving to the created user record

**Example:**
```typescript
import { functions } from '../firebase';

const createUser = functions.httpsCallable('createUser');
const result = await createUser({ 
  email: 'user@example.com',
  password: 'Password123!',
  displayName: 'John Doe',
  role: 'user'
});
```

#### `processPayment(data: PaymentData): Promise<PaymentResult>`

Processes a payment via Cloud Functions.

**Parameters:**
- `data`: Object with payment details

**Returns:** A Promise resolving to the payment result

**Example:**
```typescript
import { functions } from '../firebase';

const processPayment = functions.httpsCallable('processPayment');
const result = await processPayment({
  amount: 100,
  currency: 'USD',
  customerId: 'cust_123',
  paymentMethodId: 'pm_123'
});
```

## Analytics Service

### Class: `AnalyticsService`

Service for Firebase Analytics operations.

#### Methods

##### `logEvent(eventName: string, params?: Record<string, any>): void`

Logs an analytics event.

**Parameters:**
- `eventName`: Name of the event
- `params` (optional): Additional event parameters

**Example:**
```typescript
const analyticsService = new AnalyticsService();
analyticsService.logEvent('button_click', { 
  button_id: 'login_button',
  page: 'login'
});
```

##### `setUserProperties(properties: Record<string, string>): void`

Sets user properties for analytics.

**Parameters:**
- `properties`: Object with user properties

**Example:**
```typescript
const analyticsService = new AnalyticsService();
analyticsService.setUserProperties({
  subscription_tier: 'premium',
  user_role: 'admin'
});
```

## Notification Service

### Class: `NotificationService`

Service for managing notifications.

#### Methods

##### `sendNotification(userId: string, notification: Notification): Promise<string>`

Sends a notification to a user.

**Parameters:**
- `userId`: User ID
- `notification`: Notification object

**Returns:** A Promise resolving to the notification ID

**Example:**
```typescript
const notificationService = new NotificationService();
const notificationId = await notificationService.sendNotification('user123', {
  title: 'New Lead Assigned',
  body: 'A new lead has been assigned to you',
  type: NotificationType.LEAD_ASSIGNMENT,
  data: { leadId: 'lead456' }
});
```

##### `getNotifications(userId: string, limit: number = 20): Promise<Notification[]>`

Gets notifications for a user.

**Parameters:**
- `userId`: User ID
- `limit` (optional): Maximum number of notifications to return

**Returns:** A Promise resolving to an array of notifications

**Example:**
```typescript
const notificationService = new NotificationService();
const notifications = await notificationService.getNotifications('user123', 10);
```

##### `markAsRead(notificationId: string): Promise<void>`

Marks a notification as read.

**Parameters:**
- `notificationId`: Notification ID

**Returns:** A Promise that resolves when the update is complete

**Example:**
```typescript
const notificationService = new NotificationService();
await notificationService.markAsRead('notification123');
```

##### `subscribeToNotifications(userId: string, callback: (notification: Notification) => void): Unsubscribe`

Sets up a real-time listener for a user's notifications.

**Parameters:**
- `userId`: User ID
- `callback`: Function to call when a new notification arrives

**Returns:** An unsubscribe function to stop listening

**Example:**
```typescript
const notificationService = new NotificationService();
const unsubscribe = notificationService.subscribeToNotifications('user123', (notification) => {
  console.log('New notification:', notification);
});

// Later, to stop listening:
unsubscribe();
```

## Document Generation Service

### Class: `DocumentGenerationService`

Service for generating documents.

#### Methods

##### `generatePdf(templateId: string, data: Record<string, any>): Promise<string>`

Generates a PDF document.

**Parameters:**
- `templateId`: Template ID
- `data`: Data to populate the template

**Returns:** A Promise resolving to the document URL

**Example:**
```typescript
const documentService = new DocumentGenerationService();
const pdfUrl = await documentService.generatePdf('invoice-template', {
  customerName: 'John Doe',
  items: [
    { description: 'Product 1', quantity: 1, price: 100 },
    { description: 'Product 2', quantity: 2, price: 50 }
  ],
  total: 200
});
```

##### `generateDocx(templateId: string, data: Record<string, any>): Promise<string>`

Generates a DOCX document.

**Parameters:**
- `templateId`: Template ID
- `data`: Data to populate the template

**Returns:** A Promise resolving to the document URL

**Example:**
```typescript
const documentService = new DocumentGenerationService();
const docxUrl = await documentService.generateDocx('contract-template', {
  customerName: 'John Doe',
  startDate: '2023-05-01',
  endDate: '2024-05-01',
  terms: 'Standard terms and conditions apply.'
});
```

## Environment Configuration Service

### Class: `EnvironmentConfigService`

Service for managing environment configuration.

#### Methods

##### `getConfig<T>(key: string, defaultValue?: T): T`

Gets a configuration value.

**Parameters:**
- `key`: Configuration key
- `defaultValue` (optional): Default value if key is not found

**Returns:** The configuration value

**Example:**
```typescript
const configService = new EnvironmentConfigService();
const apiEndpoint = configService.getConfig('API_ENDPOINT', 'https://api.default.com');
```

##### `isFeatureEnabled(featureName: string): boolean`

Checks if a feature flag is enabled.

**Parameters:**
- `featureName`: Feature name

**Returns:** Boolean indicating if the feature is enabled

**Example:**
```typescript
const configService = new EnvironmentConfigService();
if (configService.isFeatureEnabled('premium_features')) {
  // Enable premium features
}
```

## Monitoring Service

### Class: `MonitoringService`

Service for application monitoring.

#### Methods

##### `logError(error: Error, context?: Record<string, any>): void`

Logs an error to Firebase monitoring.

**Parameters:**
- `error`: Error object
- `context` (optional): Additional context information

**Example:**
```typescript
const monitoringService = new MonitoringService();
try {
  // Some operation that might throw
} catch (error) {
  monitoringService.logError(error, {
    userId: 'user123',
    action: 'create_lead'
  });
}
```

##### `startTrace(traceName: string): Trace`

Starts a performance trace.

**Parameters:**
- `traceName`: Name of the trace

**Returns:** A Trace object to track the operation

**Example:**
```typescript
const monitoringService = new MonitoringService();
const trace = monitoringService.startTrace('lead_creation');

// Perform the operation
await createLead(leadData);

// Stop the trace
trace.stop();
```

##### `checkServiceHealth(): Promise<HealthStatus>`

Checks the health of Firebase services.

**Returns:** A Promise resolving to the health status

**Example:**
```typescript
const monitoringService = new MonitoringService();
const status = await monitoringService.checkServiceHealth();
if (status !== HealthStatus.HEALTHY) {
  console.log('Service issues detected:', status);
}
``` 