"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFirestoreTests = runFirestoreTests;
var TestingService_1 = require("./TestingService");
var firestore_1 = require("firebase/firestore");
// Create a test suite for Firestore operations
var firestoreSuite = TestingService_1.testingService.createSuite('Firestore Tests', {
    description: 'Tests for Firebase Firestore operations',
    tags: ['firestore', 'unit'],
    // Setup before all tests in this suite
    beforeAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var usersCollection, testUsers;
        return __generator(this, function (_a) {
            context.addLog('Setting up Firestore test suite');
            usersCollection = 'users';
            testUsers = [
                { name: 'John Doe', email: 'john@example.com', age: 30, active: true },
                { name: 'Jane Smith', email: 'jane@example.com', age: 25, active: true },
                { name: 'Bob Johnson', email: 'bob@example.com', age: 40, active: false }
            ];
            testUsers.forEach(function (user) {
                var id = context.mockFirestore.addDocument(usersCollection, user);
                context.addLog("Added test user with ID: ".concat(id));
            });
            return [2 /*return*/];
        });
    }); },
    // Clean up after all tests
    afterAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            context.addLog('Cleaning up Firestore test suite');
            context.mockFirestore.reset();
            return [2 /*return*/];
        });
    }); }
});
// Test document creation
var createDocTest = TestingService_1.testingService.createTest('Document Creation', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, taskData, originalAddDoc, docRef, createdDoc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                collectionName = 'tasks';
                taskData = {
                    title: 'Complete Firestore testing',
                    description: 'Implement tests for Firestore operations',
                    priority: 'high',
                    dueDate: firestore_1.Timestamp.fromDate(new Date()),
                    completed: false
                };
                originalAddDoc = firestore_1.addDoc;
                firestore_1.addDoc = function (collectionRef, data) { return __awaiter(void 0, void 0, void 0, function () {
                    var collectionPath, id;
                    return __generator(this, function (_a) {
                        collectionPath = collectionRef.path || collectionName;
                        id = context.mockFirestore.addDocument(collectionPath, data);
                        return [2 /*return*/, { id: id }];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)({}, collectionName), taskData)];
            case 2:
                docRef = _a.sent();
                // Assertions
                if (!docRef.id) {
                    throw new Error('Document ID not returned after creation');
                }
                createdDoc = context.mockFirestore.getDocument(collectionName, docRef.id);
                if (!createdDoc) {
                    throw new Error('Document not found in mock Firestore');
                }
                // Verify document data
                if (createdDoc.title !== taskData.title) {
                    throw new Error("Expected title ".concat(taskData.title, ", got ").concat(createdDoc.title));
                }
                context.addLog("Document created successfully with ID: ".concat(docRef.id));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                firestore_1.addDoc = originalAddDoc;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['firestore', 'create']
});
// Test document retrieval
var getDocTest = TestingService_1.testingService.createTest('Document Retrieval', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, userData, docId, originalGetDoc, docSnap, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                collectionName = 'users';
                userData = {
                    name: 'Test User',
                    email: 'test.retrieval@example.com',
                    age: 35,
                    active: true
                };
                docId = context.mockFirestore.addDocument(collectionName, userData);
                originalGetDoc = firestore_1.getDoc;
                firestore_1.getDoc = function (docRef) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, path, collectionPath, document;
                    return __generator(this, function (_a) {
                        id = docRef.id;
                        path = docRef.path || collectionName;
                        collectionPath = path.split('/')[0];
                        document = context.mockFirestore.getDocument(collectionPath, id);
                        return [2 /*return*/, {
                                exists: function () { return !!document; },
                                data: function () { return document; },
                                id: id
                            }];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, (0, firestore_1.getDoc)((0, firestore_1.doc)({}, collectionName, docId))];
            case 2:
                docSnap = _a.sent();
                // Assertions
                if (!docSnap.exists()) {
                    throw new Error('Document does not exist after creation');
                }
                data = docSnap.data();
                if (data.name !== userData.name) {
                    throw new Error("Expected name ".concat(userData.name, ", got ").concat(data.name));
                }
                if (data.email !== userData.email) {
                    throw new Error("Expected email ".concat(userData.email, ", got ").concat(data.email));
                }
                context.addLog("Document retrieved successfully with ID: ".concat(docSnap.id));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                firestore_1.getDoc = originalGetDoc;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['firestore', 'read']
});
// Test document update
var updateDocTest = TestingService_1.testingService.createTest('Document Update', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, userData, docId, originalUpdateDoc, updateData, updatedDoc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                collectionName = 'users';
                userData = {
                    name: 'Update Test',
                    email: 'test.update@example.com',
                    age: 28,
                    active: true
                };
                docId = context.mockFirestore.addDocument(collectionName, userData);
                originalUpdateDoc = firestore_1.updateDoc;
                firestore_1.updateDoc = function (docRef, data) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, path, collectionPath;
                    return __generator(this, function (_a) {
                        id = docRef.id;
                        path = docRef.path || collectionName;
                        collectionPath = path.split('/')[0];
                        context.mockFirestore.updateDocument(collectionPath, id, data);
                        return [2 /*return*/];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                updateData = {
                    name: 'Updated Name',
                    age: 29,
                    lastUpdated: firestore_1.Timestamp.now()
                };
                return [4 /*yield*/, (0, firestore_1.updateDoc)((0, firestore_1.doc)({}, collectionName, docId), updateData)];
            case 2:
                _a.sent();
                updatedDoc = context.mockFirestore.getDocument(collectionName, docId);
                // Assertions
                if (!updatedDoc) {
                    throw new Error('Document not found after update');
                }
                if (updatedDoc.name !== updateData.name) {
                    throw new Error("Expected name ".concat(updateData.name, ", got ").concat(updatedDoc.name));
                }
                if (updatedDoc.age !== updateData.age) {
                    throw new Error("Expected age ".concat(updateData.age, ", got ").concat(updatedDoc.age));
                }
                // Email should not have changed
                if (updatedDoc.email !== userData.email) {
                    throw new Error("Email should not have changed, but got ".concat(updatedDoc.email));
                }
                context.addLog("Document updated successfully with ID: ".concat(docId));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                firestore_1.updateDoc = originalUpdateDoc;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['firestore', 'update']
});
// Test document deletion
var deleteDocTest = TestingService_1.testingService.createTest('Document Deletion', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, userData, docId, docBeforeDelete, originalDeleteDoc, docAfterDelete;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                collectionName = 'users';
                userData = {
                    name: 'Delete Test',
                    email: 'test.delete@example.com'
                };
                docId = context.mockFirestore.addDocument(collectionName, userData);
                docBeforeDelete = context.mockFirestore.getDocument(collectionName, docId);
                if (!docBeforeDelete) {
                    throw new Error('Test setup failed: Document not found before deletion');
                }
                originalDeleteDoc = firestore_1.deleteDoc;
                firestore_1.deleteDoc = function (docRef) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, path, collectionPath;
                    return __generator(this, function (_a) {
                        id = docRef.id;
                        path = docRef.path || collectionName;
                        collectionPath = path.split('/')[0];
                        context.mockFirestore.deleteDocument(collectionPath, id);
                        return [2 /*return*/];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                // Delete the document
                return [4 /*yield*/, (0, firestore_1.deleteDoc)((0, firestore_1.doc)({}, collectionName, docId))];
            case 2:
                // Delete the document
                _a.sent();
                docAfterDelete = context.mockFirestore.getDocument(collectionName, docId);
                // Assertions
                if (docAfterDelete) {
                    throw new Error('Document still exists after deletion');
                }
                context.addLog("Document deleted successfully with ID: ".concat(docId));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                firestore_1.deleteDoc = originalDeleteDoc;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['firestore', 'delete']
});
// Test collection query
var queryCollectionTest = TestingService_1.testingService.createTest('Collection Query', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, originalGetDocs, q, querySnapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                collectionName = 'users';
                originalGetDocs = firestore_1.getDocs;
                firestore_1.getDocs = function (queryRef) { return __awaiter(void 0, void 0, void 0, function () {
                    var constraints, field, operator, value, results;
                    var _a, _b, _c, _d;
                    return __generator(this, function (_e) {
                        constraints = ((_a = queryRef._query) === null || _a === void 0 ? void 0 : _a.filters) || [];
                        field = ((_b = constraints[0]) === null || _b === void 0 ? void 0 : _b.field) || 'active';
                        operator = ((_c = constraints[0]) === null || _c === void 0 ? void 0 : _c.op) || '==';
                        value = ((_d = constraints[0]) === null || _d === void 0 ? void 0 : _d.value) || true;
                        results = context.mockFirestore.queryDocuments(collectionName, field, operator, value);
                        return [2 /*return*/, {
                                docs: results.map(function (doc) { return ({
                                    id: doc.id,
                                    data: function () { return doc; },
                                    exists: function () { return true; }
                                }); }),
                                empty: results.length === 0,
                                size: results.length
                            }];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                q = (0, firestore_1.query)((0, firestore_1.collection)({}, collectionName), (0, firestore_1.where)('active', '==', true));
                return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
            case 2:
                querySnapshot = _a.sent();
                // Assertions
                if (querySnapshot.empty) {
                    throw new Error('No documents found in query');
                }
                // All returned users should be active
                querySnapshot.docs.forEach(function (doc) {
                    var data = doc.data();
                    if (!data.active) {
                        throw new Error("Found inactive user with ID: ".concat(doc.id));
                    }
                });
                context.addLog("Query returned ".concat(querySnapshot.size, " documents"));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                firestore_1.getDocs = originalGetDocs;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['firestore', 'query']
});
// Add all tests to the suite
TestingService_1.testingService.addTestToSuite(firestoreSuite.id, createDocTest);
TestingService_1.testingService.addTestToSuite(firestoreSuite.id, getDocTest);
TestingService_1.testingService.addTestToSuite(firestoreSuite.id, updateDocTest);
TestingService_1.testingService.addTestToSuite(firestoreSuite.id, deleteDocTest);
TestingService_1.testingService.addTestToSuite(firestoreSuite.id, queryCollectionTest);
// Function to run the tests
function runFirestoreTests() {
    return __awaiter(this, void 0, void 0, function () {
        var results, totalTests, passedTests, successRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running Firestore tests...');
                    return [4 /*yield*/, TestingService_1.testingService.runTests({
                            tags: ['firestore']
                        })];
                case 1:
                    results = _a.sent();
                    totalTests = results.length;
                    passedTests = results.filter(function (r) { return r.status === TestingService_1.TestStatus.PASSED; }).length;
                    successRate = Math.round((passedTests / totalTests) * 100);
                    console.log("Firestore tests completed. Pass rate: ".concat(passedTests, "/").concat(totalTests, " (").concat(successRate, "%)"));
                    return [2 /*return*/, {
                            totalTests: totalTests,
                            passedTests: passedTests,
                            successRate: successRate,
                            results: results
                        }];
            }
        });
    });
}
// If this file is executed directly, run the tests
if (require.main === module) {
    runFirestoreTests()
        .then(function (result) {
        // Exit with appropriate code based on test success
        process.exit(result.successRate === 100 ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Error running Firestore tests:', error);
        process.exit(1);
    });
}
