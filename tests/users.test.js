const request = require('supertest');
const app = require('../app');
const dbClient = require('../utils/db');
const { expect } = require('chai');

describe('POST /users', () => {
  before(async () => {
    await dbClient.usersCollection.deleteMany({});
  });

  it('should create a new user', async () => {
    const res = await request(app).post('/users').send({ email: 'test@example.com', password: 'password' });
    expect(res.status).to.equal(201);
    expect(res.body.email).to.equal('test@example.com');
  });

  it('should not create a user with the same email', async () => {
    const res = await request(app).post('/users').send({ email: 'test@example.com', password: 'password' });
    expect(res.status).to.equal(400);
  });
});
