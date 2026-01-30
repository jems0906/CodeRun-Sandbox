const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Simplified imports for root deployment
const { initDatabase, getDb } = require('./config-database');
const { executeCode } = require('./simpleCodeExecution');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configuration for production
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.RAILWAY_STATIC_URL, process.env.RAILWAY_PUBLIC_DOMAIN].filter(Boolean)
        : 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Code execution specific rate limiting
const executionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 code executions per minute
    message: 'Too many code execution requests, please try again later.'
});
app.use('/api/execution', executionLimiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/stats', statsRoutes);

// Serve static files (simple HTML frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve simple HTML frontend for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'CodeRun Sandbox API',
        version: '1.0.0',
        description: 'LeetCode-style coding platform with real-time code execution',
        baseUrl: req.protocol + '://' + req.get('host'),
        endpoints: {
            'GET /api/problems': 'Get all coding problems',
            'GET /api/problems/:id': 'Get specific problem details',
            'POST /api/execution/submit': 'Submit code for execution',
            'GET /api/execution/status/:submissionId': 'Get execution status',
            'GET /api/stats/platform': 'Get platform statistics',
            'GET /health': 'Health check'
        },
        features: [
            '6 Algorithm Problems (Arrays, DP, Binary Search, etc.)',
            'Real-time Code Execution (Python & JavaScript)',
            'Submission Tracking & Statistics',
            'Safe Sandboxed Execution'
        ],
        usage: {
            submit: {
                url: '/api/execution/submit',
                method: 'POST',
                body: {
                    problemId: 1,
                    language: 'python',
                    code: 'def solution():\n    return []'
                }
            }
        }
    });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested resource does not exist'
    });
});

// Initialize database, then start server (skip queue for Railway)
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Simple execution mode enabled (no queue)');
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`API docs: http://localhost:${PORT}/api/docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();