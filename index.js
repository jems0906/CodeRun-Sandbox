const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, getDb } = require('./config-database');
const { executeCode } = require('./simpleCodeExecution');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize database
initDatabase();

// Get all problems
app.get('/api/problems', async (req, res) => {
  try {
    const db = getDb();
    const problems = db.prepare('SELECT id, title, description, examples, constraints, starter_code FROM problems ORDER BY difficulty, id').all();
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// Get specific problem
app.get('/api/problems/:id', async (req, res) => {
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

// Submit solution
app.post('/api/submit', async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    
    if (!problemId || !language || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get problem test cases
    const db = getDb();
    const problem = db.prepare('SELECT test_cases FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const testCases = JSON.parse(problem.test_cases);
    
    // Execute code
    const result = await executeCode(code, language, testCases);
    
    // Store submission
    const submissionId = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO submissions (id, problem_id, language, code, status, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(submissionId, problemId, language, code, result.status, JSON.stringify(result), now);

    res.json({ 
      submissionId, 
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

// Get submission
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const db = getDb();
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    submission.result = JSON.parse(submission.result);
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CodeRun-Sandbox API Server running on port ${PORT}`);
  console.log(`📊 API Documentation available at /`);
  console.log(`💻 Environment: ${process.env.NODE_ENV || 'production'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;