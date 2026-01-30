const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const executionRoutes = require('./routes/execution');
const statsRoutes = require('./routes/stats');

const { initializeDatabase } = require('./config/database');
const { initializeQueue } = require('./config/queue');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'CodeRun Sandbox API',
        version: '1.0.0',
        endpoints: {
            'GET /api/problems': 'Get all problems',
            'GET /api/problems/:id': 'Get specific problem',
            'POST /api/execution/submit': 'Submit code for execution',
            'GET /api/execution/status/:jobId': 'Get execution status',
            'GET /api/stats/user/:userId': 'Get user statistics',
            'GET /health': 'Health check'
        },
        rateLimit: {
            general: '100 requests per 15 minutes',
            execution: '10 executions per minute'
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

// Initialize database and queue, then start server
async function startServer() {
    try {
        await initializeDatabase();
        await initializeQueue();
        
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