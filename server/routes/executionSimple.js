const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const CodeExecutionService = require('../services/codeExecutionSimple');
const { run, get, query } = require('../config/database');

const router = express.Router();
const codeExecutionService = new CodeExecutionService();

// Submit code for execution
router.post('/submit', [
    body('problemId').isInt({ min: 1 }),
    body('language').isIn(['python', 'javascript']),
    body('code').isLength({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { problemId, language, code } = req.body;
        const submissionId = uuidv4();

        // Create submission record
        await run(
            `INSERT INTO submissions (id, problem_id, code, language, status, created_at) 
             VALUES (?, ?, ?, ?, 'queued', datetime('now'))`,
            [submissionId, problemId, code, language]
        );

        // Execute code directly (no queue for Railway)
        const submissionData = {
            submissionId,
            problemId,
            language,
            code
        };

        // Start execution (async)
        codeExecutionService.executeCode(submissionData).catch(error => {
            console.error('Background execution error:', error);
        });

        res.json({
            success: true,
            submissionId,
            message: 'Code submitted for execution'
        });

    } catch (error) {
        console.error('Submit code error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get execution status
router.get('/status/:submissionId', async (req, res) => {
    try {
        const { submissionId } = req.params;
        
        const submission = await get(
            `SELECT id, status, test_results, execution_time, created_at 
             FROM submissions WHERE id = ?`,
            [submissionId]
        );

        if (!submission) {
            return res.status(404).json({ 
                success: false, 
                message: 'Submission not found' 
            });
        }

        let testResults = [];
        try {
            if (submission.test_results) {
                testResults = JSON.parse(submission.test_results);
            }
        } catch (e) {
            console.error('Failed to parse test results:', e);
        }

        res.json({
            success: true,
            data: {
                id: submission.id,
                status: submission.status,
                testResults,
                executionTime: submission.execution_time,
                createdAt: submission.created_at
            }
        });

    } catch (error) {
        console.error('Get execution status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

module.exports = router;