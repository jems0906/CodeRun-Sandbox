const SimpleCodeExecution = require('./simpleCodeExecution');
const { getDatabase, run, get } = require('../config/database');

class CodeExecutionService {
    constructor() {
        // Use simple execution for Railway deployment
        this.executor = new SimpleCodeExecution();
    }

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
            
            // Execute code with test cases
            const result = await this.executor.executeCode(code, language, testCases);
            
            // Update submission in database
            await this.updateSubmissionResult(submissionId, result);
            
            return result;
            
        } catch (error) {
            console.error('Execution job failed:', error);
            
            const errorResult = {
                id: submissionId,
                status: 'error',
                output: '',
                error: error.message,
                executionTime: 0,
                testResults: [],
                success: false
            };
            
            await this.updateSubmissionResult(submissionId, errorResult);
            return errorResult;
        }
    }

    async getProblem(problemId) {
        try {
            return await get(
                'SELECT * FROM problems WHERE id = ?',
                [problemId]
            );
        } catch (error) {
            console.error('Failed to get problem:', error);
            return null;
        }
    }

    async updateSubmissionStatus(submissionId, status) {
        try {
            await run(
                'UPDATE submissions SET status = ? WHERE id = ?',
                [status, submissionId]
            );
        } catch (error) {
            console.error('Failed to update submission status:', error);
        }
    }

    async updateSubmissionResult(submissionId, result) {
        try {
            const status = result.success ? 'accepted' : (result.error ? 'error' : 'wrong_answer');
            
            await run(
                `UPDATE submissions 
                 SET status = ?, test_results = ?, execution_time = ?
                 WHERE id = ?`,
                [status, JSON.stringify(result.testResults), result.executionTime, submissionId]
            );
        } catch (error) {
            console.error('Failed to update submission result:', error);
        }
    }
}

module.exports = CodeExecutionService;