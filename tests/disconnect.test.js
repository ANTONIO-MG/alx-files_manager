const request = require('supertest');
const app = require('../app');
const redisClient = require('../utils/redis');
const { expect } = require('chai');

describe('GET /disconnect', () => {
  it('should logout a user', async () => {
    const token = await redisClient.set('auth_testtoken', 'testuserid', 24 * 3600);
    const res = await request(app).get('/disconnect').set('X-Token', 'testtoken');
    expect(res.status).to.equal(204);
  });

  it('should not logout a user without a valid token', async () => {
    const res = await request(app).get('/disconnect');
    expect(res.status).to.equal(401);
  });
});
