import {
  testingService,
  TestType,
  TestStatus
} from './TestingService';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

// Create a test suite for Firestore operations
const firestoreSuite = testingService.createSuite('Firestore Tests', {
  description: 'Tests for Firebase Firestore operations',
  tags: ['firestore', 'unit'],
  
  // Setup before all tests in this suite
  beforeAll: async (context) => {
    context.addLog('Setting up Firestore test suite');
    
    // Add some test data to the mock Firestore
    const usersCollection = 'users';
    const testUsers = [
      { name: 'John Doe', email: 'john@example.com', age: 30, active: true },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25, active: true },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 40, active: false }
    ];
    
    testUsers.forEach(user => {
      const id = context.mockFirestore.addDocument(usersCollection, user);
      context.addLog(`Added test user with ID: ${id}`);
    });
  },
  
  // Clean up after all tests
  afterAll: async (context) => {
    context.addLog('Cleaning up Firestore test suite');
    context.mockFirestore.reset();
  }
});

// Test document creation
const createDocTest = testingService.createTest(
  'Document Creation',
  async (context) => {
    const collectionName = 'tasks';
    const taskData = {
      title: 'Complete Firestore testing',
      description: 'Implement tests for Firestore operations',
      priority: 'high',
      dueDate: Timestamp.fromDate(new Date()),
      completed: false
    };
    
    // Mock the Firestore implementation
    const originalAddDoc = addDoc;
    (addDoc as any) = async (collectionRef: any, data: any) => {
      const collectionPath = collectionRef.path || collectionName;
      const id = context.mockFirestore.addDocument(collectionPath, data);
      return { id };
    };
    
    try {
      // Create the document
      const docRef = await addDoc(collection({} as any, collectionName), taskData);
      
      // Assertions
      if (!docRef.id) {
        throw new Error('Document ID not returned after creation');
      }
      
      // Check if the document was added to the mock Firestore
      const createdDoc = context.mockFirestore.getDocument(collectionName, docRef.id);
      if (!createdDoc) {
        throw new Error('Document not found in mock Firestore');
      }
      
      // Verify document data
      if (createdDoc.title !== taskData.title) {
        throw new Error(`Expected title ${taskData.title}, got ${createdDoc.title}`);
      }
      
      context.addLog(`Document created successfully with ID: ${docRef.id}`);
    } finally {
      // Restore original implementation
      (addDoc as any) = originalAddDoc;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['firestore', 'create']
  }
);

// Test document retrieval
const getDocTest = testingService.createTest(
  'Document Retrieval',
  async (context) => {
    const collectionName = 'users';
    const userData = {
      name: 'Test User',
      email: 'test.retrieval@example.com',
      age: 35,
      active: true
    };
    
    // Add a document to retrieve
    const docId = context.mockFirestore.addDocument(collectionName, userData);
    
    // Mock the Firestore implementation
    const originalGetDoc = getDoc;
    (getDoc as any) = async (docRef: any) => {
      const id = docRef.id;
      const path = docRef.path || collectionName;
      const collectionPath = path.split('/')[0]; // Get collection name from path
      const document = context.mockFirestore.getDocument(collectionPath, id);
      
      return {
        exists: () => !!document,
        data: () => document,
        id: id
      };
    };
    
    try {
      // Retrieve the document
      const docSnap = await getDoc(doc({} as any, collectionName, docId));
      
      // Assertions
      if (!docSnap.exists()) {
        throw new Error('Document does not exist after creation');
      }
      
      const data = docSnap.data();
      if (data.name !== userData.name) {
        throw new Error(`Expected name ${userData.name}, got ${data.name}`);
      }
      
      if (data.email !== userData.email) {
        throw new Error(`Expected email ${userData.email}, got ${data.email}`);
      }
      
      context.addLog(`Document retrieved successfully with ID: ${docSnap.id}`);
    } finally {
      // Restore original implementation
      (getDoc as any) = originalGetDoc;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['firestore', 'read']
  }
);

// Test document update
const updateDocTest = testingService.createTest(
  'Document Update',
  async (context) => {
    const collectionName = 'users';
    const userData = {
      name: 'Update Test',
      email: 'test.update@example.com',
      age: 28,
      active: true
    };
    
    // Add a document to update
    const docId = context.mockFirestore.addDocument(collectionName, userData);
    
    // Mock the Firestore implementation
    const originalUpdateDoc = updateDoc;
    (updateDoc as any) = async (docRef: any, data: any) => {
      const id = docRef.id;
      const path = docRef.path || collectionName;
      const collectionPath = path.split('/')[0]; // Get collection name from path
      
      context.mockFirestore.updateDocument(collectionPath, id, data);
      return;
    };
    
    try {
      // Update the document
      const updateData = {
        name: 'Updated Name',
        age: 29,
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc({} as any, collectionName, docId), updateData);
      
      // Get the updated document
      const updatedDoc = context.mockFirestore.getDocument(collectionName, docId);
      
      // Assertions
      if (!updatedDoc) {
        throw new Error('Document not found after update');
      }
      
      if (updatedDoc.name !== updateData.name) {
        throw new Error(`Expected name ${updateData.name}, got ${updatedDoc.name}`);
      }
      
      if (updatedDoc.age !== updateData.age) {
        throw new Error(`Expected age ${updateData.age}, got ${updatedDoc.age}`);
      }
      
      // Email should not have changed
      if (updatedDoc.email !== userData.email) {
        throw new Error(`Email should not have changed, but got ${updatedDoc.email}`);
      }
      
      context.addLog(`Document updated successfully with ID: ${docId}`);
    } finally {
      // Restore original implementation
      (updateDoc as any) = originalUpdateDoc;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['firestore', 'update']
  }
);

// Test document deletion
const deleteDocTest = testingService.createTest(
  'Document Deletion',
  async (context) => {
    const collectionName = 'users';
    const userData = {
      name: 'Delete Test',
      email: 'test.delete@example.com'
    };
    
    // Add a document to delete
    const docId = context.mockFirestore.addDocument(collectionName, userData);
    
    // Verify the document exists
    const docBeforeDelete = context.mockFirestore.getDocument(collectionName, docId);
    if (!docBeforeDelete) {
      throw new Error('Test setup failed: Document not found before deletion');
    }
    
    // Mock the Firestore implementation
    const originalDeleteDoc = deleteDoc;
    (deleteDoc as any) = async (docRef: any) => {
      const id = docRef.id;
      const path = docRef.path || collectionName;
      const collectionPath = path.split('/')[0]; // Get collection name from path
      
      context.mockFirestore.deleteDocument(collectionPath, id);
      return;
    };
    
    try {
      // Delete the document
      await deleteDoc(doc({} as any, collectionName, docId));
      
      // Try to get the deleted document
      const docAfterDelete = context.mockFirestore.getDocument(collectionName, docId);
      
      // Assertions
      if (docAfterDelete) {
        throw new Error('Document still exists after deletion');
      }
      
      context.addLog(`Document deleted successfully with ID: ${docId}`);
    } finally {
      // Restore original implementation
      (deleteDoc as any) = originalDeleteDoc;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['firestore', 'delete']
  }
);

// Test collection query
const queryCollectionTest = testingService.createTest(
  'Collection Query',
  async (context) => {
    const collectionName = 'users';
    
    // Mock the Firestore implementation
    const originalGetDocs = getDocs;
    (getDocs as any) = async (queryRef: any) => {
      // Extract the query constraints
      const constraints = queryRef._query?.filters || [];
      const field = constraints[0]?.field || 'active';
      const operator = constraints[0]?.op || '==';
      const value = constraints[0]?.value || true;
      
      // Query the mock Firestore
      const results = context.mockFirestore.queryDocuments(collectionName, field, operator, value);
      
      return {
        docs: results.map(doc => ({
          id: doc.id,
          data: () => doc,
          exists: () => true
        })),
        empty: results.length === 0,
        size: results.length
      };
    };
    
    try {
      // Query for active users
      const q = query(
        collection({} as any, collectionName),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Assertions
      if (querySnapshot.empty) {
        throw new Error('No documents found in query');
      }
      
      // All returned users should be active
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.active) {
          throw new Error(`Found inactive user with ID: ${doc.id}`);
        }
      });
      
      context.addLog(`Query returned ${querySnapshot.size} documents`);
    } finally {
      // Restore original implementation
      (getDocs as any) = originalGetDocs;
    }
  },
  {
    type: TestType.UNIT,
    tags: ['firestore', 'query']
  }
);

// Add all tests to the suite
testingService.addTestToSuite(firestoreSuite.id, createDocTest);
testingService.addTestToSuite(firestoreSuite.id, getDocTest);
testingService.addTestToSuite(firestoreSuite.id, updateDocTest);
testingService.addTestToSuite(firestoreSuite.id, deleteDocTest);
testingService.addTestToSuite(firestoreSuite.id, queryCollectionTest);

// Function to run the tests
export async function runFirestoreTests() {
  console.log('Running Firestore tests...');
  
  const results = await testingService.runTests({
    tags: ['firestore']
  });
  
  // Calculate test success rate
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === TestStatus.PASSED).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Firestore tests completed. Pass rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  return {
    totalTests,
    passedTests,
    successRate,
    results
  };
}

// If this file is executed directly, run the tests
if (require.main === module) {
  runFirestoreTests()
    .then(result => {
      // Exit with appropriate code based on test success
      process.exit(result.successRate === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running Firestore tests:', error);
      process.exit(1);
    });
} 