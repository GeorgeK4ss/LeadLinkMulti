# Firebase Implementation Quick Start Guide

Welcome to the LeadLink CRM Firebase implementation! This quick start guide will help you set up your development environment and get familiar with the Firebase implementation.

## Prerequisites

Before you begin, make sure you have:

- Node.js v18 or higher installed
- npm v7 or higher installed
- Git installed
- A Firebase account
- Access to the Firebase project (contact your team lead if needed)

## Setting Up Your Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/leadlink-crm.git
cd leadlink-crm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory and add the following Firebase configuration:

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

> Contact a team member to obtain the appropriate values for these variables.

### 4. Install Firebase CLI

If you haven't already, install the Firebase CLI:

```bash
npm install -g firebase-tools
```

### 5. Log In to Firebase

```bash
npm run firebase:login
```

### 6. Start the Firebase Emulators

For local development, you can use Firebase emulators to avoid interacting with the production environment:

```bash
npm run emulators
```

This will start emulators for Authentication, Firestore, Functions, and Storage.

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Key Concepts

Here's a quick overview of how Firebase is used in this project:

### Services Architecture

All Firebase interactions happen through service classes, which are located in the `src/lib/services` directory. The main services are:

- `AuthenticationService`: Handles user authentication
- `FirestoreService`: Base class for Firestore operations
- `StorageService`: Manages file uploads and downloads
- `FunctionsService`: Interacts with Cloud Functions

All other domain-specific services (e.g., `LeadService`, `CustomerService`) extend these base services.

### Authentication Flow

User authentication is managed by the `AuthenticationService`. The typical flow is:

1. User logs in via email/password, Google, GitHub, or phone
2. Auth state is observed using `onAuthStateChanged`
3. User data is stored in Firestore in the `users` collection
4. Protected routes check for authentication state

### Data Access Pattern

Data access follows this pattern:

1. Services extend `BasicCrudService<T>` with a specific data type
2. All data operations are performed through these services
3. Real-time updates use `onSnapshot` listeners
4. Multi-tenant isolation is enforced in security rules

## Common Tasks

### Creating a New Service

To create a new service that interacts with Firestore:

```typescript
// src/lib/services/MyNewService.ts
import { BasicCrudService } from './BasicCrudService';
import { MyDataType } from '../types';

export class MyNewService extends BasicCrudService<MyDataType> {
  constructor() {
    super('myCollection'); // Collection name in Firestore
  }
  
  // Add custom methods here
}
```

### Implementing Authentication

To protect a route or component:

```typescript
// In a component
import { useAuth } from '../hooks/useAuth';

function ProtectedComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;
  
  return <YourComponent />;
}
```

### Working with Firestore Data

To perform CRUD operations:

```typescript
// Example of using a service
import { LeadService } from '../services/LeadService';

const leadService = new LeadService();

// Create
const newLeadId = await leadService.create({
  name: 'John Doe',
  email: 'john@example.com',
  status: LeadStatus.NEW
});

// Read
const lead = await leadService.getById(newLeadId);

// Update
await leadService.update(newLeadId, { status: LeadStatus.CONTACTED });

// Delete
await leadService.delete(newLeadId);

// Query
const activeLeads = await leadService.query([
  { field: 'status', operator: '!=', value: LeadStatus.CLOSED }
]);

// Real-time updates
const unsubscribe = leadService.watch(newLeadId, (lead) => {
  console.log('Lead updated:', lead);
});

// Stop listening when done
unsubscribe();
```

### File Storage

To work with files:

```typescript
import { StorageService } from '../services/StorageService';

const storageService = new StorageService();

// Upload a file
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const downloadUrl = await storageService.uploadFile(
  file,
  `users/${userId}/documents/${file.name}`
);

// Get download URL
const url = await storageService.getDownloadUrl(`users/${userId}/documents/${file.name}`);

// Delete a file
await storageService.deleteFile(`users/${userId}/documents/${file.name}`);
```

### Cloud Functions

To call Cloud Functions:

```typescript
import { functions } from '../firebase';

// Call a function
const processPayment = functions.httpsCallable('processPayment');
const result = await processPayment({
  amount: 100,
  currency: 'USD',
  customerId: 'cust_123'
});
```

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### All Tests

```bash
npm run test:all
```

## Deployment

### To Staging

```bash
npm run deploy:staging
```

### To Production

```bash
npm run deploy:prod
```

## Common Issues

### Firestore Permissions Errors

If you're seeing permissions errors when accessing Firestore, check:

1. Is the user authenticated?
2. Do security rules allow the operation?
3. Is the user in the correct tenant?

### Storage Upload Fails

If file uploads are failing:

1. Check the file size (max 5MB)
2. Verify the file type is allowed
3. Ensure the path follows the convention

## Additional Resources

- [Complete API Reference](./FIREBASE_API_REFERENCE.md)
- [Security Guide](./FIREBASE_SECURITY_GUIDE.md)
- [Implementation Guide](./FIREBASE_IMPLEMENTATION_GUIDE.md)
- [Firebase Documentation](https://firebase.google.com/docs)

## Getting Help

If you need assistance:

1. Check the documentation first
2. Reach out to the #firebase channel in Slack
3. Contact the Firebase implementation team 