#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up CodeRun Sandbox...\n');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
    try {
        log(`📦 ${description}...`, 'blue');
        execSync(command, { stdio: 'inherit' });
        log(`✅ ${description} completed`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${description} failed: ${error.message}`, 'red');
        return false;
    }
}

async function setupProject() {
    try {
        // Check if Docker is available
        try {
            execSync('docker --version', { stdio: 'pipe' });
            log('✅ Docker is available', 'green');
        } catch (error) {
            log('⚠️  Docker not found. Code execution will use fallback mode.', 'yellow');
            log('   Install Docker for full functionality: https://docs.docker.com/get-docker/', 'yellow');
        }

        // Create environment file
        const envExample = path.join(__dirname, '.env.example');
        const envFile = path.join(__dirname, '.env');
        
        if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
            fs.copyFileSync(envExample, envFile);
            log('✅ Environment file created (.env)', 'green');
        }

        // Install root dependencies
        if (!execCommand('npm install', 'Installing root dependencies')) {
            throw new Error('Failed to install root dependencies');
        }

        // Install server dependencies
        if (!execCommand('cd server && npm install', 'Installing server dependencies')) {
            throw new Error('Failed to install server dependencies');
        }

        // Install client dependencies
        if (!execCommand('cd client && npm install', 'Installing client dependencies')) {
            throw new Error('Failed to install client dependencies');
        }

        // Create data directory
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            log('✅ Data directory created', 'green');
        }

        // Initialize database with sample problems
        log('🗄️  Setting up database and sample problems...', 'blue');
        if (!execCommand('cd server && node scripts/setup-database.js', 'Setting up database')) {
            throw new Error('Failed to setup database');
        }

        // Pull Docker images for code execution (if Docker is available)
        try {
            execSync('docker --version', { stdio: 'pipe' });
            log('🐳 Pulling execution environment images...', 'blue');
            
            try {
                execSync('docker pull python:3.9-alpine', { stdio: 'inherit' });
                log('✅ Python execution image ready', 'green');
            } catch (error) {
                log('⚠️  Failed to pull Python image, will download on first use', 'yellow');
            }

            try {
                execSync('docker pull node:18-alpine', { stdio: 'inherit' });
                log('✅ JavaScript execution image ready', 'green');
            } catch (error) {
                log('⚠️  Failed to pull Node.js image, will download on first use', 'yellow');
            }
        } catch (error) {
            // Docker not available, skip image pulling
        }

        // Success message
        log('\n🎉 Setup completed successfully!', 'green');
        log('\n📚 Next steps:', 'cyan');
        log('   1. Start the development server: npm run dev', 'cyan');
        log('   2. Open http://localhost:3000 in your browser', 'cyan');
        log('   3. Try solving some problems!', 'cyan');
        
        log('\n🔧 Available commands:', 'blue');
        log('   npm run dev          - Start development environment', 'reset');
        log('   npm run build        - Build for production', 'reset');
        log('   npm start            - Start production server', 'reset');
        log('   npm test             - Run tests', 'reset');
        
        log('\n📖 Documentation:', 'blue');
        log('   API docs: http://localhost:5000/api/docs', 'reset');
        log('   Health check: http://localhost:5000/health', 'reset');

    } catch (error) {
        log(`\n❌ Setup failed: ${error.message}`, 'red');
        log('\n🆘 Troubleshooting:', 'yellow');
        log('   1. Make sure Node.js 16+ is installed', 'yellow');
        log('   2. Check your internet connection', 'yellow');
        log('   3. Try running: npm cache clean --force', 'yellow');
        log('   4. For Docker issues, ensure Docker Desktop is running', 'yellow');
        process.exit(1);
    }
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
    log('❌ Node.js 16 or higher is required', 'red');
    log(`   Current version: ${nodeVersion}`, 'red');
    log('   Please update Node.js: https://nodejs.org/', 'yellow');
    process.exit(1);
}

// Run setup
setupProject();