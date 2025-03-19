import {
  testingService,
  TestType,
  TestStatus
} from './TestingService';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { runAuthTests } from './auth.test';
import { runFirestoreTests } from './firestore.test';

// Create a test suite for integration tests
const integrationSuite = testingService.createSuite('Integration Tests', {
  description: 'Tests that verify integration between Firebase services',
  tags: ['integration'],
  
  // Setup before all tests
  beforeAll: async (context) => {
    context.addLog('Setting up integration test suite');
    
    // Create test user
    const userCredential = await context.mockAuth.signUp('integration@example.com', 'integration123');
    context.testData.userId = userCredential.user.uid;
    context.testData.userEmail = 'integration@example.com';
    
    // Add some test data
    context.mockFirestore.addDocument('profiles', {
      userId: context.testData.userId,
      name: 'Integration Test User',
      email: context.testData.userEmail,
      createdAt: Timestamp.now()
    });
    
    // Register a mock cloud function
    context.mockFunctions.registerFunction('createUserProfile', async (data) => {
      const { userId, name, email } = data;
      
      // Add profile to Firestore
      const profileId = context.mockFirestore.addDocument('profiles', {
        userId,
        name,
        email,
        createdAt: Timestamp.now()
      });
      
      return { success: true, profileId };
    });
    
    context.addLog('Integration test setup complete');
  },
  
  // Cleanup after all tests
  afterAll: async (context) => {
    context.addLog('Cleaning up integration test suite');
    context.mockAuth.reset();
    context.mockFirestore.reset();
    context.mockFunctions.reset();
  }
});

// Test user authentication and profile creation
const authProfileIntegrationTest = testingService.createTest(
  'User Authentication and Profile Creation',
  async (context) => {
    const email = 'new.user@example.com';
    const password = 'secure123';
    const name = 'New Integration User';
    
    // Register new user
    const userCredential = await context.mockAuth.signUp(email, password);
    const userId = userCredential.user.uid;
    
    context.addLog(`Created user with ID: ${userId}`);
    
    // Call mock cloud function to create profile
    const createProfileFunction = async (data: any) => {
      return context.mockFunctions.callFunction('createUserProfile', data);
    };
    
    const result = await createProfileFunction({
      userId,
      name,
      email
    });
    
    // Assertions
    if (!result.success) {
      throw new Error('Profile creation failed');
    }
    
    const profileId = result.profileId;
    
    // Verify profile was created in Firestore
    const profile = context.mockFirestore.getDocument('profiles', profileId);
    
    if (!profile) {
      throw new Error('Profile not found in Firestore');
    }
    
    if (profile.userId !== userId) {
      throw new Error(`Profile userId mismatch: ${profile.userId} !== ${userId}`);
    }
    
    if (profile.email !== email) {
      throw new Error(`Profile email mismatch: ${profile.email} !== ${email}`);
    }
    
    context.addLog(`Successfully created and verified profile with ID: ${profileId}`);
  },
  {
    type: TestType.INTEGRATION,
    tags: ['integration', 'auth', 'firestore', 'functions']
  }
);

