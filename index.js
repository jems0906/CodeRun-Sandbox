const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Multiple health check endpoints for Railway compatibility
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Simple root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CodeRun Sandbox API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server immediately - no database dependency
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health endpoints: /health /healthz /ping`);
});

// Start server immediately - no database dependency
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health endpoints: /health /healthz /ping`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => process.exit(0));
});

module.exports = app;