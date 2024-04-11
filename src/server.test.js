const request = require('supertest');
const { app } = require('../server');

describe('Server', () => {
  it('should return a welcome message on the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to the API.');
  });

  it('should handle a POST request to /api/stripe/checkout', async () => {
    const response = await request(app).post('/api/stripe/checkout');
    expect(response.status).toBe(200);
    // Add more assertions as needed
  });

  it('should handle a GET request to /api', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(200);
    // Add more assertions as needed
  });

  it('should handle a GET request to a non-existent route', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
    // Add more assertions as needed
  });

  // Add more test cases for other routes and error handling as needed
});
const request = require('supertest');
const app = require('./server');

describe('Server', () => {
  describe('CORS configuration', () => {
    it('should allow all origins', async () => {
      const response = await request(app).get('/');
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should allow specified methods', async () => {
      const response = await request(app).get('/');
      expect(response.headers['access-control-allow-methods']).toBe('GET,POST,PUT,DELETE');
    });

    it('should allow specified headers', async () => {
      const response = await request(app).get('/');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type,Authorization');
    });

    it('should allow credentials', async () => {
      const response = await request(app).get('/');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should return 200 for preflight requests', async () => {
      const response = await request(app).options('/');
      expect(response.status).toBe(200);
    });
  });
});
