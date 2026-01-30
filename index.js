const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`Starting server on port ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health endpoints - immediate response
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ status: 'healthy', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  console.log('Healthz check requested');
  res.status(200).json({ status: 'healthy', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  console.log('Ping requested');
  res.status(200).send('pong');
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// API status
app.get('/api', (req, res) => {
  console.log('API status requested');
  res.json({
    message: 'CodeRun Sandbox API',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🏥 Health endpoints: /health /healthz /ping`);
  console.log(`📱 Frontend: /`);
  console.log(`🔍 API status: /api`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

module.exports = app;