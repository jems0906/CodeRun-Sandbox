const request = require('supertest');
const app = require('../index');

describe('API Health Check', () => {
    test('GET /health should return 200', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
    });
});

describe('Problems API', () => {
    test('GET /api/problems should return problems list', async () => {
        const response = await request(app).get('/api/problems');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('problems');
        expect(Array.isArray(response.body.problems)).toBe(true);
    });
});

describe('API Documentation', () => {
    test('GET /api/docs should return API documentation', async () => {
        const response = await request(app).get('/api/docs');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('endpoints');
    });
});