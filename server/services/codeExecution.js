const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getQuery } = require('../config/database');

const docker = new Docker();

// Execution configuration
const EXECUTION_CONFIG = {
    python: {
        image: 'python:3.9-alpine',
        timeout: 10000, // 10 seconds
        memory: '128m',
        cpus: '0.5',
        networkMode: 'none'
    },
    javascript: {
        image: 'node:18-alpine',
        timeout: 10000, // 10 seconds
        memory: '128m',
        cpus: '0.5',
        networkMode: 'none'
    }
};

class CodeExecutionService {
    async executeCode(submissionData) {
        const { submissionId, problemId, language, code } = submissionData;
        
        try {
            // Update submission status to running
            await this.updateSubmissionStatus(submissionId, 'running');

            // Get problem details and test cases
            const problem = await this.getProblem(problemId);
            if (!problem) {
                throw new Error('Problem not found');
            }

            // Parse test cases
            const testCases = JSON.parse(problem.test_cases);
            const results = [];
            let totalRuntime = 0;
            let maxMemory = 0;

            // Execute against each test case
            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                const result = await this.runSingleTest(code, language, testCase, problem);
                results.push(result);
                
                if (result.runtime) {
                    totalRuntime += result.runtime;
                }
                if (result.memory) {
                    maxMemory = Math.max(maxMemory, result.memory);
                }

                // Stop execution if any test fails (for efficiency)
                if (!result.passed) {
                    break;
                }
            }

            // Determine overall status
            const allPassed = results.every(r => r.passed);
            const status = allPassed ? 'completed' : 'failed';
            const averageRuntime = results.length > 0 ? totalRuntime / results.length : 0;

            // Update submission with results
            await this.updateSubmissionResults(submissionId, {
                status,
                runtime_ms: Math.round(averageRuntime),
                memory_kb: maxMemory,
                test_results: JSON.stringify(results),
                result: allPassed ? 'Accepted' : 'Wrong Answer'
            });

            return {
                submissionId,
                status,
                result: allPassed ? 'Accepted' : 'Wrong Answer',
                runtime: Math.round(averageRuntime),
                memory: maxMemory,
                testResults: results
            };

        } catch (error) {
            console.error('Code execution error:', error);
            await this.updateSubmissionResults(submissionId, {
                status: 'failed',
                error_message: error.message,
                result: 'Runtime Error'
            });
            throw error;
        }
    }

    async runSingleTest(code, language, testCase, problem) {
        const startTime = Date.now();
        
        try {
            const config = EXECUTION_CONFIG[language];
            if (!config) {
                throw new Error(`Unsupported language: ${language}`);
            }

            // Prepare code for execution
            const executableCode = this.prepareCode(code, language, testCase, problem);
            
            // Create and run container
            const container = await docker.createContainer({
                Image: config.image,
                Cmd: this.getExecutionCommand(language),
                WorkingDir: '/app',
                HostConfig: {
                    Memory: this.parseMemory(config.memory),
                    CpuQuota: Math.floor(parseFloat(config.cpus) * 100000),
                    CpuPeriod: 100000,
                    NetworkMode: config.networkMode,
                    AutoRemove: true
                },
                AttachStdout: true,
                AttachStderr: true,
                Tty: false
            });

            // Write code to container
            await container.putArchive(this.createCodeArchive(executableCode, language), {
                path: '/app'
            });

            // Start container with timeout
            const stream = await container.attach({
                stdout: true,
                stderr: true,
                stream: true
            });

            await container.start();

            // Collect output with timeout
            const output = await this.collectOutput(stream, config.timeout);
            const stats = await container.stats({ stream: false });
            
            const runtime = Date.now() - startTime;
            const memory = this.extractMemoryUsage(stats);

            // Parse output and check result
            const result = this.parseExecutionResult(output, testCase.expected, language);
            
            return {
                passed: result.passed,
                actual: result.actual,
                expected: testCase.expected,
                input: testCase.input,
                runtime,
                memory,
                error: result.error
            };

        } catch (error) {
            return {
                passed: false,
                actual: null,
                expected: testCase.expected,
                input: testCase.input,
                runtime: Date.now() - startTime,
                memory: 0,
                error: error.message
            };
        }
    }

    prepareCode(userCode, language, testCase, problem) {
        if (language === 'python') {
            const functionName = this.extractFunctionName(problem.function_signature_python);
            return `
import json
import sys

${userCode}

if __name__ == "__main__":
    try:
        input_data = ${JSON.stringify(testCase.input)}
        if isinstance(input_data, list):
            result = ${functionName}(*input_data)
        else:
            result = ${functionName}(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
`;
        } else if (language === 'javascript') {
            const functionName = this.extractFunctionName(problem.function_signature_javascript);
            return `
${userCode}

try {
    const inputData = ${JSON.stringify(testCase.input)};
    let result;
    if (Array.isArray(inputData)) {
        result = ${functionName}(...inputData);
    } else {
        result = ${functionName}(inputData);
    }
    console.log(JSON.stringify(result));
} catch (error) {
    console.error('ERROR: ' + error.message);
    process.exit(1);
}
`;
        }
        throw new Error(`Unsupported language: ${language}`);
    }

    extractFunctionName(signature) {
        if (signature.includes('def ')) {
            // Python: def functionName(params):
            const match = signature.match(/def\s+(\w+)\s*\(/);
            return match ? match[1] : 'solution';
        } else if (signature.includes('function ')) {
            // JavaScript: function functionName(params) {
            const match = signature.match(/function\s+(\w+)\s*\(/);
            return match ? match[1] : 'solution';
        } else if (signature.includes('=>')) {
            // JavaScript: const functionName = (params) => {
            const match = signature.match(/const\s+(\w+)\s*=/);
            return match ? match[1] : 'solution';
        }
        return 'solution';
    }

    getExecutionCommand(language) {
        switch (language) {
            case 'python':
                return ['python', 'code.py'];
            case 'javascript':
                return ['node', 'code.js'];
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }

    createCodeArchive(code, language) {
        const tar = require('tar-stream');
        const pack = tar.pack();
        
        const filename = language === 'python' ? 'code.py' : 'code.js';
        pack.entry({ name: filename }, code);
        pack.finalize();
        
        return pack;
    }

    async collectOutput(stream, timeout) {
        return new Promise((resolve, reject) => {
            let output = '';
            let error = '';
            
            const timer = setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, timeout);

            stream.on('data', (chunk) => {
                const data = chunk.toString();
                if (data.includes('ERROR:')) {
                    error += data;
                } else {
                    output += data;
                }
            });

            stream.on('end', () => {
                clearTimeout(timer);
                resolve({ output: output.trim(), error: error.trim() });
            });

            stream.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }

    parseExecutionResult(output, expected, language) {
        try {
            if (output.error) {
                return { passed: false, actual: null, error: output.error };
            }

            const actual = JSON.parse(output.output);
            const passed = JSON.stringify(actual) === JSON.stringify(expected);
            
            return { passed, actual, error: null };
        } catch (error) {
            return { passed: false, actual: output.output, error: 'Failed to parse output' };
        }
    }

    parseMemory(memoryStr) {
        const value = parseInt(memoryStr);
        if (memoryStr.includes('m') || memoryStr.includes('M')) {
            return value * 1024 * 1024; // MB to bytes
        }
        return value;
    }

    extractMemoryUsage(stats) {
        try {
            return Math.round((stats.memory_stats.usage || 0) / 1024); // Convert to KB
        } catch {
            return 0;
        }
    }

    async getProblem(problemId) {
        return await getQuery('SELECT * FROM problems WHERE id = ?', [problemId]);
    }

    async updateSubmissionStatus(submissionId, status) {
        await runQuery(
            'UPDATE submissions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, submissionId]
        );
    }

    async updateSubmissionResults(submissionId, results) {
        const updates = [];
        const values = [];
        
        Object.entries(results).forEach(([key, value]) => {
            updates.push(`${key} = ?`);
            values.push(value);
        });
        
        updates.push('completed_at = CURRENT_TIMESTAMP');
        values.push(submissionId);
        
        await runQuery(
            `UPDATE submissions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
    }
}

// Process function for Bull queue
async function processExecution(job) {
    const executor = new CodeExecutionService();
    try {
        job.progress(10);
        const result = await executor.executeCode(job.data);
        job.progress(100);
        return result;
    } catch (error) {
        console.error('Execution job failed:', error);
        throw error;
    }
}

module.exports = {
    CodeExecutionService,
    processExecution
};