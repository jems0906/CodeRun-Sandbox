# CodeRun Sandbox

A scalable code execution platform inspired by LeetCode, featuring safe code execution, queue-based processing, and comprehensive algorithm problems.

## ✨ Features

- **🔒 Safe Code Execution**: Docker-based sandboxing for secure code execution
- **⚡ Queue-Based Processing**: Redis-powered job queue for handling multiple submissions  
- **🌐 Multi-Language Support**: Python and JavaScript execution environments
- **📊 Real-time Results**: Live feedback on code execution, runtime, and memory usage
- **📚 Problem Library**: Curated data structures and algorithms problems
- **📈 Performance Analytics**: Runtime complexity analysis and statistics
- **🎨 Modern UI**: Clean, responsive React interface with Monaco code editor
- **🔧 Developer Friendly**: Comprehensive API with detailed documentation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│   Express API   │───▶│  Execution Queue│
│   (Port 3000)   │    │   (Port 5000)   │    │   (Redis/Bull)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   SQLite DB     │    │ Docker Sandbox  │
                       │ (Problems/Stats)│    │ (Isolated Exec) │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Automatic Setup (Recommended)
```bash
# Run the setup script - it handles everything!
node setup.js
```

### Manual Setup
1. **Prerequisites Check**:
   ```bash
   node --version  # Should be 16+
   docker --version  # Optional but recommended
   ```

2. **Install Dependencies**:
   ```bash
   npm run setup
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env file if needed
   ```

4. **Database Initialization**:
   ```bash
   cd server
   node scripts/setup-database.js
   ```

### 🎮 Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server:dev  # Backend only (port 5000)
npm run client:dev  # Frontend only (port 3000)
```

### 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000  
- **API Documentation**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health

## 📱 Usage

1. **Browse Problems**: Visit the homepage to see available coding challenges
2. **Select Problem**: Click on any problem to open the code editor
3. **Choose Language**: Select Python or JavaScript
4. **Write Code**: Use the Monaco editor with syntax highlighting
5. **Submit & Test**: Run your code against test cases
6. **View Results**: See execution time, memory usage, and test results

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development environment (both client & server) |
| `npm run build` | Build production client |
| `npm start` | Start production server |
| `npm test` | Run server tests |
| `npm run setup` | Install all dependencies |
| `npm run clean` | Clean project (remove node_modules, build files, cache) |

## 🔧 Configuration

### Environment Variables (.env)
```bash
NODE_ENV=development
PORT=5000
DATABASE_PATH=./data/coderun.db
REDIS_URL=redis://localhost:6379  # Optional
FRONTEND_URL=http://localhost:3000
EXECUTION_TIMEOUT=10000  # 10 seconds
MEMORY_LIMIT=128m
CPU_LIMIT=0.5
```

## 🐳 Docker Deployment

### Development with Docker Compose
```bash
docker-compose up -d
```

### Production Deployment
```bash
# Build production image
docker build -t coderun-sandbox .

# Run with environment variables
docker run -p 5000:5000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e NODE_ENV=production \
  coderun-sandbox
```

## 📊 Supported Languages

### Python 3.9+
- Full standard library support
- Secure execution environment
- Memory and CPU limitations
- Import restrictions for security

### JavaScript (Node.js 18)
- ES6+ features supported
- Common built-in modules available
- Secure execution sandbox
- Resource limitations enforced

## 🔐 Security Features

- **Isolated Execution**: All code runs in Docker containers
- **Resource Limits**: CPU, memory, and execution time constraints
- **Network Isolation**: No network access during code execution
- **Input Sanitization**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Error Handling**: Safe error reporting without system information leaks

## 📚 API Documentation

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems` | List all problems with pagination |
| GET | `/api/problems/:id` | Get specific problem details |
| POST | `/api/execution/submit` | Submit code for execution |
| GET | `/api/execution/status/:id` | Get execution results |
| GET | `/api/stats/platform` | Get platform statistics |

### Example API Usage

```javascript
// Submit code for execution
const response = await fetch('/api/execution/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    problemId: 1,
    language: 'python',
    code: 'def twoSum(nums, target): return [0, 1]'
  })
});

const { submissionId } = await response.json();

// Check execution status
const statusResponse = await fetch(`/api/execution/status/${submissionId}`);
const result = await statusResponse.json();
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testNamePattern="API Health Check"

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper commit messages
4. Add tests for new functionality
5. Submit a pull request

## 📈 Performance

- **Average Response Time**: < 100ms for API calls
- **Code Execution**: 1-10 seconds depending on algorithm complexity
- **Concurrent Users**: Supports multiple simultaneous code executions
- **Resource Usage**: Optimized Docker containers with minimal overhead

## 🐛 Troubleshooting

### Common Issues

1. **Docker Issues**:
   ```bash
   # Ensure Docker is running
   docker --version
   docker ps
   ```

2. **Port Conflicts**:
   ```bash
   # Check what's using ports 3000/5000
   netstat -an | findstr :3000
   netstat -an | findstr :5000
   ```

3. **Database Issues**:
   ```bash
   # Reset database
   rm data/coderun.db
   cd server && node scripts/setup-database.js
   ```

4. **Module Issues**:
   ```bash
   # Clean install
   rm -rf node_modules server/node_modules client/node_modules
   npm run setup
   ```

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by LeetCode's problem-solving platform
- Built with modern web technologies
- Thanks to the open-source community for the amazing tools