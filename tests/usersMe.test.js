const request = require('supertest');
const app = require('../app');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { expect } = require('chai');

describe('GET /users/me', () => {
  before(async () => {
    await dbClient.usersCollection.deleteMany({});
    const user = await dbClient.createUser({ email: 'test@example.com', password: 'password' });
    await redisClient.set('auth_testtoken', user._id.toString(), 24 * 3600);
  });

  it('should get user details', async () => {
    const res = await request(app).get('/users/me').set('X-Token', 'testtoken');
    expect(res.status).to.equal(200);
    expect(res.body.email).to.equal('test@example.com');
  });

  it('should not get user details without a valid token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).to.equal(401);
  });
});
