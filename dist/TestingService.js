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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testingService = exports.TestingService = exports.ConsoleReporter = exports.TestType = exports.TestStatus = exports.TestEnvironment = void 0;
var firestore_1 = require("firebase/firestore");
var functions_1 = require("firebase/functions");
/**
 * Test environment type
 */
var TestEnvironment;
(function (TestEnvironment) {
    TestEnvironment["LOCAL"] = "local";
    TestEnvironment["EMULATOR"] = "emulator";
    TestEnvironment["TEST"] = "test";
    TestEnvironment["DEVELOPMENT"] = "development";
})(TestEnvironment || (exports.TestEnvironment = TestEnvironment = {}));
/**
 * Test status
 */
var TestStatus;
(function (TestStatus) {
    TestStatus["PENDING"] = "pending";
    TestStatus["RUNNING"] = "running";
    TestStatus["PASSED"] = "passed";
    TestStatus["FAILED"] = "failed";
    TestStatus["SKIPPED"] = "skipped";
    TestStatus["ERROR"] = "error";
})(TestStatus || (exports.TestStatus = TestStatus = {}));
/**
 * Test types
 */
var TestType;
(function (TestType) {
    TestType["UNIT"] = "unit";
    TestType["INTEGRATION"] = "integration";
    TestType["E2E"] = "e2e";
    TestType["PERFORMANCE"] = "performance";
    TestType["SECURITY"] = "security";
})(TestType || (exports.TestType = TestType = {}));
/**
 * Default console reporter
 */
var ConsoleReporter = /** @class */ (function () {
    function ConsoleReporter() {
    }
    ConsoleReporter.prototype.onRunStart = function (suites) {
        var totalTests = suites.reduce(function (sum, suite) { return sum + suite.tests.length; }, 0);
        console.log("Running ".concat(totalTests, " tests from ").concat(suites.length, " suites\n"));
    };
    ConsoleReporter.prototype.onSuiteStart = function (suite) {
        console.log("Suite: ".concat(suite.name, " (").concat(suite.tests.length, " tests)"));
    };
    ConsoleReporter.prototype.onTestStart = function (test) {
        console.log("  Running test: ".concat(test.name));
    };
    ConsoleReporter.prototype.onTestResult = function (test, result) {
        var status = result.status === TestStatus.PASSED ?
            '\x1b[32mPASSED\x1b[0m' :
            result.status === TestStatus.FAILED ?
                '\x1b[31mFAILED\x1b[0m' :
                "\u001B[33m".concat(result.status.toUpperCase(), "\u001B[0m");
        console.log("  ".concat(test.name, ": ").concat(status, " (").concat(result.duration, "ms)"));
        if (result.error) {
            console.error("    Error: ".concat(result.error.message));
            if (result.errorStack) {
                console.error("    Stack: ".concat(result.errorStack));
            }
        }
        if (result.logs && result.logs.length > 0) {
            console.log('    Logs:');
            result.logs.forEach(function (log) { return console.log("      ".concat(log)); });
        }
    };
    ConsoleReporter.prototype.onSuiteComplete = function (suite, results) {
        var passed = results.filter(function (r) { return r.status === TestStatus.PASSED; }).length;
        var failed = results.filter(function (r) { return r.status === TestStatus.FAILED; }).length;
        var skipped = results.filter(function (r) { return r.status === TestStatus.SKIPPED; }).length;
        var errors = results.filter(function (r) { return r.status === TestStatus.ERROR; }).length;
        console.log("  Summary: ".concat(passed, " passed, ").concat(failed, " failed, ").concat(skipped, " skipped, ").concat(errors, " errors\n"));
    };
    ConsoleReporter.prototype.onRunComplete = function (results) {
        var passed = results.filter(function (r) { return r.status === TestStatus.PASSED; }).length;
        var failed = results.filter(function (r) { return r.status === TestStatus.FAILED; }).length;
        var skipped = results.filter(function (r) { return r.status === TestStatus.SKIPPED; }).length;
        var errors = results.filter(function (r) { return r.status === TestStatus.ERROR; }).length;
        var total = results.length;
        var successRate = Math.round((passed / total) * 100);
        console.log("Test Run Complete: ".concat(passed, "/").concat(total, " passed (").concat(successRate, "%)"));
        console.log("".concat(passed, " passed, ").concat(failed, " failed, ").concat(skipped, " skipped, ").concat(errors, " errors"));
        var totalDuration = results.reduce(function (sum, result) { return sum + result.duration; }, 0);
        console.log("Total time: ".concat(totalDuration, "ms"));
    };
    ConsoleReporter.prototype.onLog = function (message, testId, suiteId) {
        if (testId) {
            console.log("[Test ".concat(testId, "] ").concat(message));
        }
        else if (suiteId) {
            console.log("[Suite ".concat(suiteId, "] ").concat(message));
        }
        else {
            console.log(message);
        }
    };
    return ConsoleReporter;
}());
exports.ConsoleReporter = ConsoleReporter;
/**
 * Testing service for Firebase
 */
