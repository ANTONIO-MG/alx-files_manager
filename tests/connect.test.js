const request = require('supertest');
const app = require('../app');
const dbClient = require('../utils/db');
const { expect } = require('chai');

describe('GET /connect', () => {
  before(async () => {
    await dbClient.usersCollection.deleteMany({});
    await dbClient.createUser({ email: 'test@example.com', password: 'password' });
  });

  it('should login a user', async () => {
    const res = await request(app).get('/connect').auth('test@example.com', 'password');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('should not login a user with incorrect credentials', async () => {
    const res = await request(app).get('/connect').auth('test@example.com', 'wrongpassword');
    expect(res.status).to.equal(401);
  });
});
