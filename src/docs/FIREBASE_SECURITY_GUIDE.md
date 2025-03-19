# Firebase Security Guide

## Overview

This guide outlines security best practices for the Firebase implementation in LeadLink CRM. Security is a critical aspect of our application that protects user data, prevents unauthorized access, and ensures compliance with data protection regulations.

## Authentication Security

### Secure Authentication Configuration

- **Email/Password Security**
  - Password strength requirements enforced both client-side and server-side
  - Account lockout after multiple failed attempts
  - Password reset mechanism with secure token expiration

- **OAuth Provider Security**
  - Whitelisted redirect domains
  - Verified application with OAuth providers
  - Proper scopes to limit data access

- **Multi-Factor Authentication (MFA)**
  - SMS verification
  - Email verification
  - Authenticator app support
  - Recovery codes management

### User Sessions

- **Token Management**
  - Short-lived access tokens (1 hour maximum)
  - Refresh token rotation
  - Secure token storage in HttpOnly cookies
  - CSRF protection with state tokens

- **Session Termination**
  - Automatic session expiration
  - Force logout on password change
  - Ability to revoke all sessions
  - Device management with session listing

## Firestore Security Rules

### Rule Structure

Firestore security rules follow these principles:

1. **Default Deny**
   ```
   // Deny read/write access to all resources by default
   match /{document=**} {
     allow read, write: if false;
   }
   ```

2. **Specific Allow Rules**
   ```
   // Allow specific operations with conditions
   match /users/{userId} {
     allow read: if request.auth != null && request.auth.uid == userId;
     allow write: if request.auth != null && request.auth.uid == userId;
   }
   ```

3. **Role-Based Controls**
   ```
   // Admin access controls
   match /users/{userId} {
     allow read: if request.auth != null && (
       request.auth.uid == userId || 
       request.auth.token.role == "admin"
     );
   }
   ```

### Multi-Tenant Isolation

```
// Ensure users can only access their tenant data
match /tenants/{tenantId}/{document=**} {
  allow read: if request.auth != null && 
    request.auth.token.tenantId == tenantId;
  
  allow write: if request.auth != null && 
    request.auth.token.tenantId == tenantId && 
    canModifyResource();
}
```

### Data Validation

```
// Validate data structure and content
match /users/{userId} {
  allow create: if request.auth != null && 
    request.auth.uid == userId &&
    request.resource.data.email is string &&
    request.resource.data.email.matches('^[^@]+@[^@]+\\.[^@]+$');
}
```

### Function-Based Rules

```
// Reusable functions for rule logic
function isSignedIn() {
  return request.auth != null;
}

function isOwner(userId) {
  return request.auth.uid == userId;
}

function belongsToSameTenant(tenantId) {
  return request.auth.token.tenantId == tenantId;
}

match /users/{userId} {
  allow read: if isSignedIn() && isOwner(userId);
}
```

## Storage Security Rules

### Path Validation

```
// Ensure files are stored in the correct location
match /users/{userId}/profile/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

### Content Type Restrictions

```
// Allow only specific file types
match /documents/{docId} {
  allow write: if request.auth != null &&
    request.resource.contentType.matches('application/pdf') || 
    request.resource.contentType.matches('application/msword');
}
```

### Size Limits

```
// Restrict file size
match /uploads/{fileName} {
  allow write: if request.auth != null && 
    request.resource.size < 5 * 1024 * 1024; // 5MB limit
}
```

## Cloud Functions Security

### Authentication

- All functions authenticate requests using Firebase Auth
- API key validation for external services
- Token verification with proper audience checks

### Function-Level Security

```javascript
// Example function with security checks
exports.secureFunction = functions.https.onCall((data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check user roles
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  // Input validation
  if (!data.someRequiredField) {
    throw new functions.https.HttpsError('invalid-argument', 'Required field missing');
  }
  
  // Function logic here
});
```

### Rate Limiting

```javascript
// Example rate limiting implementation
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests, please try again later.'
};

const requestCounts = {};