// Test user authentication and data access
const authDataAccessTest = testingService.createTest(
  'User Authentication and Data Access',
  async (context) => {
    const email = 'access.test@example.com';
    const password = 'access123';
    
    // Create user and data
    const userCredential = await context.mockAuth.signUp(email, password);
    const userId = userCredential.user.uid;
    
    // Create private user data
    const privateDataId = context.mockFirestore.addDocument('userPrivateData', {
      userId,
      secretKey: 'private-key-123',
      notes: 'These are private notes',
      createdAt: Timestamp.now()
    });
    
    // Create public user data
    const publicDataId = context.mockFirestore.addDocument('userPublicData', {
      userId,
      displayName: 'Access Test User',
      bio: 'This is a public bio',
      createdAt: Timestamp.now()
    });
    
    context.addLog(`Created test data: private ID ${privateDataId}, public ID ${publicDataId}`);
    
    // Signout and then sign in again to simulate a real authentication flow
    await context.mockAuth.signOut();
    await context.mockAuth.signIn(email, password);
    
    // Verify current user is set correctly
    if (!context.mockAuth.currentUser) {
      throw new Error('User not authenticated after sign in');
    }
    
    if (context.mockAuth.currentUser.uid !== userId) {
      throw new Error('Authenticated user ID does not match expected ID');
    }
    
    // Access the private and public data
    const privateData = context.mockFirestore.getDocument('userPrivateData', privateDataId);
    const publicData = context.mockFirestore.getDocument('userPublicData', publicDataId);
    
    // Assertions
    if (!privateData) {
      throw new Error('Private data not found');
    }
    
    if (!publicData) {
      throw new Error('Public data not found');
    }
    
    if (privateData.userId !== userId) {
      throw new Error('Private data user ID mismatch');
    }
    
    if (publicData.userId !== userId) {
      throw new Error('Public data user ID mismatch');
    }
    
    context.addLog('Successfully verified authentication and data access');
  },
  {
    type: TestType.INTEGRATION,
    tags: ['integration', 'auth', 'firestore']
  }
);

