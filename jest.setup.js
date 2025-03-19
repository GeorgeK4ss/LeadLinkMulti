// Import Jest DOM extensions
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('@/lib/firebase', () => {
  return {
    db: {
      collection: jest.fn(),
      doc: jest.fn(),
    },
    auth: {
      onAuthStateChanged: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      ref: jest.fn(),
    },
  };
});

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    Timestamp: {
      now: jest.fn(),
      fromDate: jest.fn(),
    },
    arrayUnion: jest.fn(),
    increment: jest.fn(),
    writeBatch: jest.fn(),
  };
});

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  };
});

// Mock Firebase Storage functions
jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn(),
  };
});

// Add more global test setup as needed 