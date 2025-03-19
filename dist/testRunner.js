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
exports.runTests = runTests;
var auth_test_1 = require("./auth.test");
var firestore_test_1 = require("./firestore.test");
var integration_test_1 = require("./integration.test");
var TestingService_1 = require("./TestingService");
var fs = require("fs");
var path = require("path");
/**
 * Run tests with options
 * @param options Test run options
 */
function runTests() {
    return __awaiter(this, arguments, void 0, function (options) {
        var startTime, authResults, firestoreResults, integrationResults, filter, filters, allResults, _i, filters_1, f, totalDuration, summary, failedAuthTests, failedFirestoreTests, failedIntegrationTests, outputDir, format, junitXml;
        var _a, _b, _c;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('Running Firebase tests...');
                    console.log('Options:', JSON.stringify(options, null, 2));
                    startTime = Date.now();
                    filter = options.filter || 'all';
                    filters = Array.isArray(filter) ? filter : [filter];
                    allResults = true;
                    for (_i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                        f = filters_1[_i];
                        if (f !== 'all' && f !== 'auth' && f !== 'firestore' && f !== 'integration') {
                            console.warn("Unknown filter: ".concat(f, ", ignoring..."));
                        }
                    }
                    if (!(filters.includes('all') || filters.includes('auth'))) return [3 /*break*/, 2];
                    console.log('\n=== Running Auth Tests ===');
                    return [4 /*yield*/, (0, auth_test_1.runAuthTests)()];
                case 1:
                    authResults = _d.sent();
                    if (options.verbose) {
                        console.log('Auth Test Results:', JSON.stringify(authResults, null, 2));
                    }
                    if (options.failFast && authResults.successRate < 100) {
                        console.error('Auth tests failed, stopping due to failFast option');
                        allResults = false;
                    }
                    _d.label = 2;
                case 2:
                    if (!(allResults && (filters.includes('all') || filters.includes('firestore')))) return [3 /*break*/, 4];
                    console.log('\n=== Running Firestore Tests ===');
                    return [4 /*yield*/, (0, firestore_test_1.runFirestoreTests)()];
                case 3:
                    firestoreResults = _d.sent();
                    if (options.verbose) {
                        console.log('Firestore Test Results:', JSON.stringify(firestoreResults, null, 2));
                    }
                    if (options.failFast && firestoreResults.successRate < 100) {
                        console.error('Firestore tests failed, stopping due to failFast option');
                        allResults = false;
                    }
                    _d.label = 4;
                case 4:
                    if (!(allResults && (filters.includes('all') || filters.includes('integration')))) return [3 /*break*/, 6];
                    console.log('\n=== Running Integration Tests ===');
                    return [4 /*yield*/, (0, integration_test_1.runIntegrationTests)()];
                case 5:
                    integrationResults = _d.sent();
                    if (options.verbose) {
                        console.log('Integration Test Results:', JSON.stringify(integrationResults, null, 2));
                    }
                    _d.label = 6;
                case 6:
                    totalDuration = Date.now() - startTime;
                    summary = {
                        timestamp: new Date().toISOString(),
                        totalTests: 0,
                        passedTests: 0,
                        failedTests: 0,
                        skippedTests: 0,
                        successRate: 0,
                        duration: totalDuration,
                        details: {
                            auth: {
                                totalTests: (authResults === null || authResults === void 0 ? void 0 : authResults.totalTests) || 0,
                                passedTests: (authResults === null || authResults === void 0 ? void 0 : authResults.passedTests) || 0,
                                failedTests: (authResults === null || authResults === void 0 ? void 0 : authResults.totalTests) ? authResults.totalTests - authResults.passedTests : 0,
                                skippedTests: (authResults === null || authResults === void 0 ? void 0 : authResults.results) ? authResults.results.filter(function (r) { return r.status === TestingService_1.TestStatus.SKIPPED; }).length : 0,
                                successRate: (authResults === null || authResults === void 0 ? void 0 : authResults.successRate) || 0
                            },
                            firestore: {
                                totalTests: (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.totalTests) || 0,
                                passedTests: (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.passedTests) || 0,
                                failedTests: (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.totalTests) ? firestoreResults.totalTests - firestoreResults.passedTests : 0,
                                skippedTests: (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.results) ? firestoreResults.results.filter(function (r) { return r.status === TestingService_1.TestStatus.SKIPPED; }).length : 0,
                                successRate: (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.successRate) || 0
                            },
                            integration: {
                                totalTests: (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.totalTests) || 0,
                                passedTests: (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.passedTests) || 0,
                                failedTests: (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.totalTests) ? integrationResults.totalTests - integrationResults.passedTests : 0,
                                skippedTests: (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.results) ? integrationResults.results.filter(function (r) { return r.status === TestingService_1.TestStatus.SKIPPED; }).length : 0,
                                successRate: (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.successRate) || 0
                            }
                        },
                        failed: []
                    };
                    // Collect failed tests
                    if (authResults === null || authResults === void 0 ? void 0 : authResults.results) {
                        failedAuthTests = authResults.results
                            .filter(function (r) { return r.status === TestingService_1.TestStatus.FAILED; })
                            .map(function (r) {
                            var _a;
                            return ({
                                testName: r.testName,
                                suite: 'Auth',
                                error: (_a = r.error) === null || _a === void 0 ? void 0 : _a.message
                            });
                        });
                        (_a = summary.failed).push.apply(_a, failedAuthTests);
                    }
                    if (firestoreResults === null || firestoreResults === void 0 ? void 0 : firestoreResults.results) {
                        failedFirestoreTests = firestoreResults.results
                            .filter(function (r) { return r.status === TestingService_1.TestStatus.FAILED; })
                            .map(function (r) {
                            var _a;
                            return ({
                                testName: r.testName,
                                suite: 'Firestore',
                                error: (_a = r.error) === null || _a === void 0 ? void 0 : _a.message
                            });
                        });
                        (_b = summary.failed).push.apply(_b, failedFirestoreTests);
                    }
                    if (integrationResults === null || integrationResults === void 0 ? void 0 : integrationResults.results) {
                        failedIntegrationTests = integrationResults.results
                            .filter(function (r) { return r.status === TestingService_1.TestStatus.FAILED; })
                            .map(function (r) {
                            var _a;
                            return ({
                                testName: r.testName,
                                suite: 'Integration',
                                error: (_a = r.error) === null || _a === void 0 ? void 0 : _a.message
                            });
                        });
                        (_c = summary.failed).push.apply(_c, failedIntegrationTests);
                    }
                    // Calculate overall totals
                    summary.totalTests =
                        summary.details.auth.totalTests +
                            summary.details.firestore.totalTests +
                            summary.details.integration.totalTests;
                    summary.passedTests =
                        summary.details.auth.passedTests +
                            summary.details.firestore.passedTests +
                            summary.details.integration.passedTests;
                    summary.failedTests =
                        summary.details.auth.failedTests +
                            summary.details.firestore.failedTests +
                            summary.details.integration.failedTests;
                    summary.skippedTests =
                        summary.details.auth.skippedTests +
                            summary.details.firestore.skippedTests +
                            summary.details.integration.skippedTests;
                    summary.successRate = summary.totalTests > 0 ?
                        Math.round((summary.passedTests / summary.totalTests) * 100) : 0;
                    // Output results
                    console.log('\n=== Test Run Summary ===');
                    console.log("Total Tests: ".concat(summary.totalTests));
                    console.log("Passed: ".concat(summary.passedTests));
                    console.log("Failed: ".concat(summary.failedTests));
                    console.log("Skipped: ".concat(summary.skippedTests));
                    console.log("Success Rate: ".concat(summary.successRate, "%"));
                    console.log("Duration: ".concat(summary.duration, "ms"));
                    if (summary.failed.length > 0) {
                        console.log('\n=== Failed Tests ===');
                        summary.failed.forEach(function (test) {
                            console.log("- ".concat(test.suite, ": ").concat(test.testName));
                            if (test.error) {
                                console.log("  Error: ".concat(test.error));
                            }
                        });
                    }
                    // Save results if output is specified
                    if (options.output) {
                        outputDir = path.dirname(options.output);
                        // Create directory if it doesn't exist
                        if (!fs.existsSync(outputDir)) {
                            fs.mkdirSync(outputDir, { recursive: true });
                        }
                        format = options.format || 'json';
                        switch (format) {
                            case 'json':
                                fs.writeFileSync(options.output, JSON.stringify(summary, null, 2));
                                break;
                            case 'junit':
                                junitXml = generateJUnitXml(summary);
                                fs.writeFileSync(options.output, junitXml);
                                break;
                            default:
                                fs.writeFileSync(options.output, JSON.stringify(summary, null, 2));
                                break;
                        }
                        console.log("Test results saved to ".concat(options.output));
                    }
                    return [2 /*return*/, summary];
            }
        });
    });
}
/**
 * Generate JUnit XML for test results
 * @param summary Test summary
 */
