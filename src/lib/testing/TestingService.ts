import { 
  Firestore, 
  CollectionReference, 
  DocumentReference,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  Auth,
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  FirebaseStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Test environment type
 */
export enum TestEnvironment {
  LOCAL = 'local',
  EMULATOR = 'emulator',
  TEST = 'test',
  DEVELOPMENT = 'development'
}

/**
 * Test status
 */
export enum TestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  ERROR = 'error'
}

/**
 * Test types
 */
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

/**
 * Test case info
 */
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  type: TestType;
  tags: string[];
  timeout?: number; // in milliseconds
  testFn: (context: TestContext) => Promise<void>;
}

/**
 * Test result
 */
export interface TestResult {
  testId: string;
  testName: string;
  status: TestStatus;
  duration: number; // in milliseconds
  error?: Error;
  errorStack?: string;
  timestamp: Timestamp;
  logs: string[];
  metadata?: Record<string, any>;
}

/**
 * Test suite info
 */
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  tests: TestCase[];
  beforeAll?: (context: TestContext) => Promise<void>;
  afterAll?: (context: TestContext) => Promise<void>;
  beforeEach?: (context: TestContext) => Promise<void>;
  afterEach?: (context: TestContext) => Promise<void>;
  tags: string[];
}

/**
 * Test context provided to test functions
 */
export interface TestContext {
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  app: FirebaseApp;
  functions: ReturnType<typeof getFunctions>;
  environment: TestEnvironment;
  currentUser?: User;
  testId: string;
  suiteId: string;
  timestamp: Timestamp;
  params: Record<string, any>;
  collections: Record<string, CollectionReference>;
  documents: Record<string, DocumentReference>;
  testData: Record<string, any>;
  logs: string[];
  addLog: (message: string) => void;
  cleanup: () => Promise<void>;
  mockFirestore: MockFirestore;
  mockAuth: MockAuth;
  mockStorage: MockStorage;
  mockFunctions: MockFunctions;
}

/**
 * Mock Firestore for testing
 */
export interface MockFirestore {
  collections: Record<string, any[]>;
  addDocument: (collectionPath: string, data: any) => string;
  getDocument: (collectionPath: string, id: string) => any;
  updateDocument: (collectionPath: string, id: string, data: any) => void;
  deleteDocument: (collectionPath: string, id: string) => void;
  queryDocuments: (collectionPath: string, field: string, operator: string, value: any) => any[];
  reset: () => void;
}

/**
 * Mock Auth for testing
 */
export interface MockAuth {
  currentUser: User | null;
  users: Record<string, User>;
  userCredentials: Record<string, UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  reset: () => void;
}

/**
 * Mock Storage for testing
 */
export interface MockStorage {
  files: Record<string, { data: Uint8Array; metadata: any; url: string }>;
  upload: (path: string, data: Uint8Array, metadata?: any) => Promise<void>;
  getDownloadURL: (path: string) => Promise<string>;
  delete: (path: string) => Promise<void>;
  reset: () => void;
}

/**
 * Mock Functions for testing
 */
export interface MockFunctions {
  functions: Record<string, (data: any) => Promise<any>>;
  registerFunction: (name: string, fn: (data: any) => Promise<any>) => void;
  callFunction: (name: string, data: any) => Promise<any>;
  reset: () => void;
}

/**
 * Test run options
 */
export interface TestRunOptions {
  environment?: TestEnvironment;
  tags?: string[];
  exclude?: string[];
  parallel?: boolean;
  timeout?: number;
  retries?: number;
  params?: Record<string, any>;
  seed?: string;
  reporter?: TestReporter;
}

/**
 * Test reporter interface
 */
export interface TestReporter {
  onRunStart: (suites: TestSuite[]) => void;
  onSuiteStart: (suite: TestSuite) => void;
  onTestStart: (test: TestCase) => void;
  onTestResult: (test: TestCase, result: TestResult) => void;
  onSuiteComplete: (suite: TestSuite, results: TestResult[]) => void;
  onRunComplete: (results: TestResult[]) => void;
  onLog: (message: string, testId?: string, suiteId?: string) => void;
}