// Test data synchronization across services
const dataSyncTest = testingService.createTest(
  'Data Synchronization Across Services',
  async (context) => {
    // Create a user
    const userCredential = await context.mockAuth.signUp('sync.test@example.com', 'sync123');
    const userId = userCredential.user.uid;
    
    // Mock function to update user profile and return events to process
    context.mockFunctions.registerFunction('updateUserProfile', async (data) => {
      const { userId, updates } = data;
      
      // Find the user's profile
      const profiles = context.mockFirestore.queryDocuments('profiles', 'userId', '==', userId);
      
      if (profiles.length === 0) {
        // Create new profile if it doesn't exist
        const profileId = context.mockFirestore.addDocument('profiles', {
          userId,
          ...updates,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Create events to process
        const eventId = context.mockFirestore.addDocument('events', {
          type: 'PROFILE_CREATED',
          userId,
          profileId,
          timestamp: Timestamp.now(),
          processed: false
        });
        
        return { success: true, profileId, eventIds: [eventId] };
      } else {
        // Update existing profile
        const profile = profiles[0];
        
        context.mockFirestore.updateDocument('profiles', profile.id, {
          ...updates,
          updatedAt: Timestamp.now()
        });
        
        // Create event to process
        const eventId = context.mockFirestore.addDocument('events', {
          type: 'PROFILE_UPDATED',
          userId,
          profileId: profile.id,
          updates,
          timestamp: Timestamp.now(),
          processed: false
        });
        
        return { success: true, profileId: profile.id, eventIds: [eventId] };
      }
    });
    
    // Function to process events (simulating a background worker)
    context.mockFunctions.registerFunction('processEvents', async (data) => {
      const { eventIds } = data;
      const results: any[] = [];
      
      for (const eventId of eventIds) {
        const event = context.mockFirestore.getDocument('events', eventId);
        
        if (!event) {
          results.push({ eventId, success: false, error: 'Event not found' });
          continue;
        }
        
        if (event.processed) {
          results.push({ eventId, success: true, alreadyProcessed: true });
          continue;
        }
        
        // Process based on event type
        if (event.type === 'PROFILE_CREATED' || event.type === 'PROFILE_UPDATED') {
          // Update search index
          const profile = context.mockFirestore.getDocument('profiles', event.profileId);
          
          if (profile) {
            // Create or update search index
            const searchData = {
              userId: profile.userId,
              name: profile.name || '',
              email: profile.email || '',
              bio: profile.bio || '',
              updatedAt: Timestamp.now()
            };
            
            // Check if search doc already exists
            const searchDocs = context.mockFirestore.queryDocuments('userSearch', 'userId', '==', profile.userId);
            
            if (searchDocs.length > 0) {
              context.mockFirestore.updateDocument('userSearch', searchDocs[0].id, searchData);
            } else {
              context.mockFirestore.addDocument('userSearch', searchData);
            }
            
            // If profile was updated, create notification
            if (event.type === 'PROFILE_UPDATED') {
              context.mockFirestore.addDocument('notifications', {
                userId: profile.userId,
                type: 'PROFILE_UPDATED',
                message: 'Your profile was updated',
                read: false,
                createdAt: Timestamp.now()
              });
            }
            
            // Mark event as processed
            context.mockFirestore.updateDocument('events', eventId, {
              processed: true,
              processedAt: Timestamp.now()
            });
            
            results.push({ eventId, success: true });
          } else {
            results.push({ eventId, success: false, error: 'Profile not found' });
          }
        } else {
          results.push({ eventId, success: false, error: 'Unknown event type' });
        }
      }
      
      return { results };
    });
    
    // Call update profile function
    const updateResult = await context.mockFunctions.callFunction('updateUserProfile', {
      userId,
      updates: {
        name: 'Sync Test User',
        email: 'sync.test@example.com',
        bio: 'Testing data synchronization'
      }
    });
    
    // Verify profile was created
    if (!updateResult.success) {
      throw new Error('Profile update failed');
    }
    
    const profileId = updateResult.profileId;
    const eventIds = updateResult.eventIds;
    
    context.addLog(`Profile updated with ID: ${profileId}, Events: ${eventIds.join(', ')}`);
    
    // Process the events
    const processResult = await context.mockFunctions.callFunction('processEvents', {
      eventIds
    });
    
    // Verify events were processed
    for (const result of processResult.results) {
      if (!result.success) {
        throw new Error(`Event processing failed: ${result.error}`);
      }
    }
    
    // Verify search index was updated
    const searchDocs = context.mockFirestore.queryDocuments('userSearch', 'userId', '==', userId);
    
    if (searchDocs.length === 0) {
      throw new Error('Search index not created');
    }
    
    const searchDoc = searchDocs[0];
    
    if (searchDoc.name !== 'Sync Test User') {
      throw new Error(`Search index name mismatch: ${searchDoc.name}`);
    }
    
    // Verify notifications were created (for profile update)
    const notifications = context.mockFirestore.queryDocuments('notifications', 'userId', '==', userId);
    
    if (notifications.length === 0) {
      throw new Error('Notifications not created');
    }
    
    context.addLog('Successfully verified data synchronization across services');
  },
  {
    type: TestType.INTEGRATION,
    tags: ['integration', 'firestore', 'functions', 'sync']
  }
);

// Add tests to the suite
testingService.addTestToSuite(integrationSuite.id, authProfileIntegrationTest);
testingService.addTestToSuite(integrationSuite.id, authDataAccessTest);
testingService.addTestToSuite(integrationSuite.id, dataSyncTest);

// Function to run all tests (unit and integration)
export async function runAllTests() {
  console.log('Running all tests (unit and integration)...');
  
  // Run individual test suites
  const authResults = await runAuthTests();
  const firestoreResults = await runFirestoreTests();
  
  // Run integration tests
  const integrationResults = await testingService.runTests({
    tags: ['integration']
  });
  
  // Calculate test success rate
  const totalTests = authResults.totalTests + firestoreResults.totalTests + integrationResults.length;
  const passedTests = authResults.passedTests + firestoreResults.passedTests + 
    integrationResults.filter(r => r.status === TestStatus.PASSED).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`All tests completed. Pass rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  return {
    totalTests,
    passedTests,
    successRate,
    authResults,
    firestoreResults,
    integrationResults
  };
}

// Function to run just integration tests
export async function runIntegrationTests() {
  console.log('Running integration tests...');
  
  const results = await testingService.runTests({
    tags: ['integration']
  });
  
  // Calculate test success rate
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Integration tests completed. Pass rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  return {
    totalTests,
    passedTests,
    successRate,
    results
  };
}

// If this file is executed directly, run the tests
if (require.main === module) {
  runIntegrationTests()
    .then(result => {
      // Exit with appropriate code based on test success
      process.exit(result.successRate === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running integration tests:', error);
      process.exit(1);
    });
} 