var TestingService = /** @class */ (function () {
    function TestingService() {
        this.suites = [];
        this.defaultOptions = {
            environment: TestEnvironment.EMULATOR,
            parallel: false,
            timeout: 5000,
            retries: 1,
            reporter: new ConsoleReporter()
        };
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
    TestingService.prototype.registerSuite = function (suite) {
        // Ensure unique ID
        if (this.suites.some(function (s) { return s.id === suite.id; })) {
            throw new Error("Test suite with ID ".concat(suite.id, " already exists"));
        }
        this.suites.push(suite);
    };
    /**
     * Create a test suite
     * @param name Suite name
     * @param options Suite options
     */
    TestingService.prototype.createSuite = function (name, options) {
        if (options === void 0) { options = {}; }
        var id = "suite_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var suite = {
            id: id,
            name: name,
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
    };
    /**
     * Create a test case
     * @param name Test name
     * @param testFn Test function
     * @param options Test options
     */
    TestingService.prototype.createTest = function (name, testFn, options) {
        if (options === void 0) { options = {}; }
        var id = "test_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        return {
            id: id,
            name: name,
            description: options.description,
            type: options.type || TestType.UNIT,
            tags: options.tags || [],
            timeout: options.timeout,
            testFn: testFn
        };
    };
    /**
     * Add a test to a suite
     * @param suiteId Suite ID
     * @param test Test case
     */
    TestingService.prototype.addTestToSuite = function (suiteId, test) {
        var suite = this.suites.find(function (s) { return s.id === suiteId; });
        if (!suite) {
            throw new Error("Suite with ID ".concat(suiteId, " not found"));
        }
        suite.tests.push(test);
    };
    /**
     * Run all tests
     * @param options Test run options
     */
    TestingService.prototype.runTests = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var runOptions, reporter, filteredSuites, allResults, suitePromises, suiteResults, _i, suiteResults_1, results, _a, filteredSuites_1, suite, results;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        runOptions = __assign(__assign({}, this.defaultOptions), options);
                        reporter = runOptions.reporter;
                        filteredSuites = __spreadArray([], this.suites, true);
                        if (runOptions.tags && runOptions.tags.length > 0) {
                            filteredSuites = filteredSuites.filter(function (suite) {
                                return runOptions.tags.some(function (tag) { return suite.tags.includes(tag); });
                            });
                        }
                        // Apply exclude tags if specified
                        if (runOptions.exclude && runOptions.exclude.length > 0) {
                            filteredSuites = filteredSuites.filter(function (suite) {
                                return !runOptions.exclude.some(function (tag) { return suite.tags.includes(tag); });
                            });
                        }
                        if (reporter) {
                            reporter.onRunStart(filteredSuites);
                        }
                        allResults = [];
                        if (!runOptions.parallel) return [3 /*break*/, 2];
                        suitePromises = filteredSuites.map(function (suite) {
                            return _this.runSuite(suite, runOptions);
                        });
                        return [4 /*yield*/, Promise.all(suitePromises)];
                    case 1:
                        suiteResults = _b.sent();
                        for (_i = 0, suiteResults_1 = suiteResults; _i < suiteResults_1.length; _i++) {
                            results = suiteResults_1[_i];
                            allResults.push.apply(allResults, results);
                        }
                        return [3 /*break*/, 6];
                    case 2:
                        _a = 0, filteredSuites_1 = filteredSuites;
                        _b.label = 3;
                    case 3:
                        if (!(_a < filteredSuites_1.length)) return [3 /*break*/, 6];
                        suite = filteredSuites_1[_a];
                        return [4 /*yield*/, this.runSuite(suite, runOptions)];
                    case 4:
                        results = _b.sent();
                        allResults.push.apply(allResults, results);
                        _b.label = 5;
                    case 5:
                        _a++;
                        return [3 /*break*/, 3];
                    case 6:
                        if (reporter) {
                            reporter.onRunComplete(allResults);
                        }
                        return [2 /*return*/, allResults];
                }
            });
        });
    };
    /**
     * Run a specific test suite
     * @param suite Test suite
     * @param options Test run options
     */
    TestingService.prototype.runSuite = function (suite, options) {
        return __awaiter(this, void 0, void 0, function () {
            var reporter, results, suiteContext, error_1, _i, _a, test_1, skipResult, _loop_1, this_1, _b, _c, test_2, error_2, error_3;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        reporter = options.reporter;
                        if (reporter) {
                            reporter.onSuiteStart(suite);
                        }
                        results = [];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 15, , 16]);
                        suiteContext = this.createTestContext(suite.id, '', options);
                        if (!suite.beforeAll) return [3 /*break*/, 5];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, suite.beforeAll(suiteContext)];
                    case 3:
                        _d.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _d.sent();
                        if (reporter) {
                            reporter.onLog("Error in beforeAll hook: ".concat(error_1), '', suite.id);
                        }
                        // If beforeAll fails, mark all tests as skipped
                        for (_i = 0, _a = suite.tests; _i < _a.length; _i++) {
                            test_1 = _a[_i];
                            skipResult = {
                                testId: test_1.id,
                                testName: test_1.name,
                                status: TestStatus.SKIPPED,
                                duration: 0,
                                timestamp: firestore_1.Timestamp.now(),
                                logs: ["Skipped due to beforeAll hook failure: ".concat(error_1)]
                            };
                            results.push(skipResult);
                            if (reporter) {
                                reporter.onTestResult(test_1, skipResult);
                            }
                        }
                        return [2 /*return*/, results];
                    case 5:
                        _loop_1 = function (test_2) {
                            var shouldSkip, testResult;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        shouldSkip = false;
                                        // Filter by tags if specified
                                        if (options.tags && options.tags.length > 0) {
                                            if (!options.tags.some(function (tag) { return test_2.tags.includes(tag); })) {
                                                shouldSkip = true;
                                            }
                                        }
                                        // Apply exclude tags if specified
                                        if (!shouldSkip && options.exclude && options.exclude.length > 0) {
                                            if (options.exclude.some(function (tag) { return test_2.tags.includes(tag); })) {
                                                shouldSkip = true;
                                            }
                                        }
                                        testResult = void 0;
                                        if (!shouldSkip) return [3 /*break*/, 1];
                                        testResult = {
                                            testId: test_2.id,
                                            testName: test_2.name,
                                            status: TestStatus.SKIPPED,
                                            duration: 0,
                                            timestamp: firestore_1.Timestamp.now(),
                                            logs: ['Skipped due to tag filters']
                                        };
                                        return [3 /*break*/, 3];
                                    case 1: return [4 /*yield*/, this_1.runTest(test_2, suite, options)];
                                    case 2:
                                        testResult = _e.sent();
                                        _e.label = 3;
                                    case 3:
                                        results.push(testResult);
                                        if (reporter) {
                                            reporter.onTestResult(test_2, testResult);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _b = 0, _c = suite.tests;
                        _d.label = 6;
                    case 6:
                        if (!(_b < _c.length)) return [3 /*break*/, 9];
                        test_2 = _c[_b];
                        return [5 /*yield**/, _loop_1(test_2)];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        _b++;
                        return [3 /*break*/, 6];
                    case 9:
                        if (!suite.afterAll) return [3 /*break*/, 13];
                        _d.label = 10;
                    case 10:
                        _d.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, suite.afterAll(suiteContext)];
                    case 11:
                        _d.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        error_2 = _d.sent();
                        if (reporter) {
                            reporter.onLog("Error in afterAll hook: ".concat(error_2), '', suite.id);
                        }
                        return [3 /*break*/, 13];
                    case 13: 
                    // Clean up context
                    return [4 /*yield*/, suiteContext.cleanup()];
                    case 14:
                        // Clean up context
                        _d.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        error_3 = _d.sent();
                        if (reporter) {
                            reporter.onLog("Error running suite: ".concat(error_3), '', suite.id);
                        }
                        return [3 /*break*/, 16];
                    case 16:
                        if (reporter) {
                            reporter.onSuiteComplete(suite, results);
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Run a specific test
     * @param test Test case
     * @param suite Parent suite
     * @param options Test run options
     */
    TestingService.prototype.runTest = function (test, suite, options) {
        return __awaiter(this, void 0, void 0, function () {
            var reporter, testContext, startTime, result, timeout, timeoutId, timeoutPromise, error_4, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reporter = options.reporter;
                        if (reporter) {
                            reporter.onTestStart(test);
                        }
                        testContext = this.createTestContext(suite.id, test.id, options);
                        startTime = Date.now();
                        result = {
                            testId: test.id,
                            testName: test.name,
                            status: TestStatus.RUNNING,
                            duration: 0,
                            timestamp: firestore_1.Timestamp.now(),
                            logs: []
                        };
                        timeout = test.timeout || options.timeout || this.defaultOptions.timeout;
                        timeoutPromise = new Promise(function (_, reject) {
                            timeoutId = setTimeout(function () {
                                reject(new Error("Test timed out after ".concat(timeout, "ms")));
                            }, timeout);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 12]);
                        if (!suite.beforeEach) return [3 /*break*/, 3];
                        return [4 /*yield*/, suite.beforeEach(testContext)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: 
                    // Run the test with timeout
                    return [4 /*yield*/, Promise.race([
                            test.testFn(testContext),
                            timeoutPromise
                        ])];
                    case 4:
                        // Run the test with timeout
                        _a.sent();
                        // If we got here, test passed
                        result.status = TestStatus.PASSED;
                        return [3 /*break*/, 12];
                    case 5:
                        error_4 = _a.sent();
                        // Test failed
                        result.status = TestStatus.FAILED;
                        result.error = error_4;
                        result.errorStack = error_4.stack;
                        return [3 /*break*/, 12];
                    case 6:
                        // Clear timeout
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        if (!suite.afterEach) return [3 /*break*/, 10];
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, suite.afterEach(testContext)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        error_5 = _a.sent();
                        testContext.addLog("Error in afterEach hook: ".concat(error_5));
                        return [3 /*break*/, 10];
                    case 10:
                        // Calculate duration
                        result.duration = Date.now() - startTime;
                        // Capture logs
                        result.logs = __spreadArray([], testContext.logs, true);
                        // Clean up context
                        return [4 /*yield*/, testContext.cleanup()];
                    case 11:
                        // Clean up context
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Create a test context
     * @param suiteId Suite ID
     * @param testId Test ID
     * @param options Test options
     */
    TestingService.prototype.createTestContext = function (suiteId, testId, options) {
        var _this = this;
        var logs = [];
        var testData = {};
        var collections = {};
        var documents = {};
        var addLog = function (message) {
            logs.push(message);
            if (options.reporter) {
                options.reporter.onLog(message, testId, suiteId);
            }
        };
        var cleanup = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Reset mocks
                this.mockFirestore.reset();
                this.mockAuth.reset();
                this.mockStorage.reset();
                this.mockFunctions.reset();
                // Log cleanup completion
                addLog('Test context cleaned up');
                return [2 /*return*/];
            });
        }); };
        // Create empty implementations for Firebase services
        // In a real implementation, these would be connected to the Firebase emulator
        // or mocked more thoroughly
        var db = {};
        var auth = {};
        var storage = {};
        var app = {};
        var functions = (0, functions_1.getFunctions)();
        return {
            db: db,
            auth: auth,
            storage: storage,
            app: app,
            functions: functions,
            environment: options.environment || TestEnvironment.EMULATOR,
            testId: testId,
            suiteId: suiteId,
            timestamp: firestore_1.Timestamp.now(),
            params: options.params || {},
            collections: collections,
            documents: documents,
            testData: testData,
            logs: logs,
            addLog: addLog,
            cleanup: cleanup,
            mockFirestore: this.mockFirestore,
            mockAuth: this.mockAuth,
            mockStorage: this.mockStorage,
            mockFunctions: this.mockFunctions
        };
    };
    /**
     * Create mock Firestore
     */
    TestingService.prototype.createMockFirestore = function () {
        var collections = {};
        var addDocument = function (collectionPath, data) {
            if (!collections[collectionPath]) {
                collections[collectionPath] = [];
            }
            var id = "doc_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9));
            collections[collectionPath].push(__assign(__assign({ id: id }, data), { createdAt: firestore_1.Timestamp.now(), updatedAt: firestore_1.Timestamp.now() }));
            return id;
        };
        var getDocument = function (collectionPath, id) {
            if (!collections[collectionPath]) {
                return null;
            }
            return collections[collectionPath].find(function (doc) { return doc.id === id; }) || null;
        };
        var updateDocument = function (collectionPath, id, data) {
            if (!collections[collectionPath]) {
                throw new Error("Collection ".concat(collectionPath, " not found"));
            }
            var index = collections[collectionPath].findIndex(function (doc) { return doc.id === id; });
            if (index === -1) {
                throw new Error("Document with ID ".concat(id, " not found in collection ").concat(collectionPath));
            }
            collections[collectionPath][index] = __assign(__assign(__assign({}, collections[collectionPath][index]), data), { updatedAt: firestore_1.Timestamp.now() });
        };
        var deleteDocument = function (collectionPath, id) {
            if (!collections[collectionPath]) {
                throw new Error("Collection ".concat(collectionPath, " not found"));
            }
            var index = collections[collectionPath].findIndex(function (doc) { return doc.id === id; });
            if (index === -1) {
                throw new Error("Document with ID ".concat(id, " not found in collection ").concat(collectionPath));
            }
            collections[collectionPath].splice(index, 1);
        };
        var queryDocuments = function (collectionPath, field, operator, value) {
            if (!collections[collectionPath]) {
                return [];
            }
            return collections[collectionPath].filter(function (doc) {
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
        var reset = function () {
            for (var key in collections) {
                delete collections[key];
            }
        };
        return {
            collections: collections,
            addDocument: addDocument,
            getDocument: getDocument,
            updateDocument: updateDocument,
            deleteDocument: deleteDocument,
            queryDocuments: queryDocuments,
            reset: reset
        };
    };
    /**
     * Create mock Auth
     */
    TestingService.prototype.createMockAuth = function () {
        var _this = this;
        var users = {};
        var userCredentials = {};
        var currentUser = null;
        var signIn = function (email, password) { return __awaiter(_this, void 0, void 0, function () {
            var user, credential;
            return __generator(this, function (_a) {
                user = Object.values(users).find(function (u) {
                    return u.email === email && u.password === password;
                });
                if (!user) {
                    throw new Error('Invalid email or password');
                }
                currentUser = user;
                credential = userCredentials[user.uid] || {
                    user: user,
                    providerId: 'password',
                    operationType: 'signIn'
                };
                return [2 /*return*/, credential];
            });
        }); };
        var signUp = function (email, password) { return __awaiter(_this, void 0, void 0, function () {
            var uid, user, credential;
            return __generator(this, function (_a) {
                if (Object.values(users).some(function (u) { return u.email === email; })) {
                    throw new Error('Email already in use');
                }
                uid = "user_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9));
                user = {
                    uid: uid,
                    email: email,
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
                    password: password
                };
                users[uid] = user;
                currentUser = user;
                credential = {
                    user: user,
                    providerId: 'password',
                    operationType: 'signUp'
                };
                userCredentials[uid] = credential;
                return [2 /*return*/, credential];
            });
        }); };
        var signOutFn = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                currentUser = null;
                return [2 /*return*/];
            });
        }); };
        var setCurrentUser = function (user) {
            currentUser = user;
        };
        var reset = function () {
            for (var key in users) {
                delete users[key];
            }
            for (var key in userCredentials) {
                delete userCredentials[key];
            }
            currentUser = null;
        };
        return {
            currentUser: currentUser,
            users: users,
            userCredentials: userCredentials,
            signIn: signIn,
            signUp: signUp,
            signOut: signOutFn,
            setCurrentUser: setCurrentUser,
            reset: reset
        };
    };
    /**
     * Create mock Storage
     */
    TestingService.prototype.createMockStorage = function () {
        var _this = this;
        var files = {};
        var upload = function (path, data, metadata) { return __awaiter(_this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = "https://mock-storage.example.com/".concat(path);
                files[path] = {
                    data: data,
                    metadata: metadata || {},
                    url: url
                };
                return [2 /*return*/];
            });
        }); };
        var getDownloadURL = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!files[path]) {
                    throw new Error("File at path ".concat(path, " not found"));
                }
                return [2 /*return*/, files[path].url];
            });
        }); };
        var deleteFile = function (path) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!files[path]) {
                    throw new Error("File at path ".concat(path, " not found"));
                }
                delete files[path];
                return [2 /*return*/];
            });
        }); };
        var reset = function () {
            for (var key in files) {
                delete files[key];
            }
        };
        return {
            files: files,
            upload: upload,
            getDownloadURL: getDownloadURL,
            delete: deleteFile,
            reset: reset
        };
    };
    /**
     * Create mock Functions
     */
    TestingService.prototype.createMockFunctions = function () {
        var _this = this;
        var functions = {};
        var registerFunction = function (name, fn) {
            functions[name] = fn;
        };
        var callFunction = function (name, data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!functions[name]) {
                    throw new Error("Function ".concat(name, " not registered"));
                }
                return [2 /*return*/, functions[name](data)];
            });
        }); };
        var reset = function () {
            for (var key in functions) {
                delete functions[key];
            }
        };
        return {
            functions: functions,
            registerFunction: registerFunction,
            callFunction: callFunction,
            reset: reset
        };
    };
    /**
     * Get all registered test suites
     */
    TestingService.prototype.getSuites = function () {
        return __spreadArray([], this.suites, true);
    };
    /**
     * Get a specific test suite by ID
     * @param id Suite ID
     */
    TestingService.prototype.getSuite = function (id) {
        return this.suites.find(function (suite) { return suite.id === id; });
    };
    /**
     * Clear all registered test suites
     */
    TestingService.prototype.clearSuites = function () {
        this.suites = [];
    };
    return TestingService;
}());
exports.TestingService = TestingService;
// Export singleton instance
exports.testingService = new TestingService();
