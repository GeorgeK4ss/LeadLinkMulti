# Firebase Implementation Troubleshooting Guide

This guide provides solutions for common issues you might encounter when working with Firebase in the LeadLink CRM application.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Firestore Data Access Problems](#firestore-data-access-problems)
3. [Storage Upload and Download Errors](#storage-upload-and-download-errors)
4. [Cloud Functions Deployment and Execution Problems](#cloud-functions-deployment-and-execution-problems)
5. [Performance and Optimization Issues](#performance-and-optimization-issues)
6. [Security Rules Debugging](#security-rules-debugging)
7. [Environment Configuration Problems](#environment-configuration-problems)
8. [Offline/Online Synchronization Issues](#offline-online-synchronization-issues)
9. [Testing Environment Setup](#testing-environment-setup)
10. [Deployment Troubleshooting](#deployment-troubleshooting)

## Authentication Issues

### User Cannot Sign In

**Symptoms**
- Login attempts fail with "Invalid email/password" error
- Authentication state doesn't persist between page refreshes
- Social authentication redirects fail

**Solutions**

1. **Invalid Credentials**
   - Verify email format is correct
   - Reset password if forgotten
   - Check if the user exists in Firebase Authentication console

2. **Session Persistence Issues**
   ```typescript
   // Ensure persistence is properly set
   import { setPersistence, browserLocalPersistence } from 'firebase/auth';
   
   await setPersistence(auth, browserLocalPersistence);
   ```

3. **Social Auth Configuration**
   - Verify OAuth redirect domains are configured in Firebase Console
   - Check that provider settings are correctly implemented
   - Ensure proper scopes are requested

### Multi-Factor Authentication Problems

**Symptoms**
- MFA enrollment fails
- Verification codes not being received
- Unable to complete MFA verification flow

**Solutions**

1. **Phone Number Format**
   - Ensure phone numbers are in E.164 format (+1XXXXXXXXXX)
   - Verify the phone is capable of receiving SMS

2. **Verification Code Issues**
   ```typescript
   // Implement proper error handling in verification
   try {
     await confirmationResult.confirm(verificationCode);
   } catch (error) {
     if (error.code === 'auth/invalid-verification-code') {
       // Handle invalid code
     } else if (error.code === 'auth/code-expired') {
       // Handle expired code
     }
   }
   ```

3. **SMS Not Received**
   - Check if phone has blocked messages from short codes
   - Try after a few minutes (SMS delays)
   - Verify Firebase Phone Authentication is properly enabled in the console

### Account Locking/Rate Limiting

**Symptoms**
- Too many failed login attempts errors
- Temporary account lockout messages

**Solutions**

1. **Rate Limiting**
   - Implement exponential backoff for retry attempts
   - Add CAPTCHA verification after multiple failures
   - Wait for the Firebase-imposed cool-down period (usually ~1 hour)

2. **Account Recovery**
   - Use password reset flow to regain access
   - Contact administrator for account unlock

## Firestore Data Access Problems

### Permission Denied Errors

**Symptoms**
- "Permission denied" errors when reading/writing data
- Data visible in Firebase Console but not in application

**Solutions**

1. **Authentication State**
   - Verify user is properly authenticated before data access
   ```typescript
   if (!auth.currentUser) {
     // Redirect to login or handle unauthenticated state
     return;
   }
   ```

2. **Security Rules**
   - Review Firestore security rules for the specific collection
   - Check if rules include proper user/role validation
   ```
   // Example of rule that might be causing issues
   match /users/{userId} {
     allow read, write: if request.auth.uid == userId;
   }
   ```

3. **Debug Security Rules**
   - Use the Firebase Console Rules Playground to test rules
   - Add logging to identify exact permission failure points

### Query Returns No Results

**Symptoms**
- Empty result sets when data should exist
- Inconsistent query results

**Solutions**

1. **Query Construction**
   - Verify field names and query operators
   ```typescript
   // Check for typos in field names
   const wrongQuery = query(collection(db, 'users'), where('lastName', '==', 'Smith'));
   // Should be:
   const correctQuery = query(collection(db, 'users'), where('last_name', '==', 'Smith'));
   ```

2. **Index Missing**
   - Create required composite indexes for complex queries
   - Look for "FAILED_PRECONDITION" errors in console
   - Follow the provided link to create the missing index

3. **Data Consistency**
   - Check if data exists in the expected format
   - Verify data types match query parameters

### Data Synchronization Issues

**Symptoms**
- Real-time updates not reflecting in the UI
- Stale data displaying after changes

**Solutions**

1. **Listener Setup**
   ```typescript
   // Ensure unsubscribe is called properly
   const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
     if (doc.exists()) {
       setUserData(doc.data());
     }
   });
   
   // Call on component unmount
   return () => unsubscribe();
   ```

2. **Listener Cleanup**
   - Verify all onSnapshot listeners are properly unsubscribed
   - Check for memory leaks with multiple listeners

## Storage Upload and Download Errors

### File Upload Failures

**Symptoms**
- Upload progress stalls
- "Unauthorized" errors during upload
- Files appear corrupt after upload

**Solutions**

1. **Authentication**
   - Ensure user is authenticated before upload
   - Check storage rules for write permissions

2. **File Size Limits**
   ```typescript
   // Implement client-side validation
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File size exceeds 5MB limit');
   }
   ```

3. **Path Configuration**
   - Ensure storage paths follow allowed patterns in rules
   - Use consistent path structures
   ```typescript
   // Example of proper path structure
   const filePath = `users/${userId}/documents/${fileName}`;
   ```

### File Download Issues

**Symptoms**
- Unable to access download URLs
- "Not found" errors when accessing files
- Permission denied when trying to download

**Solutions**

1. **URL Generation**
   ```typescript
   // Use getDownloadURL with proper error handling
   try {
     const url = await getDownloadURL(ref(storage, filePath));
   } catch (error) {
     if (error.code === 'storage/object-not-found') {
       // Handle file not found
     } else if (error.code === 'storage/unauthorized') {
       // Handle permission issues
     }
   }
   ```

2. **Storage Rules**
   - Review storage rules for read permissions
   - Check if file path matches allowed patterns

3. **URL Expiration**
   - Generated URLs may expire after a period
   - Regenerate download URLs as needed

## Cloud Functions Deployment and Execution Problems

### Deployment Failures

**Symptoms**
- `firebase deploy --only functions` fails
- Build errors during deployment
- Permission issues during deployment

**Solutions**

1. **Project Configuration**
   - Verify `firebase.json` and `functions/package.json` are correctly configured
   - Check Node.js version in `package.json` engines field matches supported versions

2. **Build Errors**
   - Run `npm run build` in functions directory to identify issues
   - Fix TypeScript errors before deployment

3. **Permission Issues**
   - Ensure Firebase CLI is logged in with proper permissions
   - Verify service account has necessary IAM roles
   ```bash
   # Login with account that has proper permissions
   firebase login
   ```

### Function Execution Errors

**Symptoms**
- Functions fail silently
- Error messages in Firebase Console but function seems to have no effect
- Timeout errors

**Solutions**

1. **Error Handling**
   ```typescript
   // Implement proper error handling in functions
   export const processData = functions.https.onCall(async (data, context) => {
     try {
       // Function logic
     } catch (error) {
       console.error('Function failed:', error);
       throw new functions.https.HttpsError('internal', 'Processing failed', error);
     }
   });
   ```

2. **Timeouts**
   - For long-running operations, increase timeout or use background functions
   ```typescript
   // Set higher timeout for complex operations
   export const longOperation = functions
     .runWith({ timeoutSeconds: 540 }) // 9 minutes
     .https.onCall(async (data, context) => {
       // Long-running operation
     });
   ```

3. **Debugging**
   - Use Firebase Console logs to examine execution flow
   - Add detailed logging throughout function logic

## Performance and Optimization Issues

### Slow Query Performance

**Symptoms**
- Queries take too long to return results
- UI feels sluggish when loading data
- High latency in data operations

**Solutions**

1. **Query Optimization**
   ```typescript
   // Use limit to reduce document count
   const optimizedQuery = query(
     collection(db, 'items'),
     where('status', '==', 'active'),
     orderBy('createdAt', 'desc'),
     limit(20)
   );
   ```

2. **Indexing**
   - Create proper indexes for frequently used queries
   - Use single-field indexes for simple queries

3. **Data Structure**
   - Consider denormalizing data for common access patterns
   - Use subcollections for one-to-many relationships

### Excessive Bandwidth Usage

**Symptoms**
- High Firebase billing costs
- Slow loading times on mobile devices
- Excessive data transfer

**Solutions**

1. **Field Selection**
   ```typescript
   // Only fetch required fields
   const userProfileRef = doc(db, 'users', userId);
   const userSnap = await getDoc(userProfileRef);
   
   // Instead of using all data
   const allUserData = userSnap.data();
   
   // Only extract needed fields
   const { name, email, role } = userSnap.data();
   ```

2. **Pagination**
   - Implement cursor-based pagination for large collections
   ```typescript
   // Get first page
   const first = query(collection(db, 'users'), orderBy('name'), limit(25));
   const snapshot = await getDocs(first);
   
   // Get next page
   const last = snapshot.docs[snapshot.docs.length - 1];
   const next = query(collection(db, 'users'), orderBy('name'), startAfter(last), limit(25));
   ```

3. **Caching Strategy**
   - Implement client-side caching for frequently accessed data
   - Use offline persistence when appropriate

## Security Rules Debugging

### Rules Testing Failures

**Symptoms**
- Security rules tests fail unexpectedly
- Rules behave differently in production vs. testing

**Solutions**

1. **Rule Simulator**
   - Use Firebase Console Rule Simulator to test specific scenarios
   - Verify authentication state and data structure matches expectations

2. **Unit Testing**
   ```typescript
   // Set up rules testing with @firebase/rules-unit-testing
   import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

   const testEnv = await initializeTestEnvironment({
     projectId: 'demo-project-id',
     firestore: {
       rules: fs.readFileSync('firestore.rules', 'utf8'),
     },
   });
   
   const unauthedDb = testEnv.unauthenticatedContext().firestore();
   const authedDb = testEnv.authenticatedContext('user123').firestore();
   
   await assertFails(unauthedDb.collection('users').doc('user123').get());
   await assertSucceeds(authedDb.collection('users').doc('user123').get());
   ```

3. **Rule Simplification**
   - Break down complex rules into smaller, testable components
   - Use function reuse in security rules

### Complex Permission Logic

**Symptoms**
- Difficulty determining why permissions are denied
- Inconsistent access across different use cases

**Solutions**

1. **Rules Debugging**
   ```
   // Add debug logging to rules
   match /users/{userId} {
     allow read: if debug('Read access check for ' + userId + ' by ' + request.auth.uid) && 
                   userId == request.auth.uid;
   }
   
   function debug(msg) {
     return true;  // Logs msg to console but doesn't affect rule outcome
   }
   ```

2. **Permission Hierarchy**
   - Organize rules in order of specificity
   - Document permission paths clearly

## Environment Configuration Problems

### API Keys and Environment Variables

**Symptoms**
- Firebase initialization fails
- "Invalid API key" errors
- Features work in development but not production

**Solutions**

1. **Environment File Configuration**
   - Verify `.env.local` contains all required variables
   - Check that variables are properly prefixed (e.g., `NEXT_PUBLIC_` for client-side use)

2. **Variable Usage**
   ```typescript
   // Verify environment variables are correctly accessed
   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     // ...other config
   };
   
   // Add validation
   if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
     throw new Error('Firebase configuration incomplete. Check environment variables.');
   }
   ```

3. **Build Process**
   - Ensure environment variables are included during build
   - For Next.js, verify that `.env.production` is correctly set up for production builds

### Feature Flag Issues

**Symptoms**
- Features not appearing in specific environments
- Inconsistent feature availability

**Solutions**

1. **Configuration Service**
   ```typescript
   // Check feature flags properly
   if (configService.isFeatureEnabled('new_dashboard')) {
     // Render new dashboard
   } else {
     // Use legacy dashboard
   }
   ```

2. **Remote Config Integration**
   - Verify Firebase Remote Config is properly fetched and activated
   - Check for outdated cached configurations

## Offline/Online Synchronization Issues

### Data Not Syncing After Coming Online

**Symptoms**
- Changes made offline don't appear after reconnection
- Conflicts between local and server data

**Solutions**

1. **Persistence Configuration**
   ```typescript
   // Enable offline persistence properly
   import { enableIndexedDbPersistence } from 'firebase/firestore';
   
   enableIndexedDbPersistence(db).catch((err) => {
     if (err.code === 'failed-precondition') {
       // Multiple tabs open, persistence can only be enabled in one tab
     } else if (err.code === 'unimplemented') {
       // Browser doesn't support persistence
     }
   });
   ```

2. **Network Status Handling**
   ```typescript
   // Monitor online status and trigger syncs
   import { enableNetwork, disableNetwork } from 'firebase/firestore';
   
   // When going offline
   window.addEventListener('offline', async () => {
     await disableNetwork(db);
     setIsOffline(true);
   });
   
   // When coming back online
   window.addEventListener('online', async () => {
     await enableNetwork(db);
     setIsOffline(false);
   });
   ```

3. **Conflict Resolution**
   - Implement timestamp-based conflict resolution
   - Use transaction operations for critical updates

## Testing Environment Setup

### Emulator Configuration

**Symptoms**
- Tests interact with production Firebase instead of emulators
- Emulators not starting properly
- Authentication emulator not working with other services

**Solutions**

1. **Firebase Emulator Setup**
   ```bash
   # Start all emulators
   firebase emulators:start --only auth,firestore,functions,storage
   ```

2. **Connect to Emulators in Code**
   ```typescript
   // Connect to emulators in development
   if (process.env.NODE_ENV === 'development' || process.env.USE_EMULATOR === 'true') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
     connectFunctionsEmulator(functions, 'localhost', 5001);
     connectStorageEmulator(storage, 'localhost', 9199);
   }
   ```

3. **Test Data Seeding**
   - Create scripts to populate emulators with test data
   - Use beforeEach/afterEach hooks in tests to reset data

## Deployment Troubleshooting

### Hosting Deployment Issues

**Symptoms**
- Blank page after deployment
- Old version still showing after deployment
- Route errors in deployed application

**Solutions**

1. **Caching Issues**
   - Add proper cache control headers in `firebase.json`
   ```json
   {
     "hosting": {
       "headers": [
         {
           "source": "/**",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=3600"
             }
           ]
         }
       ]
     }
   }
   ```

2. **Routing Configuration**
   - Configure proper rewrites for SPA routing
   ```json
   {
     "hosting": {
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Deployment Verification**
   - Check deployment history in Firebase Console
   - Use `firebase hosting:channel:deploy` for preview channels

### Project Settings Mismatches

**Symptoms**
- Features working locally but not in production
- Services enabled in one environment but not another

**Solutions**

1. **Project Configuration Sync**
   - Document all required project settings
   - Use Infrastructure-as-Code approaches for consistency

2. **Environment Parity**
   - Create staging environment that matches production
   - Test deployments in staging before production

### App Performance Monitoring

If you notice performance issues in the deployed application:

1. **Enable Monitoring**
   ```typescript
   // Initialize performance monitoring
   import { getPerformance } from 'firebase/performance';
   const perf = getPerformance(app);
   ```

2. **Custom Traces**
   ```typescript
   // Add custom traces for critical paths
   import { trace } from 'firebase/performance';
   
   async function loadDashboardData() {
     const t = trace(perf, 'dashboardDataLoad');
     t.start();
     
     try {
       // Load data
       await fetchDashboardData();
     } finally {
       t.stop();
     }
   }
   ```

3. **Analyze Console Data**
   - Review Firebase Performance dashboard
   - Look for slow API calls, page loads, or resource fetches