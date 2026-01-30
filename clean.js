#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning CodeRun Sandbox project...\n');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        try {
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'pipe' });
            } else {
                execSync(`rm -rf "${dirPath}"`, { stdio: 'pipe' });
            }
            log(`✅ Removed ${path.basename(dirPath)}`, 'green');
            return true;
        } catch (error) {
            log(`⚠️  Failed to remove ${path.basename(dirPath)}: ${error.message}`, 'yellow');
            return false;
        }
    }
    return false;
}

function cleanProject() {
    log('🗂️  Cleaning dependencies...', 'blue');
    
    // Remove node_modules directories
    removeDirectory(path.join(__dirname, 'node_modules'));
    removeDirectory(path.join(__dirname, 'server', 'node_modules'));
    removeDirectory(path.join(__dirname, 'client', 'node_modules'));
    
    log('\n📦 Cleaning build outputs...', 'blue');
    
    // Remove build directories
    removeDirectory(path.join(__dirname, 'client', 'build'));
    removeDirectory(path.join(__dirname, 'dist'));
    
    log('\n🗄️  Cleaning temporary files...', 'blue');
    
    // Remove log files
    const logFiles = ['.npm', '.cache', 'logs'];
    logFiles.forEach(file => {
        removeDirectory(path.join(__dirname, file));
    });
    
    // Remove database (optional - comment out if you want to keep data)
    const dbPath = path.join(__dirname, 'data', 'coderun.db');
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath);
            log('✅ Removed database (will be recreated on next run)', 'green');
        } catch (error) {
            log(`⚠️  Could not remove database: ${error.message}`, 'yellow');
        }
    }
    
    log('\n🎉 Project cleaned successfully!', 'green');
    log('\n📚 Next steps:', 'blue');
    log('   1. Run: npm run setup    (to reinstall dependencies)', 'reset');
    log('   2. Run: npm run dev      (to start development)', 'reset');
}

cleanProject();