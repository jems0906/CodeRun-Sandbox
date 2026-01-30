const express = require('express');
const { allQuery, getQuery } = require('../config/database');

const router = express.Router();

// Get overall platform statistics
router.get('/platform', async (req, res) => {
    try {
        // Basic counts
        const totalProblems = await getQuery('SELECT COUNT(*) as total FROM problems');
        const totalSubmissions = await getQuery('SELECT COUNT(*) as total FROM submissions');
        
        // Problem difficulty distribution
        const difficultyStats = await allQuery(
            'SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty'
        );
        
        // Problem category distribution
        const categoryStats = await allQuery(
            'SELECT category, COUNT(*) as count FROM problems GROUP BY category ORDER BY count DESC LIMIT 10'
        );
        
        // Language popularity
        const languageStats = await allQuery(
            'SELECT language, COUNT(*) as submissions FROM submissions GROUP BY language'
        );
        
        // Success rate by language
        const languageSuccessRate = await allQuery(
            `SELECT 
                language,
                COUNT(*) as total_submissions,
                SUM(CASE WHEN status = 'completed' AND result = 'Accepted' THEN 1 ELSE 0 END) as successful_submissions,
                ROUND(
                    (SUM(CASE WHEN status = 'completed' AND result = 'Accepted' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
                    2
                ) as success_rate
             FROM submissions 
             GROUP BY language`
        );
        
        // Recent activity (last 7 days)
        const recentActivity = await allQuery(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as submissions
             FROM submissions 
             WHERE created_at >= datetime('now', '-7 days')
             GROUP BY DATE(created_at)
             ORDER BY date ASC`
        );
        
        // Performance statistics
        const performanceStats = await getQuery(
            `SELECT 
                COUNT(*) as total_completed,
                AVG(runtime_ms) as avg_runtime,
                MIN(runtime_ms) as min_runtime,
                MAX(runtime_ms) as max_runtime,
                AVG(memory_kb) as avg_memory
             FROM submissions 
             WHERE status = 'completed' AND runtime_ms IS NOT NULL`
        );
        
        res.json({
            overview: {
                totalProblems: totalProblems.total,
                totalSubmissions: totalSubmissions.total,
                averageRuntime: Math.round(performanceStats.avg_runtime || 0),
                averageMemory: Math.round(performanceStats.avg_memory || 0)
            },
            problems: {
                byDifficulty: difficultyStats,
                byCategory: categoryStats
            },
            submissions: {
                byLanguage: languageStats,
                successRateByLanguage: languageSuccessRate,
                recentActivity
            },
            performance: {
                totalCompleted: performanceStats.total_completed,
                runtime: {
                    average: Math.round(performanceStats.avg_runtime || 0),
                    minimum: performanceStats.min_runtime || 0,
                    maximum: performanceStats.max_runtime || 0
                },
                memory: {
                    average: Math.round(performanceStats.avg_memory || 0)
                }
            }
        });
    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({ error: 'Failed to fetch platform statistics' });
    }
});

// Get user statistics
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // User submission summary
        const totalSubmissions = await getQuery(
            'SELECT COUNT(*) as total FROM submissions WHERE user_id = ?',
            [userId]
        );
        
        const successfulSubmissions = await getQuery(
            `SELECT COUNT(*) as count FROM submissions 
             WHERE user_id = ? AND status = 'completed' AND result = 'Accepted'`,
            [userId]
        );
        
        // Problems solved (unique)
        const problemsSolved = await getQuery(
            `SELECT COUNT(DISTINCT problem_id) as count FROM submissions 
             WHERE user_id = ? AND status = 'completed' AND result = 'Accepted'`,
            [userId]
        );
        
        // Language preferences
        const languageStats = await allQuery(
            'SELECT language, COUNT(*) as count FROM submissions WHERE user_id = ? GROUP BY language',
            [userId]
        );
        
        // Recent submissions
        const recentSubmissions = await allQuery(
            `SELECT s.id, s.problem_id, s.language, s.status, s.result, 
                    s.runtime_ms, s.created_at, p.title, p.difficulty
             FROM submissions s
             JOIN problems p ON s.problem_id = p.id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC
             LIMIT 10`,
            [userId]
        );
        
        // Performance metrics
        const performanceStats = await getQuery(
            `SELECT 
                AVG(runtime_ms) as avg_runtime,
                MIN(runtime_ms) as best_runtime,
                AVG(memory_kb) as avg_memory
             FROM submissions 
             WHERE user_id = ? AND status = 'completed' AND runtime_ms IS NOT NULL`,
            [userId]
        );
        
        // Difficulty breakdown
        const difficultyStats = await allQuery(
            `SELECT p.difficulty, COUNT(*) as attempted, 
                    SUM(CASE WHEN s.status = 'completed' AND s.result = 'Accepted' THEN 1 ELSE 0 END) as solved
             FROM submissions s
             JOIN problems p ON s.problem_id = p.id
             WHERE s.user_id = ?
             GROUP BY p.difficulty`,
            [userId]
        );
        
        const successRate = totalSubmissions.total > 0 
            ? (successfulSubmissions.count / totalSubmissions.total * 100).toFixed(2)
            : 0;
        
        res.json({
            userId,
            summary: {
                totalSubmissions: totalSubmissions.total,
                successfulSubmissions: successfulSubmissions.count,
                problemsSolved: problemsSolved.count,
                successRate: parseFloat(successRate)
            },
            performance: {
                averageRuntime: Math.round(performanceStats.avg_runtime || 0),
                bestRuntime: performanceStats.best_runtime || 0,
                averageMemory: Math.round(performanceStats.avg_memory || 0)
            },
            preferences: {
                languages: languageStats
            },
            progress: {
                byDifficulty: difficultyStats
            },
            recentActivity: recentSubmissions
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const leaderboard = await allQuery(
            `SELECT 
                user_id,
                COUNT(DISTINCT problem_id) as problems_solved,
                COUNT(*) as total_submissions,
                ROUND(
                    (SUM(CASE WHEN status = 'completed' AND result = 'Accepted' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
                    2
                ) as success_rate,
                AVG(CASE WHEN status = 'completed' AND runtime_ms IS NOT NULL THEN runtime_ms END) as avg_runtime
             FROM submissions 
             WHERE user_id IS NOT NULL
             GROUP BY user_id
             HAVING problems_solved > 0
             ORDER BY problems_solved DESC, success_rate DESC, avg_runtime ASC
             LIMIT ?`,
            [parseInt(limit)]
        );
        
        res.json({
            leaderboard: leaderboard.map((entry, index) => ({
                rank: index + 1,
                userId: entry.user_id,
                problemsSolved: entry.problems_solved,
                totalSubmissions: entry.total_submissions,
                successRate: parseFloat(entry.success_rate || 0),
                averageRuntime: Math.round(entry.avg_runtime || 0)
            }))
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;