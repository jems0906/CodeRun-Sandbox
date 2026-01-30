const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getQueue } = require('../config/queue');
const { runQuery, getQuery, allQuery } = require('../config/database');

const router = express.Router();

// Submit code for execution
router.post('/submit', [
    body('problemId').isInt({ min: 1 }).withMessage('Valid problem ID is required'),
    body('language').isIn(['python', 'javascript']).withMessage('Language must be python or javascript'),
    body('code').isLength({ min: 1, max: 50000 }).withMessage('Code must be between 1 and 50000 characters'),
    body('userId').optional().isString().withMessage('User ID must be a string')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }

        const { problemId, language, code, userId } = req.body;

        // Verify problem exists
        const problem = await getQuery('SELECT id FROM problems WHERE id = ?', [problemId]);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Create submission record
        const submissionId = uuidv4();
        await runQuery(
            'INSERT INTO submissions (id, problem_id, language, code, status) VALUES (?, ?, ?, ?, ?)',
            [submissionId, problemId, language, code, 'pending']
        );

        // Add to execution queue
        const queue = getQueue();
        const job = await queue.add('execute', {
            submissionId,
            problemId,
            language,
            code,
            userId
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50
        });

        res.status(201).json({
            submissionId,
            jobId: job.id,
            status: 'pending',
            message: 'Code submitted for execution'
        });

    } catch (error) {
        console.error('Submit code error:', error);
        res.status(500).json({ error: 'Failed to submit code for execution' });
    }
});

// Get execution status and results
router.get('/status/:submissionId', async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await getQuery(
            `SELECT id, problem_id, language, status, result, runtime_ms, memory_kb, 
                    test_results, error_message, created_at, completed_at 
             FROM submissions WHERE id = ?`,
            [submissionId]
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Parse test results if available
        let testResults = null;
        if (submission.test_results) {
            try {
                testResults = JSON.parse(submission.test_results);
            } catch (e) {
                console.error('Failed to parse test results:', e);
            }
        }

        res.json({
            submissionId: submission.id,
            problemId: submission.problem_id,
            language: submission.language,
            status: submission.status,
            result: submission.result,
            runtime: submission.runtime_ms,
            memory: submission.memory_kb,
            testResults,
            errorMessage: submission.error_message,
            submittedAt: submission.created_at,
            completedAt: submission.completed_at
        });

    } catch (error) {
        console.error('Get execution status error:', error);
        res.status(500).json({ error: 'Failed to get execution status' });
    }
});

// Get job status from queue (if using Redis-backed queue)
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const queue = getQueue();

        // Check if this is the mock queue
        if (typeof queue.getJob !== 'function') {
            return res.json({
                jobId,
                progress: 50,
                status: 'processing',
                message: 'Using development queue - check submission status instead'
            });
        }

        const job = await queue.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const progress = await job.progress();
        const state = await job.getState();

        res.json({
            jobId,
            progress,
            status: state,
            processedOn: job.processedOn,
            completedOn: job.finishedOn,
            failedReason: job.failedReason
        });

    } catch (error) {
        console.error('Get job status error:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

module.exports = router;