/**
 * Default console reporter
 */
export class ConsoleReporter implements TestReporter {
  onRunStart(suites: TestSuite[]): void {
    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    console.log(`Running ${totalTests} tests from ${suites.length} suites\n`);
  }

  onSuiteStart(suite: TestSuite): void {
    console.log(`Suite: ${suite.name} (${suite.tests.length} tests)`);
  }

  onTestStart(test: TestCase): void {
    console.log(`  Running test: ${test.name}`);
  }

  onTestResult(test: TestCase, result: TestResult): void {
    const status = result.status === TestStatus.PASSED ? 
      '\x1b[32mPASSED\x1b[0m' : 
      result.status === TestStatus.FAILED ? 
        '\x1b[31mFAILED\x1b[0m' : 
        `\x1b[33m${result.status.toUpperCase()}\x1b[0m`;
    
    console.log(`  ${test.name}: ${status} (${result.duration}ms)`);
    
    if (result.error) {
      console.error(`    Error: ${result.error.message}`);
      if (result.errorStack) {
        console.error(`    Stack: ${result.errorStack}`);
      }
    }
    
    if (result.logs && result.logs.length > 0) {
      console.log('    Logs:');
      result.logs.forEach(log => console.log(`      ${log}`));
    }
  }

  onSuiteComplete(suite: TestSuite, results: TestResult[]): void {
    const passed = results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = results.filter(r => r.status === TestStatus.FAILED).length;
    const skipped = results.filter(r => r.status === TestStatus.SKIPPED).length;
    const errors = results.filter(r => r.status === TestStatus.ERROR).length;
    
    console.log(`  Summary: ${passed} passed, ${failed} failed, ${skipped} skipped, ${errors} errors\n`);
  }

  onRunComplete(results: TestResult[]): void {
    const passed = results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = results.filter(r => r.status === TestStatus.FAILED).length;
    const skipped = results.filter(r => r.status === TestStatus.SKIPPED).length;
    const errors = results.filter(r => r.status === TestStatus.ERROR).length;
    const total = results.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`Test Run Complete: ${passed}/${total} passed (${successRate}%)`);
    console.log(`${passed} passed, ${failed} failed, ${skipped} skipped, ${errors} errors`);
    
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    console.log(`Total time: ${totalDuration}ms`);
  }

  onLog(message: string, testId?: string, suiteId?: string): void {
    if (testId) {
      console.log(`[Test ${testId}] ${message}`);
    } else if (suiteId) {
      console.log(`[Suite ${suiteId}] ${message}`);
    } else {
      console.log(message);
    }
  }
}

/**
 * Testing service for Firebase
 */
export class TestingService {
  private suites: TestSuite[] = [];
  private mockFirestore: MockFirestore;
  private mockAuth: MockAuth;
  private mockStorage: MockStorage;
  private mockFunctions: MockFunctions;
  private defaultOptions: TestRunOptions = {
    environment: TestEnvironment.EMULATOR,
    parallel: false,
    timeout: 5000,
    retries: 1,
    reporter: new ConsoleReporter()
  };
  
  constructor() {
    // Initialize mocks
    this.mockFirestore = this.createMockFirestore();
    this.mockAuth = this.createMockAuth();
    this.mockStorage = this.createMockStorage();
    this.mockFunctions = this.createMockFunctions();
  }
  
  /**
   * Register a test suite
   * @param suite Test suite to register
   */
  registerSuite(suite: TestSuite): void {
    // Ensure unique ID
    if (this.suites.some(s => s.id === suite.id)) {
      throw new Error(`Test suite with ID ${suite.id} already exists`);
    }
    
    this.suites.push(suite);
  }
  
