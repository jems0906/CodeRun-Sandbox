const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SimpleCodeExecution {
    constructor() {
        this.tempDir = path.join(__dirname, '..', 'temp');
        this.initializeTempDir();
    }

    async initializeTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create temp directory:', error);
        }
    }

    async executeCode(code, language, testCases, timeLimit = 5000) {
        const executionId = uuidv4();
        const startTime = Date.now();

        try {
            let result;
            
            if (language === 'python') {
                result = await this.executePython(code, testCases, timeLimit);
            } else if (language === 'javascript') {
                result = await this.executeJavaScript(code, testCases, timeLimit);
            } else {
                throw new Error(`Unsupported language: ${language}`);
            }

            const executionTime = Date.now() - startTime;
            
            return {
                id: executionId,
                status: 'completed',
                output: result.output,
                error: result.error,
                executionTime,
                testResults: result.testResults,
                success: result.success
            };

        } catch (error) {
            return {
                id: executionId,
                status: 'error',
                output: '',
                error: error.message,
                executionTime: Date.now() - startTime,
                testResults: [],
                success: false
            };
        }
    }

    async executePython(code, testCases, timeLimit) {
        const fileName = `temp_${uuidv4()}.py`;
        const filePath = path.join(this.tempDir, fileName);

        // Create Python wrapper code that runs test cases
        const wrapperCode = `
import json
import sys
import traceback
from io import StringIO

# User code
${code}

# Test execution
def run_tests():
    test_cases = ${JSON.stringify(testCases)}
    results = []
    
    for i, test_case in enumerate(test_cases):
        try:
            # Redirect stdout to capture output
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            # Parse test case
            input_data = test_case.get('input', [])
            expected = test_case.get('expected')
            
            # Execute the solution function
            if hasattr(sys.modules[__name__], 'solution'):
                if isinstance(input_data, list) and len(input_data) > 0:
                    result = solution(*input_data)
                else:
                    result = solution()
            else:
                result = None
                
            # Restore stdout
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            # Check result
            passed = result == expected
            results.append({
                'input': input_data,
                'expected': expected,
                'actual': result,
                'passed': passed,
                'output': output.strip() if output else ''
            })
            
        except Exception as e:
            sys.stdout = old_stdout
            results.append({
                'input': input_data,
                'expected': expected,
                'actual': None,
                'passed': False,
                'error': str(e),
                'output': ''
            })
    
    return results

try:
    test_results = run_tests()
    success = all(result.get('passed', False) for result in test_results)
    
    print(json.dumps({
        'success': success,
        'testResults': test_results,
        'output': '',
        'error': None
    }))
    
except Exception as e:
    print(json.dumps({
        'success': False,
        'testResults': [],
        'output': '',
        'error': traceback.format_exc()
    }))
`;

        try {
            await fs.writeFile(filePath, wrapperCode);
            
            return new Promise((resolve) => {
                const process = spawn('python3', [filePath], {
                    timeout: timeLimit,
                    cwd: this.tempDir
                });

                let output = '';
                let error = '';

                process.stdout.on('data', (data) => {
                    output += data.toString();
                });

                process.stderr.on('data', (data) => {
                    error += data.toString();
                });

                process.on('close', async (code) => {
                    try {
                        await fs.unlink(filePath);
                    } catch (cleanupError) {
                        // Ignore cleanup errors
                    }

                    if (code === 0 && output) {
                        try {
                            const result = JSON.parse(output.trim());
                            resolve(result);
                        } catch (parseError) {
                            resolve({
                                success: false,
                                testResults: [],
                                output: output,
                                error: 'Failed to parse execution result'
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            testResults: [],
                            output: output,
                            error: error || `Process exited with code ${code}`
                        });
                    }
                });

                process.on('error', async (err) => {
                    try {
                        await fs.unlink(filePath);
                    } catch (cleanupError) {
                        // Ignore cleanup errors
                    }
                    
                    resolve({
                        success: false,
                        testResults: [],
                        output: '',
                        error: err.message
                    });
                });

                // Set timeout
                setTimeout(() => {
                    try {
                        process.kill('SIGKILL');
                    } catch (e) {
                        // Ignore kill errors
                    }
                }, timeLimit);
            });

        } catch (error) {
            throw new Error(`Failed to execute Python code: ${error.message}`);
        }
    }

    async executeJavaScript(code, testCases, timeLimit) {
        const fileName = `temp_${uuidv4()}.js`;
        const filePath = path.join(this.tempDir, fileName);

        // Create JavaScript wrapper code that runs test cases
        const wrapperCode = `
// User code
${code}

// Test execution
function runTests() {
    const testCases = ${JSON.stringify(testCases)};
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
        try {
            const testCase = testCases[i];
            const input = testCase.input || [];
            const expected = testCase.expected;
            
            // Execute the solution function
            let result;
            if (typeof solution === 'function') {
                if (Array.isArray(input) && input.length > 0) {
                    result = solution(...input);
                } else {
                    result = solution();
                }
            } else {
                result = null;
            }
            
            // Check result
            const passed = JSON.stringify(result) === JSON.stringify(expected);
            results.push({
                input: input,
                expected: expected,
                actual: result,
                passed: passed,
                output: ''
            });
            
        } catch (error) {
            results.push({
                input: testCase.input || [],
                expected: testCase.expected,
                actual: null,
                passed: false,
                error: error.message,
                output: ''
            });
        }
    }
    
    return results;
}

try {
    const testResults = runTests();
    const success = testResults.every(result => result.passed);
    
    console.log(JSON.stringify({
        success: success,
        testResults: testResults,
        output: '',
        error: null
    }));
    
} catch (error) {
    console.log(JSON.stringify({
        success: false,
        testResults: [],
        output: '',
        error: error.message + '\\n' + error.stack
    }));
}
`;

        try {
            await fs.writeFile(filePath, wrapperCode);
            
            return new Promise((resolve) => {
                const process = spawn('node', [filePath], {
                    timeout: timeLimit,
                    cwd: this.tempDir
                });

                let output = '';
                let error = '';

                process.stdout.on('data', (data) => {
                    output += data.toString();
                });

                process.stderr.on('data', (data) => {
                    error += data.toString();
                });

                process.on('close', async (code) => {
                    try {
                        await fs.unlink(filePath);
                    } catch (cleanupError) {
                        // Ignore cleanup errors
                    }

                    if (code === 0 && output) {
                        try {
                            const result = JSON.parse(output.trim());
                            resolve(result);
                        } catch (parseError) {
                            resolve({
                                success: false,
                                testResults: [],
                                output: output,
                                error: 'Failed to parse execution result'
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            testResults: [],
                            output: output,
                            error: error || `Process exited with code ${code}`
                        });
                    }
                });

                process.on('error', async (err) => {
                    try {
                        await fs.unlink(filePath);
                    } catch (cleanupError) {
                        // Ignore cleanup errors
                    }
                    
                    resolve({
                        success: false,
                        testResults: [],
                        output: '',
                        error: err.message
                    });
                });

                // Set timeout
                setTimeout(() => {
                    process.kill('SIGKILL');
                }, timeLimit);
            });

        } catch (error) {
            throw new Error(`Failed to execute JavaScript code: ${error.message}`);
        }
    }
}

module.exports = SimpleCodeExecution;