function generateJUnitXml(summary) {
    var timestamp = summary.timestamp.replace(/[-:]/g, '');
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<testsuites name=\"Firebase Tests\" tests=\"".concat(summary.totalTests, "\" failures=\"").concat(summary.failedTests, "\" errors=\"0\" skipped=\"").concat(summary.skippedTests, "\" time=\"").concat(summary.duration / 1000, "\" timestamp=\"").concat(summary.timestamp, "\">\n");
    // Auth test suite
    if (summary.details.auth.totalTests > 0) {
        xml += "  <testsuite name=\"Auth Tests\" tests=\"".concat(summary.details.auth.totalTests, "\" failures=\"").concat(summary.details.auth.failedTests, "\" errors=\"0\" skipped=\"").concat(summary.details.auth.skippedTests, "\" time=\"").concat(summary.duration / 1000, "\">\n");
        var authFailures = summary.failed.filter(function (f) { return f.suite === 'Auth'; });
        var _loop_1 = function (i) {
            var failure = authFailures.find(function (f) { return f.testName === "Test ".concat(i + 1); });
            if (failure) {
                xml += "    <testcase name=\"".concat(failure.testName, "\" classname=\"Auth\" time=\"0\">\n");
                xml += "      <failure message=\"".concat(failure.error || 'Test failed', "\" type=\"AssertionError\">").concat(failure.error || 'Test failed', "</failure>\n");
                xml += '    </testcase>\n';
            }
            else {
                xml += "    <testcase name=\"Test ".concat(i + 1, "\" classname=\"Auth\" time=\"0\" />\n");
            }
        };
        // Add test cases
        for (var i = 0; i < summary.details.auth.totalTests; i++) {
            _loop_1(i);
        }
        xml += '  </testsuite>\n';
    }
    // Firestore test suite
    if (summary.details.firestore.totalTests > 0) {
        xml += "  <testsuite name=\"Firestore Tests\" tests=\"".concat(summary.details.firestore.totalTests, "\" failures=\"").concat(summary.details.firestore.failedTests, "\" errors=\"0\" skipped=\"").concat(summary.details.firestore.skippedTests, "\" time=\"").concat(summary.duration / 1000, "\">\n");
        var firestoreFailures = summary.failed.filter(function (f) { return f.suite === 'Firestore'; });
        var _loop_2 = function (i) {
            var failure = firestoreFailures.find(function (f) { return f.testName === "Test ".concat(i + 1); });
            if (failure) {
                xml += "    <testcase name=\"".concat(failure.testName, "\" classname=\"Firestore\" time=\"0\">\n");
                xml += "      <failure message=\"".concat(failure.error || 'Test failed', "\" type=\"AssertionError\">").concat(failure.error || 'Test failed', "</failure>\n");
                xml += '    </testcase>\n';
            }
            else {
                xml += "    <testcase name=\"Test ".concat(i + 1, "\" classname=\"Firestore\" time=\"0\" />\n");
            }
        };
        // Add test cases
        for (var i = 0; i < summary.details.firestore.totalTests; i++) {
            _loop_2(i);
        }
        xml += '  </testsuite>\n';
    }
    // Integration test suite
    if (summary.details.integration.totalTests > 0) {
        xml += "  <testsuite name=\"Integration Tests\" tests=\"".concat(summary.details.integration.totalTests, "\" failures=\"").concat(summary.details.integration.failedTests, "\" errors=\"0\" skipped=\"").concat(summary.details.integration.skippedTests, "\" time=\"").concat(summary.duration / 1000, "\">\n");
        var integrationFailures = summary.failed.filter(function (f) { return f.suite === 'Integration'; });
        var _loop_3 = function (i) {
            var failure = integrationFailures.find(function (f) { return f.testName === "Test ".concat(i + 1); });
            if (failure) {
                xml += "    <testcase name=\"".concat(failure.testName, "\" classname=\"Integration\" time=\"0\">\n");
                xml += "      <failure message=\"".concat(failure.error || 'Test failed', "\" type=\"AssertionError\">").concat(failure.error || 'Test failed', "</failure>\n");
                xml += '    </testcase>\n';
            }
            else {
                xml += "    <testcase name=\"Test ".concat(i + 1, "\" classname=\"Integration\" time=\"0\" />\n");
            }
        };
        // Add test cases
        for (var i = 0; i < summary.details.integration.totalTests; i++) {
            _loop_3(i);
        }
        xml += '  </testsuite>\n';
    }
    xml += '</testsuites>';
    return xml;
}
// If this file is executed directly, run the tests
if (require.main === module) {
    // Parse command line arguments
    var args = process.argv.slice(2);
    var options = {};
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        switch (arg) {
            case '--filter':
                options.filter = args[++i].split(',');
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--format':
                options.format = args[++i];
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--fail-fast':
                options.failFast = true;
                break;
            case '--help':
                console.log('Usage: node testRunner.js [options]');
                console.log('');
                console.log('Options:');
                console.log('  --filter <filter>   Filter tests to run (auth,firestore,integration,all)');
                console.log('  --output <file>     Output file for test results');
                console.log('  --format <format>   Output format (json,junit,console)');
                console.log('  --verbose           Verbose output');
                console.log('  --fail-fast         Stop on first test failure');
                console.log('  --help              Show this help');
                process.exit(0);
                break;
            default:
                console.warn("Unknown option: ".concat(arg));
                break;
        }
    }
    runTests(options)
        .then(function (summary) {
        // Exit with appropriate code based on test success
        process.exit(summary.failedTests > 0 ? 1 : 0);
    })
        .catch(function (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    });
}