  /**
   * Create a test suite
   * @param name Suite name
   * @param options Suite options
   */
  createSuite(
    name: string,
    options: {
      description?: string;
      tests?: TestCase[];
      beforeAll?: (context: TestContext) => Promise<void>;
      afterAll?: (context: TestContext) => Promise<void>;
      beforeEach?: (context: TestContext) => Promise<void>;
      afterEach?: (context: TestContext) => Promise<void>;
      tags?: string[];
    } = {}
  ): TestSuite {
    const id = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const suite: TestSuite = {
      id,
      name,
      description: options.description,
      tests: options.tests || [],
      beforeAll: options.beforeAll,
      afterAll: options.afterAll,
      beforeEach: options.beforeEach,
      afterEach: options.afterEach,
      tags: options.tags || []
    };
    
    this.registerSuite(suite);
    
    return suite;
  }
  
  /**
   * Create a test case
   * @param name Test name
   * @param testFn Test function
   * @param options Test options
   */
  createTest(
    name: string,
    testFn: (context: TestContext) => Promise<void>,
    options: {
      description?: string;
      type?: TestType;
      tags?: string[];
      timeout?: number;
    } = {}
  ): TestCase {
    const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      name,
      description: options.description,
      type: options.type || TestType.UNIT,
      tags: options.tags || [],
      timeout: options.timeout,
      testFn
    };
  }
  
  /**
   * Add a test to a suite
   * @param suiteId Suite ID
   * @param test Test case
   */
  addTestToSuite(suiteId: string, test: TestCase): void {
    const suite = this.suites.find(s => s.id === suiteId);
    
    if (!suite) {
      throw new Error(`Suite with ID ${suiteId} not found`);
    }
    
    suite.tests.push(test);
  }
  
  /**
   * Run all tests
   * @param options Test run options
   */
  async runTests(options: TestRunOptions = {}): Promise<TestResult[]> {
    const runOptions = { ...this.defaultOptions, ...options };
    const reporter = runOptions.reporter;
    
    // Filter suites by tags if specified
    let filteredSuites = [...this.suites];
    
    if (runOptions.tags && runOptions.tags.length > 0) {
      filteredSuites = filteredSuites.filter(suite => 
        runOptions.tags!.some(tag => suite.tags.includes(tag))
      );
    }
    
    // Apply exclude tags if specified
    if (runOptions.exclude && runOptions.exclude.length > 0) {
      filteredSuites = filteredSuites.filter(suite => 
        !runOptions.exclude!.some(tag => suite.tags.includes(tag))
      );
    }
    
    if (reporter) {
      reporter.onRunStart(filteredSuites);
    }
    
    const allResults: TestResult[] = [];
    
    // Run suites sequentially or in parallel
    if (runOptions.parallel) {
      const suitePromises = filteredSuites.map(suite => 
        this.runSuite(suite, runOptions)
      );
      
      const suiteResults = await Promise.all(suitePromises);
      
      for (const results of suiteResults) {
        allResults.push(...results);
      }
    } else {
      for (const suite of filteredSuites) {
        const results = await this.runSuite(suite, runOptions);
        allResults.push(...results);
      }
    }
    
    if (reporter) {
      reporter.onRunComplete(allResults);
    }
    
    return allResults;
  }
  
  /**
   * Run a specific test suite
   * @param suite Test suite
   * @param options Test run options
   */
  private async runSuite(suite: TestSuite, options: TestRunOptions): Promise<TestResult[]> {
    const reporter = options.reporter;
    
    if (reporter) {
      reporter.onSuiteStart(suite);
    }
    
    const results: TestResult[] = [];
    
    try {
      // Create a test context for this suite
      const suiteContext = this.createTestContext(suite.id, '', options);
      
      // Run beforeAll hook if it exists
      if (suite.beforeAll) {
        try {
          await suite.beforeAll(suiteContext);
        } catch (error) {
          if (reporter) {
            reporter.onLog(`Error in beforeAll hook: ${error}`, '', suite.id);
          }
          
          // If beforeAll fails, mark all tests as skipped
          for (const test of suite.tests) {
            const skipResult: TestResult = {
              testId: test.id,
              testName: test.name,
              status: TestStatus.SKIPPED,
              duration: 0,
              timestamp: Timestamp.now(),
              logs: [`Skipped due to beforeAll hook failure: ${error}`]
            };
            
            results.push(skipResult);
            
            if (reporter) {
              reporter.onTestResult(test, skipResult);
            }
          }
          
          return results;
        }
      }
      
      // Run each test
      for (const test of suite.tests) {
        let shouldSkip = false;
        
        // Filter by tags if specified
        if (options.tags && options.tags.length > 0) {
          if (!options.tags.some(tag => test.tags.includes(tag))) {
            shouldSkip = true;
          }
        }
        
        // Apply exclude tags if specified
        if (!shouldSkip && options.exclude && options.exclude.length > 0) {
          if (options.exclude.some(tag => test.tags.includes(tag))) {
            shouldSkip = true;
          }
        }
        
        let testResult: TestResult;
        
        if (shouldSkip) {
          testResult = {
            testId: test.id,
            testName: test.name,
            status: TestStatus.SKIPPED,
            duration: 0,
            timestamp: Timestamp.now(),
            logs: ['Skipped due to tag filters']
          };
        } else {
          testResult = await this.runTest(test, suite, options);
        }
        
        results.push(testResult);
        
        if (reporter) {
          reporter.onTestResult(test, testResult);
        }
      }
      
      // Run afterAll hook if it exists
      if (suite.afterAll) {
        try {
          await suite.afterAll(suiteContext);
        } catch (error) {
          if (reporter) {
            reporter.onLog(`Error in afterAll hook: ${error}`, '', suite.id);
          }
        }
      }
      
      // Clean up context
      await suiteContext.cleanup();
    } catch (error) {
      if (reporter) {
        reporter.onLog(`Error running suite: ${error}`, '', suite.id);
      }
    }
    
    if (reporter) {
      reporter.onSuiteComplete(suite, results);
    }
    
    return results;
  }
  
  /**
   * Run a specific test
   * @param test Test case
   * @param suite Parent suite
   * @param options Test run options
   */
  private async runTest(test: TestCase, suite: TestSuite, options: TestRunOptions): Promise<TestResult> {
    const reporter = options.reporter;
    
    if (reporter) {
      reporter.onTestStart(test);
    }
    
    const testContext = this.createTestContext(suite.id, test.id, options);
    const startTime = Date.now();
    
    const result: TestResult = {
      testId: test.id,
      testName: test.name,
      status: TestStatus.RUNNING,
      duration: 0,
      timestamp: Timestamp.now(),
      logs: []
    };
    
    // Handle timeouts
    const timeout = test.timeout || options.timeout || this.defaultOptions.timeout;
    let timeoutId: NodeJS.Timeout | undefined;
    
    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);
    });
    
    try {
      // Run beforeEach hook if it exists
      if (suite.beforeEach) {
        await suite.beforeEach(testContext);
      }
      
      // Run the test with timeout
      await Promise.race([
        test.testFn(testContext),
        timeoutPromise
      ]);
      
      // If we got here, test passed
      result.status = TestStatus.PASSED;
    } catch (error) {
      // Test failed
      result.status = TestStatus.FAILED;
      result.error = error as Error;
      result.errorStack = (error as Error).stack;
    } finally {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Run afterEach hook if it exists
      if (suite.afterEach) {
        try {
          await suite.afterEach(testContext);
        } catch (error) {
          testContext.addLog(`Error in afterEach hook: ${error}`);
        }
      }
      
      // Calculate duration
      result.duration = Date.now() - startTime;
      
      // Capture logs
      result.logs = [...testContext.logs];
      
      // Clean up context
      await testContext.cleanup();
    }
    
    return result;
  }
  
  /**
   * Create a test context
   * @param suiteId Suite ID
   * @param testId Test ID
   * @param options Test options
   */
  private createTestContext(suiteId: string, testId: string, options: TestRunOptions): TestContext {
    const logs: string[] = [];
    const testData: Record<string, any> = {};
    const collections: Record<string, CollectionReference> = {};
    const documents: Record<string, DocumentReference> = {};
    
    const addLog = (message: string): void => {
      logs.push(message);
      
      if (options.reporter) {
        options.reporter.onLog(message, testId, suiteId);
      }
    };
    
    const cleanup = async (): Promise<void> => {
      // Reset mocks
      this.mockFirestore.reset();
      this.mockAuth.reset();
      this.mockStorage.reset();
      this.mockFunctions.reset();
      
      // Log cleanup completion
      addLog('Test context cleaned up');
    };
    
    // Create empty implementations for Firebase services
    // In a real implementation, these would be connected to the Firebase emulator
    // or mocked more thoroughly
    const db = {} as Firestore;
    const auth = {} as Auth;
    const storage = {} as FirebaseStorage;
    const app = {} as FirebaseApp;
    const functions = getFunctions();
    
    return {
      db,
      auth,
      storage,
      app,
      functions,
      environment: options.environment || TestEnvironment.EMULATOR,
      testId,
      suiteId,
      timestamp: Timestamp.now(),
      params: options.params || {},
      collections,
      documents,
      testData,
      logs,
      addLog,
      cleanup,
      mockFirestore: this.mockFirestore,
      mockAuth: this.mockAuth,
      mockStorage: this.mockStorage,
      mockFunctions: this.mockFunctions
    };
  }
  
  /**
   * Create mock Firestore
   */
  private createMockFirestore(): MockFirestore {
    const collections: Record<string, any[]> = {};
    
    const addDocument = (collectionPath: string, data: any): string => {
      if (!collections[collectionPath]) {
        collections[collectionPath] = [];
      }
      
      const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      collections[collectionPath].push({
        id,
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return id;
    };
    
    const getDocument = (collectionPath: string, id: string): any | null => {
      if (!collections[collectionPath]) {
        return null;
      }
      
      return collections[collectionPath].find(doc => doc.id === id) || null;
    };
    
    const updateDocument = (collectionPath: string, id: string, data: any): void => {
      if (!collections[collectionPath]) {
        throw new Error(`Collection ${collectionPath} not found`);
      }
      
      const index = collections[collectionPath].findIndex(doc => doc.id === id);
      
      if (index === -1) {
        throw new Error(`Document with ID ${id} not found in collection ${collectionPath}`);
      }
      
      collections[collectionPath][index] = {
        ...collections[collectionPath][index],
        ...data,
        updatedAt: Timestamp.now()
      };
    };
    
    const deleteDocument = (collectionPath: string, id: string): void => {
      if (!collections[collectionPath]) {
        throw new Error(`Collection ${collectionPath} not found`);
      }
      
      const index = collections[collectionPath].findIndex(doc => doc.id === id);
      
      if (index === -1) {
        throw new Error(`Document with ID ${id} not found in collection ${collectionPath}`);
      }
      
      collections[collectionPath].splice(index, 1);
    };
    
    const queryDocuments = (collectionPath: string, field: string, operator: string, value: any): any[] => {
      if (!collections[collectionPath]) {
        return [];
      }
      
      return collections[collectionPath].filter(doc => {
        switch (operator) {
          case '==':
            return doc[field] === value;
          case '!=':
            return doc[field] !== value;
          case '>':
            return doc[field] > value;
          case '>=':
            return doc[field] >= value;
          case '<':
            return doc[field] < value;
          case '<=':
            return doc[field] <= value;
          case 'array-contains':
            return Array.isArray(doc[field]) && doc[field].includes(value);
          case 'in':
            return Array.isArray(value) && value.includes(doc[field]);
          case 'not-in':
            return Array.isArray(value) && !value.includes(doc[field]);
          default:
            return false;
        }
      });
    };
    
    const reset = (): void => {
      for (const key in collections) {
        delete collections[key];
      }
    };
    
    return {
      collections,
      addDocument,
      getDocument,
      updateDocument,
      deleteDocument,
      queryDocuments,
      reset
    };
  }
  
  /**
   * Create mock Auth
   */
  private createMockAuth(): MockAuth {
    const users: Record<string, User> = {};
    const userCredentials: Record<string, UserCredential> = {};
    let currentUser: User | null = null;
    
    const signIn = async (email: string, password: string): Promise<UserCredential> => {
      const user = Object.values(users).find(u => 
        u.email === email && (u as any).password === password
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      currentUser = user;
      
      const credential = userCredentials[user.uid] || {
        user,
        providerId: 'password',
        operationType: 'signIn'
      } as UserCredential;
      
      return credential;
    };
    
    const signUp = async (email: string, password: string): Promise<UserCredential> => {
      if (Object.values(users).some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const user = {
        uid,
        email,
        emailVerified: false,
        displayName: '',
        photoURL: null,
        phoneNumber: null,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toString(),
          lastSignInTime: new Date().toString()
        },
        providerData: [],
        password
      } as unknown as User;
      
      users[uid] = user;
      currentUser = user;
      
      const credential = {
        user,
        providerId: 'password',
        operationType: 'signUp'
      } as UserCredential;
      
      userCredentials[uid] = credential;
      
      return credential;
    };
    
    const signOutFn = async (): Promise<void> => {
      currentUser = null;
    };
    
    const setCurrentUser = (user: User | null): void => {
      currentUser = user;
    };
    
    const reset = (): void => {
      for (const key in users) {
        delete users[key];
      }
      
      for (const key in userCredentials) {
        delete userCredentials[key];
      }
      
      currentUser = null;
    };
    
    return {
      currentUser,
      users,
      userCredentials,
      signIn,
      signUp,
      signOut: signOutFn,
      setCurrentUser,
      reset
    };
  }
  
  /**
   * Create mock Storage
   */
  private createMockStorage(): MockStorage {
    const files: Record<string, { data: Uint8Array; metadata: any; url: string }> = {};
    
    const upload = async (path: string, data: Uint8Array, metadata?: any): Promise<void> => {
      const url = `https://mock-storage.example.com/${path}`;
      
      files[path] = {
        data,
        metadata: metadata || {},
        url
      };
    };
    
    const getDownloadURL = async (path: string): Promise<string> => {
      if (!files[path]) {
        throw new Error(`File at path ${path} not found`);
      }
      
      return files[path].url;
    };
    
    const deleteFile = async (path: string): Promise<void> => {
      if (!files[path]) {
        throw new Error(`File at path ${path} not found`);
      }
      
      delete files[path];
    };
    
    const reset = (): void => {
      for (const key in files) {
        delete files[key];
      }
    };
    
    return {
      files,
      upload,
      getDownloadURL,
      delete: deleteFile,
      reset
    };
  }
  
  /**
   * Create mock Functions
   */
  private createMockFunctions(): MockFunctions {
    const functions: Record<string, (data: any) => Promise<any>> = {};
    
    const registerFunction = (name: string, fn: (data: any) => Promise<any>): void => {
      functions[name] = fn;
    };
    
    const callFunction = async (name: string, data: any): Promise<any> => {
      if (!functions[name]) {
        throw new Error(`Function ${name} not registered`);
      }
      
      return functions[name](data);
    };
    
    const reset = (): void => {
      for (const key in functions) {
        delete functions[key];
      }
    };
    
    return {
      functions,
      registerFunction,
      callFunction,
      reset
    };
  }
  
  /**
   * Get all registered test suites
   */
  getSuites(): TestSuite[] {
    return [...this.suites];
  }
  
  /**
   * Get a specific test suite by ID
   * @param id Suite ID
   */
  getSuite(id: string): TestSuite | undefined {
    return this.suites.find(suite => suite.id === id);
  }
  
  /**
   * Clear all registered test suites
   */
  clearSuites(): void {
    this.suites = [];
  }
}

// Export singleton instance
export const testingService = new TestingService(); 