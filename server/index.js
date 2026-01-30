const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const executionRoutes = require('./routes/executionSimple');
const statsRoutes = require('./routes/stats');

const { initializeDatabase } = require('./config/database');
// Note: Skip queue initialization for Railway deployment
const errorHandler = require('./middleware/errorHandler');

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

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
    app.use(express.static(clientBuildPath));
    
    // Handle React routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path === '/health') {
            return res.status(404).json({ 
                success: false, 
                message: 'The requested resource does not exist' 
            });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'CodeRun Sandbox API',
        version: '1.0.0',
        endpoints: {
            'GET /api/problems': 'Get all problems',
            'GET /api/problems/:id': 'Get specific problem',
            'POST /api/execution/submit': 'Submit code for execution',
            'GET /api/execution/status/:submissionId': 'Get execution status',
            'GET /api/stats/platform': 'Get platform statistics',
            'GET /health': 'Health check'
        },
        frontend: process.env.NODE_ENV === 'production' ? 'Served at /' : 'http://localhost:3000',
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