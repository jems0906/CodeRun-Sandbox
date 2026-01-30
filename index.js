const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Health checks - immediate response, no dependencies
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve coding interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// API documentation
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database and execution will be loaded asynchronously
let dbReady = false;
let executeCode, getDb;

// Load database modules asynchronously after server starts
async function initializeAsyncModules() {
  try {
    const { initializeDatabase, getDb: getDatabase } = require('./config-database');
    const { executeCode: execCode } = require('./simpleCodeExecution');
    
    await initializeDatabase();
    getDb = getDatabase;
    executeCode = execCode;
    dbReady = true;
    console.log('✅ Database and execution engine ready');
  } catch (error) {
    console.warn('⚠️ Database initialization failed:', error.message);
    console.log('🔄 Server will work in health-check only mode');
  }
}

// API endpoints with database dependency checks
app.get('/api/problems', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not ready yet, please try again' });
  }
  try {
    const db = getDb();
    const problems = db.prepare('SELECT id, title, description, examples, constraints, starter_code FROM problems ORDER BY difficulty, id').all();
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

app.get('/api/problems/:id', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not ready yet, please try again' });
  }
  try {
    const db = getDb();
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(req.params.id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

app.post('/api/submit', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Code execution not ready yet, please try again' });
  }
  try {
    const { problemId, language, code } = req.body;
    
    if (!problemId || !language || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDb();
    const problem = db.prepare('SELECT test_cases FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const testCases = JSON.parse(problem.test_cases);
    const result = await executeCode(code, language, testCases);
    
    res.json({ 
      submissionId: Date.now().toString(), 
      status: result.status,
      result 
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ 
      error: 'Execution failed',
      details: error.message 
    });
  }
});

// API status endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'CodeRun Sandbox API',
    status: 'running',
    database: dbReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/problems': 'Get all problems',
      'GET /api/problems/:id': 'Get specific problem',
      'POST /api/submit': 'Submit solution',
      'GET /health': 'Health check'
    }
  });
});

// Start server immediately - initialize database afterwards
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CodeRun-Sandbox server running on port ${PORT}`);
  console.log(`🏥 Health endpoints active: /health /healthz /ping`);
  console.log(`📱 Frontend available at: /`);
  
  // Initialize database completely asynchronously - don't block server
  setTimeout(initializeAsyncModules, 100);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => process.exit(0));
});

module.exports = app;