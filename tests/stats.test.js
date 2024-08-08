const request = require('supertest');
const app = require('../app');
const { expect } = require('chai');

describe('GET /stats', () => {
  it('should return stats', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('files');
  });
});
