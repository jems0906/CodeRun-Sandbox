const Queue = require('bull');
const Redis = require('redis');

let executionQueue = null;
let redisClient = null;

async function initializeQueue() {
    try {
        // Use Redis if available, otherwise use local queue
        const redisConfig = process.env.REDIS_URL ? 
            { redis: process.env.REDIS_URL } : 
            { redis: { port: 6379, host: '127.0.0.1' } };

        // For development, we'll create a simple in-memory queue fallback
        try {
            redisClient = Redis.createClient(redisConfig.redis);
            await redisClient.connect();
            console.log('Connected to Redis');
        } catch (redisError) {
            console.log('Redis not available, using in-memory queue for development');
            redisClient = null;
        }

        // Create execution queue
        executionQueue = new Queue('code execution', redisConfig);
        
        // Process jobs
        executionQueue.process('execute', require('../services/codeExecution').processExecution);

        // Queue event handlers
        executionQueue.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
        });

        executionQueue.on('failed', (job, err) => {
            console.log(`Job ${job.id} failed:`, err.message);
        });

        executionQueue.on('stalled', (job) => {
            console.log(`Job ${job.id} stalled`);
        });

        console.log('Queue system initialized');
    } catch (error) {
        console.error('Queue initialization error:', error);
        // For development, create a simple mock queue
        executionQueue = {
            add: async (name, data) => {
                const mockJob = {
                    id: Date.now().toString(),
                    data,
                    progress: () => {},
                };
                // Process immediately in development
                setTimeout(() => {
                    require('../services/codeExecution').processExecution(mockJob);
                }, 100);
                return mockJob;
            },
            getJob: async (id) => {
                return { id, data: {}, progress: 0 };
            }
        };
        console.log('Using mock queue for development');
    }
}

function getQueue() {
    if (!executionQueue) {
        throw new Error('Queue not initialized');
    }
    return executionQueue;
}

function getRedisClient() {
    return redisClient;
}

module.exports = {
    initializeQueue,
    getQueue,
    getRedisClient
};