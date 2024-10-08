const redisClient = require('../utils/redis');
const { expect } = require('chai');

describe('redisClient', () => {
  it('should be connected', async () => {
    const isAlive = await redisClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should set and get a key', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a key', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null;
  });
});
