const supertest = require('supertest');
const { app } = require('../server'); // Update the path to where your app is exported

describe('API Server', () => {
  let request;
  beforeEach(() => {
    request = supertest(app);
  });

  test('should respond to the GET / route', async () => {
    const response = await request.get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Welcome to the API.');
  });

  // Add more tests here
});
