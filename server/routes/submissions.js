const express = require('express');
const { allQuery, getQuery } = require('../config/database');

const router = express.Router();

// Get all submissions with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, language, problemId } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        const params = [];
        
        if (status) {
            whereClause += ' WHERE status = ?';
            params.push(status);
        }
        
        if (language) {
            const connector = whereClause ? ' AND' : ' WHERE';
            whereClause += `${connector} language = ?`;
            params.push(language);
        }
        
        if (problemId) {
            const connector = whereClause ? ' AND' : ' WHERE';
            whereClause += `${connector} problem_id = ?`;
            params.push(problemId);
        }
        
        const submissions = await allQuery(
            `SELECT s.id, s.problem_id, s.language, s.status, s.result, 
                    s.runtime_ms, s.memory_kb, s.created_at, s.completed_at,
                    p.title as problem_title, p.difficulty
             FROM submissions s
             JOIN problems p ON s.problem_id = p.id
             ${whereClause}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );
        
        const totalResult = await getQuery(
            `SELECT COUNT(*) as total FROM submissions s${whereClause}`,
            params
        );
        
        res.json({
            submissions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResult.total / limit),
                totalItems: totalResult.total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get specific submission with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const submission = await getQuery(
            `SELECT s.*, p.title as problem_title, p.difficulty, p.category
             FROM submissions s
             JOIN problems p ON s.problem_id = p.id
             WHERE s.id = ?`,
            [id]
        );
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        
        // Parse test results
        let testResults = null;
        if (submission.test_results) {
            try {
                testResults = JSON.parse(submission.test_results);
            } catch (e) {
                console.error('Failed to parse test results:', e);
            }
        }
        
        res.json({
            ...submission,
            test_results: testResults
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

// Get submission statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const totalSubmissions = await getQuery('SELECT COUNT(*) as total FROM submissions');
        const statusStats = await allQuery(
            'SELECT status, COUNT(*) as count FROM submissions GROUP BY status'
        );
        const languageStats = await allQuery(
            'SELECT language, COUNT(*) as count FROM submissions GROUP BY language'
        );
        const recentActivity = await allQuery(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM submissions 
             WHERE created_at >= datetime('now', '-30 days')
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );
        
        // Calculate success rate
        const successfulSubmissions = await getQuery(
            "SELECT COUNT(*) as count FROM submissions WHERE status = 'completed' AND result = 'Accepted'"
        );
        const successRate = totalSubmissions.total > 0 
            ? (successfulSubmissions.count / totalSubmissions.total * 100).toFixed(2)
            : 0;
        
        // Average runtime for successful submissions
        const avgRuntime = await getQuery(
            `SELECT AVG(runtime_ms) as avg_runtime 
             FROM submissions 
             WHERE status = 'completed' AND runtime_ms IS NOT NULL`
        );
        
        res.json({
            totalSubmissions: totalSubmissions.total,
            successRate: parseFloat(successRate),
            averageRuntime: Math.round(avgRuntime.avg_runtime || 0),
            statusDistribution: statusStats,
            languageDistribution: languageStats,
            recentActivity
        });
    } catch (error) {
        console.error('Get submission stats error:', error);
        res.status(500).json({ error: 'Failed to fetch submission statistics' });
    }
});

// Get problem-specific submission stats
router.get('/stats/problem/:problemId', async (req, res) => {
    try {
        const { problemId } = req.params;
        
        const totalSubmissions = await getQuery(
            'SELECT COUNT(*) as total FROM submissions WHERE problem_id = ?',
            [problemId]
        );
        
        const successfulSubmissions = await getQuery(
            `SELECT COUNT(*) as count FROM submissions 
             WHERE problem_id = ? AND status = 'completed' AND result = 'Accepted'`,
            [problemId]
        );
        
        const languageStats = await allQuery(
            'SELECT language, COUNT(*) as count FROM submissions WHERE problem_id = ? GROUP BY language',
            [problemId]
        );
        
        const avgRuntime = await getQuery(
            `SELECT AVG(runtime_ms) as avg_runtime 
             FROM submissions 
             WHERE problem_id = ? AND status = 'completed' AND runtime_ms IS NOT NULL`,
            [problemId]
        );
        
        const successRate = totalSubmissions.total > 0 
            ? (successfulSubmissions.count / totalSubmissions.total * 100).toFixed(2)
            : 0;
        
        res.json({
            problemId: parseInt(problemId),
            totalSubmissions: totalSubmissions.total,
            successfulSubmissions: successfulSubmissions.count,
            successRate: parseFloat(successRate),
            averageRuntime: Math.round(avgRuntime.avg_runtime || 0),
            languageDistribution: languageStats
        });
    } catch (error) {
        console.error('Get problem submission stats error:', error);
        res.status(500).json({ error: 'Failed to fetch problem submission statistics' });
    }
});

module.exports = router;