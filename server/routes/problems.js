const express = require('express');
const { body, validationResult } = require('express-validator');
const { allQuery, getQuery } = require('../config/database');

const router = express.Router();

// Get all problems with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, difficulty, category } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        const params = [];
        
        if (difficulty) {
            whereClause += ' WHERE difficulty = ?';
            params.push(difficulty);
        }
        
        if (category) {
            const connector = whereClause ? ' AND' : ' WHERE';
            whereClause += `${connector} category = ?`;
            params.push(category);
        }
        
        // Get problems
        const problems = await allQuery(
            `SELECT id, title, description, difficulty, category, time_complexity, space_complexity, created_at 
             FROM problems${whereClause} 
             ORDER BY id ASC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );
        
        // Get total count for pagination
        const totalResult = await getQuery(
            `SELECT COUNT(*) as total FROM problems${whereClause}`,
            params
        );
        
        res.json({
            problems,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResult.total / limit),
                totalItems: totalResult.total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get problems error:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// Get specific problem with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const problem = await getQuery('SELECT * FROM problems WHERE id = ?', [id]);
        
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        
        // Parse test cases to show only sample cases to user
        const testCases = JSON.parse(problem.test_cases || '[]');
        const sampleCases = testCases.filter(tc => tc.is_sample !== false).slice(0, 3);
        
        // Don't expose solutions
        const sanitizedProblem = {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            category: problem.category,
            function_signature_python: problem.function_signature_python,
            function_signature_javascript: problem.function_signature_javascript,
            sample_test_cases: sampleCases,
            time_complexity: problem.time_complexity,
            space_complexity: problem.space_complexity
        };
        
        res.json(sanitizedProblem);
    } catch (error) {
        console.error('Get problem error:', error);
        res.status(500).json({ error: 'Failed to fetch problem' });
    }
});

// Get problem categories and difficulty distribution
router.get('/meta/stats', async (req, res) => {
    try {
        const categories = await allQuery(
            'SELECT category, COUNT(*) as count FROM problems GROUP BY category ORDER BY count DESC'
        );
        
        const difficulties = await allQuery(
            'SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty'
        );
        
        const total = await getQuery('SELECT COUNT(*) as total FROM problems');
        
        res.json({
            total: total.total,
            categories,
            difficulties
        });
    } catch (error) {
        console.error('Get problem stats error:', error);
        res.status(500).json({ error: 'Failed to fetch problem statistics' });
    }
});

// Search problems
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { limit = 10 } = req.query;
        
        const problems = await allQuery(
            `SELECT id, title, description, difficulty, category 
             FROM problems 
             WHERE title LIKE ? OR description LIKE ? 
             ORDER BY 
                CASE WHEN title LIKE ? THEN 1 ELSE 2 END,
                title ASC 
             LIMIT ?`,
            [`%${query}%`, `%${query}%`, `%${query}%`, parseInt(limit)]
        );
        
        res.json({ problems, query });
    } catch (error) {
        console.error('Search problems error:', error);
        res.status(500).json({ error: 'Failed to search problems' });
    }
});

module.exports = router;