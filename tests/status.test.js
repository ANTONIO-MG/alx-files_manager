const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('GET /status', () => {
  it('should return status OK', async () => {
    const res = await request(app).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ redis: true, db: true });
  });
});
