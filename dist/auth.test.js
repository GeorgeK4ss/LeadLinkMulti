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
exports.runAuthTests = runAuthTests;
var TestingService_1 = require("./TestingService");
var auth_1 = require("firebase/auth");
// Create a test suite for authentication
var authSuite = TestingService_1.testingService.createSuite('Authentication Tests', {
    description: 'Tests for Firebase authentication functionality',
    tags: ['auth', 'unit'],
    // Setup before all tests in this suite
    beforeAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context.addLog('Setting up authentication suite');
                    // Register a test user that all tests can use
                    return [4 /*yield*/, context.mockAuth.signUp('test@example.com', 'password123')];
                case 1:
                    // Register a test user that all tests can use
                    _a.sent();
                    context.addLog('Test user registered');
                    // Clear current user before starting tests
                    context.mockAuth.setCurrentUser(null);
                    return [2 /*return*/];
            }
        });
    }); },
    // Clean up after all tests
    afterAll: function (context) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            context.addLog('Cleaning up authentication suite');
            context.mockAuth.reset();
            return [2 /*return*/];
        });
    }); }
});
// Test user registration
var registerTest = TestingService_1.testingService.createTest('User Registration', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var email, password, originalSignUp, userCredential, storedUser;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = 'newuser@example.com';
                password = 'securePassword123';
                originalSignUp = auth_1.createUserWithEmailAndPassword;
                auth_1.createUserWithEmailAndPassword = function (auth, email, password) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, context.mockAuth.signUp(email, password)];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, (0, auth_1.createUserWithEmailAndPassword)((0, auth_1.getAuth)(), email, password)];
            case 2:
                userCredential = _a.sent();
                // Assertions
                if (!userCredential.user) {
                    throw new Error('User is null after registration');
                }
                if (userCredential.user.email !== email) {
                    throw new Error("Expected email ".concat(email, ", got ").concat(userCredential.user.email));
                }
                storedUser = context.mockAuth.users[userCredential.user.uid];
                if (!storedUser) {
                    throw new Error('User not stored in mock auth store');
                }
                context.addLog("User registered successfully with UID: ".concat(userCredential.user.uid));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                auth_1.createUserWithEmailAndPassword = originalSignUp;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['auth', 'registration']
});
// Test user login
var loginTest = TestingService_1.testingService.createTest('User Login', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var email, password, originalSignIn, userCredential;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                email = 'test@example.com';
                password = 'password123';
                originalSignIn = auth_1.signInWithEmailAndPassword;
                auth_1.signInWithEmailAndPassword = function (auth, email, password) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, context.mockAuth.signIn(email, password)];
                    });
                }); };
                _b.label = 1;
            case 1:
                _b.trys.push([1, , 3, 4]);
                return [4 /*yield*/, (0, auth_1.signInWithEmailAndPassword)((0, auth_1.getAuth)(), email, password)];
            case 2:
                userCredential = _b.sent();
                // Assertions
                if (!userCredential.user) {
                    throw new Error('User is null after login');
                }
                if (userCredential.user.email !== email) {
                    throw new Error("Expected email ".concat(email, ", got ").concat(userCredential.user.email));
                }
                // Verify the current user is set
                if (((_a = context.mockAuth.currentUser) === null || _a === void 0 ? void 0 : _a.uid) !== userCredential.user.uid) {
                    throw new Error('Current user not updated after login');
                }
                context.addLog("User logged in successfully with UID: ".concat(userCredential.user.uid));
                return [3 /*break*/, 4];
            case 3:
                // Restore original implementation
                auth_1.signInWithEmailAndPassword = originalSignIn;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['auth', 'login']
});
// Test user logout
var logoutTest = TestingService_1.testingService.createTest('User Logout', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var originalSignOut;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // First need to log in a user
            return [4 /*yield*/, context.mockAuth.signIn('test@example.com', 'password123')];
            case 1:
                // First need to log in a user
                _a.sent();
                if (!context.mockAuth.currentUser) {
                    throw new Error('Failed to set up test: User not logged in');
                }
                originalSignOut = auth_1.signOut;
                auth_1.signOut = function (auth) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, context.mockAuth.signOut()];
                    });
                }); };
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                // Perform logout
                return [4 /*yield*/, (0, auth_1.signOut)((0, auth_1.getAuth)())];
            case 3:
                // Perform logout
                _a.sent();
                // Assertion: current user should be null after signOut
                if (context.mockAuth.currentUser !== null) {
                    throw new Error('Current user not cleared after logout');
                }
                context.addLog('User logged out successfully');
                return [3 /*break*/, 5];
            case 4:
                // Restore original implementation
                auth_1.signOut = originalSignOut;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['auth', 'logout']
});
// Test login failure with wrong password
var loginFailureTest = TestingService_1.testingService.createTest('Login Failure with Wrong Password', function (context) { return __awaiter(void 0, void 0, void 0, function () {
    var email, wrongPassword, originalSignIn, errorThrown, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = 'test@example.com';
                wrongPassword = 'wrongPassword';
                originalSignIn = auth_1.signInWithEmailAndPassword;
                auth_1.signInWithEmailAndPassword = function (auth, email, password) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, context.mockAuth.signIn(email, password)];
                    });
                }); };
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 6, 7]);
                errorThrown = false;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, (0, auth_1.signInWithEmailAndPassword)((0, auth_1.getAuth)(), email, wrongPassword)];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                errorThrown = true;
                context.addLog("Login correctly failed: ".concat(error_1));
                return [3 /*break*/, 5];
            case 5:
                if (!errorThrown) {
                    throw new Error('Login with wrong password did not throw an error');
                }
                // Verify current user is still null
                if (context.mockAuth.currentUser !== null) {
                    throw new Error('Current user was set despite login failure');
                }
                return [3 /*break*/, 7];
            case 6:
                // Restore original implementation
                auth_1.signInWithEmailAndPassword = originalSignIn;
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); }, {
    type: TestingService_1.TestType.UNIT,
    tags: ['auth', 'login', 'error-handling']
});
// Add all tests to the suite
TestingService_1.testingService.addTestToSuite(authSuite.id, registerTest);
TestingService_1.testingService.addTestToSuite(authSuite.id, loginTest);
TestingService_1.testingService.addTestToSuite(authSuite.id, logoutTest);
TestingService_1.testingService.addTestToSuite(authSuite.id, loginFailureTest);
// Function to run the tests
function runAuthTests() {
    return __awaiter(this, void 0, void 0, function () {
        var results, totalTests, passedTests, successRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running authentication tests...');
                    return [4 /*yield*/, TestingService_1.testingService.runTests({
                            tags: ['auth']
                        })];
                case 1:
                    results = _a.sent();
                    totalTests = results.length;
                    passedTests = results.filter(function (r) { return r.status === TestingService_1.TestStatus.PASSED; }).length;
                    successRate = Math.round((passedTests / totalTests) * 100);
                    console.log("Auth tests completed. Pass rate: ".concat(passedTests, "/").concat(totalTests, " (").concat(successRate, "%)"));
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
    runAuthTests()
        .then(function (result) {
        // Exit with appropriate code based on test success
        process.exit(result.successRate === 100 ? 0 : 1);
    })
        .catch(function (error) {
        console.error('Error running auth tests:', error);
        process.exit(1);
    });
}
