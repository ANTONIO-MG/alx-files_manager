const dbClient = require('../utils/db');
const { expect } = require('chai');

describe('dbClient', () => {
  before(async () => {
    await dbClient.usersCollection.deleteMany({});
  });

  it('should be connected', () => {
    const isAlive = dbClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should create a user', async () => {
    const user = await dbClient.createUser({ email: 'test@example.com', password: 'password' });
    expect(user.email).to.equal('test@example.com');
  });

  it('should find a user by email', async () => {
    const user = await dbClient.getUserByEmail('test@example.com');
    expect(user.email).to.equal('test@example.com');
  });

  it('should find a user by id', async () => {
    const user = await dbClient.getUserByEmail('test@example.com');
    const foundUser = await dbClient.getUserById(user._id);
    expect(foundUser.email).to.equal('test@example.com');
  });
});
