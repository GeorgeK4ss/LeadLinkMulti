"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.runAllTests = runAllTests;
exports.runIntegrationTests = runIntegrationTests;
var TestingService_1 = require("./TestingService");
var firestore_1 = require("firebase/firestore");
var auth_test_1 = require("./auth.test");
var firestore_test_1 = require("./firestore.test");
// Create a test suite for integration tests
var integrationSuite = TestingService_1.testingService.createSuite('Integration Tests', {
    description: 'Tests that verify integration between Firebase services',
    tags: ['integration'],
    // Setup before all tests
    beforeAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var userCredential;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context.addLog('Setting up integration test suite');
                    return [4 /*yield*/, context.mockAuth.signUp('integration@example.com', 'integration123')];
                case 1:
                    userCredential = _a.sent();
                    context.testData.userId = userCredential.user.uid;
                    context.testData.userEmail = 'integration@example.com';
                    // Add some test data
                    context.mockFirestore.addDocument('profiles', {
                        userId: context.testData.userId,
                        name: 'Integration Test User',
                        email: context.testData.userEmail,
                        createdAt: firestore_1.Timestamp.now()
                    });
                    // Register a mock cloud function
                    context.mockFunctions.registerFunction('createUserProfile', function (data) { return __awaiter(void 0, void 0, void 0, function () {
                        var userId, name, email, profileId;
                        return __generator(this, function (_a) {
                            userId = data.userId, name = data.name, email = data.email;
                            profileId = context.mockFirestore.addDocument('profiles', {
                                userId: userId,
                                name: name,
                                email: email,
                                createdAt: firestore_1.Timestamp.now()
                            });
                            return [2 /*return*/, { success: true, profileId: profileId }];
                        });
                    }); });
                    context.addLog('Integration test setup complete');
                    return [2 /*return*/];
            }
        });
    }); },
    // Cleanup after all tests
    afterAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            context.addLog('Cleaning up integration test suite');
            context.mockAuth.reset();
            context.mockFirestore.reset();
            context.mockFunctions.reset();
            return [2 /*return*/];
        });
    }); }
});
// Test user authentication and profile creation
var authProfileIntegrationTest = TestingService_1.testingService.createTest('User Authentication and Profile Creation', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var email, password, name, userCredential, userId, createProfileFunction, result, profileId, profile;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = 'new.user@example.com';
                password = 'secure123';
                name = 'New Integration User';
                return [4 /*yield*/, context.mockAuth.signUp(email, password)];
            case 1:
                userCredential = _a.sent();
                userId = userCredential.user.uid;
                context.addLog("Created user with ID: ".concat(userId));
                createProfileFunction = function (data) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, context.mockFunctions.callFunction('createUserProfile', data)];
                    });
                }); };
                return [4 /*yield*/, createProfileFunction({
                        userId: userId,
                        name: name,
                        email: email
                    })];
            case 2:
                result = _a.sent();
                // Assertions
                if (!result.success) {
                    throw new Error('Profile creation failed');
                }
                profileId = result.profileId;
                profile = context.mockFirestore.getDocument('profiles', profileId);
                if (!profile) {
                    throw new Error('Profile not found in Firestore');
                }
                if (profile.userId !== userId) {
                    throw new Error("Profile userId mismatch: ".concat(profile.userId, " !== ").concat(userId));
                }
                if (profile.email !== email) {
                    throw new Error("Profile email mismatch: ".concat(profile.email, " !== ").concat(email));
                }
                context.addLog("Successfully created and verified profile with ID: ".concat(profileId));
                return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.INTEGRATION,
    tags: ['integration', 'auth', 'firestore', 'functions']
});
// Test user authentication and data access
var authDataAccessTest = TestingService_1.testingService.createTest('User Authentication and Data Access', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var email, password, userCredential, userId, privateDataId, publicDataId, privateData, publicData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = 'access.test@example.com';
                password = 'access123';
                return [4 /*yield*/, context.mockAuth.signUp(email, password)];
            case 1:
                userCredential = _a.sent();
                userId = userCredential.user.uid;
                privateDataId = context.mockFirestore.addDocument('userPrivateData', {
                    userId: userId,
                    secretKey: 'private-key-123',
                    notes: 'These are private notes',
                    createdAt: firestore_1.Timestamp.now()
                });
                publicDataId = context.mockFirestore.addDocument('userPublicData', {
                    userId: userId,
                    displayName: 'Access Test User',
                    bio: 'This is a public bio',
                    createdAt: firestore_1.Timestamp.now()
                });
                context.addLog("Created test data: private ID ".concat(privateDataId, ", public ID ").concat(publicDataId));
                // Signout and then sign in again to simulate a real authentication flow
                return [4 /*yield*/, context.mockAuth.signOut()];
            case 2:
                // Signout and then sign in again to simulate a real authentication flow
                _a.sent();
                return [4 /*yield*/, context.mockAuth.signIn(email, password)];
            case 3:
                _a.sent();
                // Verify current user is set correctly
                if (!context.mockAuth.currentUser) {
                    throw new Error('User not authenticated after sign in');
                }
                if (context.mockAuth.currentUser.uid !== userId) {
                    throw new Error('Authenticated user ID does not match expected ID');
                }
                privateData = context.mockFirestore.getDocument('userPrivateData', privateDataId);
                publicData = context.mockFirestore.getDocument('userPublicData', publicDataId);
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
                return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.INTEGRATION,
    tags: ['integration', 'auth', 'firestore']
});
// Test data synchronization across services
var dataSyncTest = TestingService_1.testingService.createTest('Data Synchronization Across Services', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var userCredential, userId, updateResult, profileId, eventIds, processResult, _i, _a, result, searchDocs, searchDoc, notifications;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, context.mockAuth.signUp('sync.test@example.com', 'sync123')];
            case 1:
                userCredential = _b.sent();
                userId = userCredential.user.uid;
                // Mock function to update user profile and return events to process
                context.mockFunctions.registerFunction('updateUserProfile', function (data) { return __awaiter(void 0, void 0, void 0, function () {
                    var userId, updates, profiles, profileId_1, eventId, profile, eventId;
                    return __generator(this, function (_a) {
                        userId = data.userId, updates = data.updates;
                        profiles = context.mockFirestore.queryDocuments('profiles', 'userId', '==', userId);
                        if (profiles.length === 0) {
                            profileId_1 = context.mockFirestore.addDocument('profiles', __assign(__assign({ userId: userId }, updates), { createdAt: firestore_1.Timestamp.now(), updatedAt: firestore_1.Timestamp.now() }));
                            eventId = context.mockFirestore.addDocument('events', {
                                type: 'PROFILE_CREATED',
                                userId: userId,
                                profileId: profileId_1,
                                timestamp: firestore_1.Timestamp.now(),
                                processed: false
                            });
                            return [2 /*return*/, { success: true, profileId: profileId_1, eventIds: [eventId] }];
                        }
                        else {
                            profile = profiles[0];
                            context.mockFirestore.updateDocument('profiles', profile.id, __assign(__assign({}, updates), { updatedAt: firestore_1.Timestamp.now() }));
                            eventId = context.mockFirestore.addDocument('events', {
                                type: 'PROFILE_UPDATED',
                                userId: userId,
                                profileId: profile.id,
                                updates: updates,
                                timestamp: firestore_1.Timestamp.now(),
                                processed: false
                            });
                            return [2 /*return*/, { success: true, profileId: profile.id, eventIds: [eventId] }];
                        }
                        return [2 /*return*/];
                    });
                }); });
                // Function to process events (simulating a background worker)
                context.mockFunctions.registerFunction('processEvents', function (data) { return __awaiter(void 0, void 0, void 0, function () {
                    var eventIds, results, _i, eventIds_1, eventId, event_1, profile, searchData, searchDocs_1;
                    return __generator(this, function (_a) {
                        eventIds = data.eventIds;
                        results = [];
                        for (_i = 0, eventIds_1 = eventIds; _i < eventIds_1.length; _i++) {
                            eventId = eventIds_1[_i];
                            event_1 = context.mockFirestore.getDocument('events', eventId);
                            if (!event_1) {
                                results.push({ eventId: eventId, success: false, error: 'Event not found' });
                                continue;
                            }
                            if (event_1.processed) {
                                results.push({ eventId: eventId, success: true, alreadyProcessed: true });
                                continue;
                            }
                            // Process based on event type
                            if (event_1.type === 'PROFILE_CREATED' || event_1.type === 'PROFILE_UPDATED') {
                                profile = context.mockFirestore.getDocument('profiles', event_1.profileId);
                                if (profile) {
                                    searchData = {
                                        userId: profile.userId,
                                        name: profile.name || '',
                                        email: profile.email || '',
                                        bio: profile.bio || '',
                                        updatedAt: firestore_1.Timestamp.now()
                                    };
                                    searchDocs_1 = context.mockFirestore.queryDocuments('userSearch', 'userId', '==', profile.userId);
                                    if (searchDocs_1.length > 0) {
                                        context.mockFirestore.updateDocument('userSearch', searchDocs_1[0].id, searchData);
                                    }
                                    else {
                                        context.mockFirestore.addDocument('userSearch', searchData);
                                    }
                                    // If profile was updated, create notification
                                    if (event_1.type === 'PROFILE_UPDATED') {
                                        context.mockFirestore.addDocument('notifications', {
                                            userId: profile.userId,
                                            type: 'PROFILE_UPDATED',
                                            message: 'Your profile was updated',
                                            read: false,
                                            createdAt: firestore_1.Timestamp.now()
                                        });
                                    }
                                    // Mark event as processed
                                    context.mockFirestore.updateDocument('events', eventId, {
                                        processed: true,
                                        processedAt: firestore_1.Timestamp.now()
                                    });
                                    results.push({ eventId: eventId, success: true });
                                }
                                else {
                                    results.push({ eventId: eventId, success: false, error: 'Profile not found' });
                                }
                            }
                            else {
                                results.push({ eventId: eventId, success: false, error: 'Unknown event type' });
                            }
                        }
                        return [2 /*return*/, { results: results }];
                    });
                }); });
                return [4 /*yield*/, context.mockFunctions.callFunction('updateUserProfile', {
                        userId: userId,
                        updates: {
                            name: 'Sync Test User',
                            email: 'sync.test@example.com',
                            bio: 'Testing data synchronization'
                        }
                    })];
            case 2:
                updateResult = _b.sent();
                // Verify profile was created
                if (!updateResult.success) {
                    throw new Error('Profile update failed');
                }
                profileId = updateResult.profileId;
                eventIds = updateResult.eventIds;
                context.addLog("Profile updated with ID: ".concat(profileId, ", Events: ").concat(eventIds.join(', ')));
                return [4 /*yield*/, context.mockFunctions.callFunction('processEvents', {
                        eventIds: eventIds
                    })];
            case 3:
                processResult = _b.sent();
                // Verify events were processed
                for (_i = 0, _a = processResult.results; _i < _a.length; _i++) {
                    result = _a[_i];
                    if (!result.success) {
                        throw new Error("Event processing failed: ".concat(result.error));
                    }
                }
                searchDocs = context.mockFirestore.queryDocuments('userSearch', 'userId', '==', userId);
                if (searchDocs.length === 0) {
                    throw new Error('Search index not created');
                }
                searchDoc = searchDocs[0];
                if (searchDoc.name !== 'Sync Test User') {
                    throw new Error("Search index name mismatch: ".concat(searchDoc.name));
                }
                notifications = context.mockFirestore.queryDocuments('notifications', 'userId', '==', userId);
                if (notifications.length === 0) {
                    throw new Error('Notifications not created');
                }
                context.addLog('Successfully verified data synchronization across services');
                return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.INTEGRATION,
    tags: ['integration', 'firestore', 'functions', 'sync']
});
// Add tests to the suite
TestingService_1.testingService.addTestToSuite(integrationSuite.id, authProfileIntegrationTest);
TestingService_1.testingService.addTestToSuite(integrationSuite.id, authDataAccessTest);
TestingService_1.testingService.addTestToSuite(integrationSuite.id, dataSyncTest);
// Function to run all tests (unit and integration)
function runAllTests() {
    return __awaiter(this, void 0, void 0, function () {
        var authResults, firestoreResults, integrationResults, totalTests, passedTests, successRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running all tests (unit and integration)...');
                    return [4 /*yield*/, (0, auth_test_1.runAuthTests)()];
                case 1:
                    authResults = _a.sent();
                    return [4 /*yield*/, (0, firestore_test_1.runFirestoreTests)()];
                case 2:
                    firestoreResults = _a.sent();
                    return [4 /*yield*/, TestingService_1.testingService.runTests({
                            tags: ['integration']
                        })];
                case 3:
                    integrationResults = _a.sent();
                    totalTests = authResults.totalTests + firestoreResults.totalTests + integrationResults.length;
                    passedTests = authResults.passedTests + firestoreResults.passedTests +
                        integrationResults.filter(function (r) { return r.status === TestingService_1.TestStatus.PASSED; }).length;
                    successRate = Math.round((passedTests / totalTests) * 100);
                    console.log("All tests completed. Pass rate: ".concat(passedTests, "/").concat(totalTests, " (").concat(successRate, "%)"));
                    return [2 /*return*/, {
                            totalTests: totalTests,
                            passedTests: passedTests,
                            successRate: successRate,
                            authResults: authResults,
                            firestoreResults: firestoreResults,
                            integrationResults: integrationResults
                        }];
            }
        });
    });
}
// Function to run just integration tests
function runIntegrationTests() {
    return __awaiter(this, void 0, void 0, function () {
        var results, totalTests, passedTests, successRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running integration tests...');
                    return [4 /*yield*/, TestingService_1.testingService.runTests({
                            tags: ['integration']
                        })];
                case 1:
                    results = _a.sent();
                    totalTests = results.length;
                    passedTests = results.filter(function (r) { return r.status === TestingService_1.TestStatus.PASSED; }).length;
                    successRate = Math.round((passedTests / totalTests) * 100);
                    console.log("Integration tests completed. Pass rate: ".concat(passedTests, "/").concat(totalTests, " (").concat(successRate, "%)"));
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
    runIntegrationTests()
        .then(function (result) {
        // Exit with appropriate code based on test success
        process.exit(result.successRate === 100 ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Error running integration tests:', error);
        process.exit(1);
    });
}
