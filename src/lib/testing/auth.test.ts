import { 
  testingService, 
  TestType, 
  TestStatus 
} from './TestingService';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';

// Create a test suite for authentication
const authSuite = testingService.createSuite('Authentication Tests', {
  description: 'Tests for Firebase authentication functionality',
  tags: ['auth', 'unit'],
  
  // Setup before all tests in this suite
  beforeAll: async (context) => {
    context.addLog('Setting up authentication suite');
    
    // Register a test user that all tests can use
    await context.mockAuth.signUp('test@example.com', 'password123');
    context.addLog('Test user registered');
    
    // Clear current user before starting tests
    context.mockAuth.setCurrentUser(null);
  },
  
  // Clean up after all tests
  afterAll: async (context) => {
    context.addLog('Cleaning up authentication suite');
    context.mockAuth.reset();
  }
});

// Test user registration
const registerTest = testingService.createTest(
  'User Registration',
  async (context) => {
    const email = 'newuser@example.com';
    const password = 'securePassword123';
    
    // Mock the Firebase auth implementation to use our mock
    const originalSignUp = createUserWithEmailAndPassword;
    (createUserWithEmailAndPassword as any) = async (auth: any, email: string, password: string) => {
      return context.mockAuth.signUp(email, password);
    };
    
    try {
      // Perform registration
      const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
      
      // Assertions
      if (!userCredential.user) {
        throw new Error('User is null after registration');
      }
      
      if (userCredential.user.email !== email) {
        throw new Error(`Expected email ${email}, got ${userCredential.user.email}`);
      }
      
      // Check if the user was added to the mock auth store
      const storedUser = context.mockAuth.users[userCredential.user.uid];
      if (!storedUser) {
        throw new Error('User not stored in mock auth store');
      }
      
      context.addLog(`User registered successfully with UID: ${userCredential.user.uid}`);
    } finally {
      // Restore original implementation
      (createUserWithEmailAndPassword as any) = originalSignUp;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['auth', 'registration']
  }
);

// Test user login
const loginTest = testingService.createTest(
  'User Login',
  async (context) => {
    const email = 'test@example.com';
    const password = 'password123';
    
    // Mock the Firebase auth implementation to use our mock
    const originalSignIn = signInWithEmailAndPassword;
    (signInWithEmailAndPassword as any) = async (auth: any, email: string, password: string) => {
      return context.mockAuth.signIn(email, password);
    };
    
    try {
      // Perform login
      const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
      
      // Assertions
      if (!userCredential.user) {
        throw new Error('User is null after login');
      }
      
      if (userCredential.user.email !== email) {
        throw new Error(`Expected email ${email}, got ${userCredential.user.email}`);
      }
      
      // Verify the current user is set
      if (context.mockAuth.currentUser?.uid !== userCredential.user.uid) {
        throw new Error('Current user not updated after login');
      }
      
      context.addLog(`User logged in successfully with UID: ${userCredential.user.uid}`);
    } finally {
      // Restore original implementation
      (signInWithEmailAndPassword as any) = originalSignIn;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['auth', 'login']
  }
);

// Test user logout
const logoutTest = testingService.createTest(
  'User Logout',
  async (context) => {
    // First need to log in a user
    await context.mockAuth.signIn('test@example.com', 'password123');
    
    if (!context.mockAuth.currentUser) {
      throw new Error('Failed to set up test: User not logged in');
    }
    
    // Mock the Firebase auth implementation to use our mock
    const originalSignOut = signOut;
    (signOut as any) = async (auth: any) => {
      return context.mockAuth.signOut();
    };
    
    try {
      // Perform logout
      await signOut(getAuth());
      
      // Assertion: current user should be null after signOut
      if (context.mockAuth.currentUser !== null) {
        throw new Error('Current user not cleared after logout');
      }
      
      context.addLog('User logged out successfully');
    } finally {
      // Restore original implementation
      (signOut as any) = originalSignOut;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['auth', 'logout']
  }
);

// Test login failure with wrong password
const loginFailureTest = testingService.createTest(
  'Login Failure with Wrong Password',
  async (context) => {
    const email = 'test@example.com';
    const wrongPassword = 'wrongPassword';
    
    // Mock the Firebase auth implementation to use our mock
    const originalSignIn = signInWithEmailAndPassword;
    (signInWithEmailAndPassword as any) = async (auth: any, email: string, password: string) => {
      return context.mockAuth.signIn(email, password);
    };
    
    try {
      // Attempt login with wrong password, should throw an error
      let errorThrown = false;
      try {
        await signInWithEmailAndPassword(getAuth(), email, wrongPassword);
      } catch (error) {
        errorThrown = true;
        context.addLog(`Login correctly failed: ${error}`);
      }
      
      if (!errorThrown) {
        throw new Error('Login with wrong password did not throw an error');
      }
      
      // Verify current user is still null
      if (context.mockAuth.currentUser !== null) {
        throw new Error('Current user was set despite login failure');
      }
    } finally {
      // Restore original implementation
      (signInWithEmailAndPassword as any) = originalSignIn;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['auth', 'login', 'error-handling']
  }
);

// Add all tests to the suite
testingService.addTestToSuite(authSuite.id, registerTest);
testingService.addTestToSuite(authSuite.id, loginTest);
testingService.addTestToSuite(authSuite.id, logoutTest);
testingService.addTestToSuite(authSuite.id, loginFailureTest);

// Function to run the tests
export async function runAuthTests() {
  console.log('Running authentication tests...');
  
  const results = await testingService.runTests({
    tags: ['auth']
  });
  
  // Calculate test success rate
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Auth tests completed. Pass rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  return {
    totalTests,
    passedTests,
    successRate,
    results
  };
}

// If this file is executed directly, run the tests
if (require.main === module) {
  runAuthTests()
    .then(result => {
      // Exit with appropriate code based on test success
      process.exit(result.successRate === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running auth tests:', error);
      process.exit(1);
    });
} 