exports.rateLimitedFunction = functions.https.onCall((data, context) => {
  const userId = context.auth ? context.auth.uid : context.rawRequest.ip;
  
  // Check if user exceeded rate limit
  if (!requestCounts[userId]) {
    requestCounts[userId] = {
      count: 0,
      resetTime: Date.now() + rateLimit.windowMs
    };
  }
  
  // Reset counter if time window passed
  if (Date.now() > requestCounts[userId].resetTime) {
    requestCounts[userId] = {
      count: 0,
      resetTime: Date.now() + rateLimit.windowMs
    };
  }
  
  // Increment count and check limit
  requestCounts[userId].count++;
  if (requestCounts[userId].count > rateLimit.maxRequests) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimit.message);
  }
  
  // Function logic here
});
```

## Environment Configuration Security

### Secrets Management

- API keys and secrets stored in Firebase environment configuration
- Production secrets never stored in code repositories
- Different keys for development, staging, and production

### Configuration Access Control

```javascript
// Configuration service with secure access
class ConfigService {
  // Private config values
  #apiKeys;
  #secrets;
  
  constructor() {
    // Load configuration securely
    this.#apiKeys = {};
    this.#secrets = {};
    // Load from environment
  }
  
  // Public methods with specific access
  getApiKey(service, role) {
    // Check caller has permissions to access this key
    // Return key for specific service
  }
}
```

## Data Protection

### Sensitive Data Handling

- Personally Identifiable Information (PII) identified and protected
- Data classified by sensitivity level
- Encryption for sensitive fields
- Masking of sensitive data in logs and error reports

### Data Minimization

- Only necessary data collected and stored
- Data retention policies implemented
- Automatic data purging for expired records

### Encryption

- Data encrypted at rest using Firebase's encryption
- Additional field-level encryption for sensitive data
- Secure encryption key management

## Security Monitoring

### Audit Logging

```javascript
// Audit logging example
function logAuditEvent(userId, action, resource, details) {
  return db.collection('auditLogs').add({
    userId,
    action,
    resource,
    details,
    timestamp: FieldValue.serverTimestamp(),
    ipAddress: request.headers['x-forwarded-for'] || request.connection.remoteAddress
  });
}

// Usage in operations
async function updateUserData(userId, data) {
  await db.collection('users').doc(userId).update(data);
  await logAuditEvent(
    currentUser.uid, 
    'UPDATE', 
    `users/${userId}`, 
    { fields: Object.keys(data) }
  );
}
```

### Automated Monitoring

- Firebase Security Alerts configured
- Unusual activity detection
- Failed authentication monitoring
- Rate limit breach alerts

## Compliance Considerations

### GDPR Compliance

- Data subject access requests (DSAR) support
- Right to be forgotten implementation
- Data portability export functions
- Consent management

### Data Residency

- Regional storage configuration
- Data transfer compliance
- Understanding of Firebase data storage locations

## Security Testing

### Penetration Testing

- Regular security assessments
- Testing of authentication flows
- Testing of authorization rules
- API security testing

### Security Rules Testing

```javascript
// Example security rules test
describe('Firestore security rules', () => {
  it('should allow users to read their own profile', async () => {
    const db = getFirestoreWithAuth({ uid: 'user1' });
    await firebase.assertSucceeds(
      db.collection('users').doc('user1').get()
    );
  });
  
  it('should not allow users to read other user profiles', async () => {
    const db = getFirestoreWithAuth({ uid: 'user1' });
    await firebase.assertFails(
      db.collection('users').doc('user2').get()
    );
  });
});
```

## Incident Response

### Security Incident Procedure

1. **Identification**
   - Monitoring alerts
   - User reports
   - Suspicious activity detection

2. **Containment**
   - Disable compromised accounts
   - Revoke affected tokens
   - Isolate affected systems

3. **Eradication**
   - Remove unauthorized access
   - Fix security vulnerabilities
   - Update security rules

4. **Recovery**
   - Restore from clean backups if needed
   - Reset credentials
   - Re-enable services

5. **Lessons Learned**
   - Incident documentation
   - Root cause analysis
   - Security improvements

## Security Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/security)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Cloud Functions Security Documentation](https://firebase.google.com/docs/functions/security-rules) 