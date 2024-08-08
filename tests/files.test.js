const request = require('supertest');
const app = require('../app');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const { expect } = require('chai');

describe('POST /files', () => {
  before(async () => {
    await dbClient.usersCollection.deleteMany({});
    const user = await dbClient.createUser({ email: 'test@example.com', password: 'password' });
    await redisClient.set('auth_testtoken', user._id.toString(), 24 * 3600);
  });

  it('should upload a file', async () => {
    const res = await request(app)
      .post('/files')
      .set('X-Token', 'testtoken')
      .field('name', 'testfile')
      .field('type', 'file')
      .attach('file', Buffer.from('test content'), 'testfile.txt');
    expect(res.status).to.equal(201);
  });

  it('should not upload a file without authentication', async () => {
    const res = await request(app)
      .post('/files')
      .field('name', 'testfile')
      .field('type', 'file')
      .attach('file', Buffer.from('test content'), 'testfile.txt');
    expect(res.status).to.equal(401);
  });
});

describe('GET /files/:id', () => {
  let fileId;

  before(async () => {
    await dbClient.filesCollection.deleteMany({});
    const user = await dbClient.getUserByEmail('test@example.com');
    const file = await dbClient.createFile({
      name: 'testfile',
      type: 'file',
      userId: user._id.toString(),
      localPath: '/tmp/testfile.txt',
    });
    fileId = file._id.toString();
  });

  it('should get file details', async () => {
    const res = await request(app).get(`/files/${fileId}`).set('X-Token', 'testtoken');
    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal('testfile');
  });

  it('should not get file details without authentication', async () => {
    const res = await request(app).get(`/files/${fileId}`);
    expect(res.status).to.equal(401);
  });
});

describe('GET /files', () => {
  before(async () => {
    await dbClient.filesCollection.deleteMany({});
    const user = await dbClient.getUserByEmail('test@example.com');
    for (let i = 0; i < 30; i++) {
      await dbClient.createFile({
        name: `testfile${i}`,
        type: 'file',
        userId: user._id.toString(),
        localPath: `/tmp/testfile${i}.txt`,
      });
    }
  });

  it('should get paginated files', async () => {
    const res = await request(app).get('/files').set('X-Token', 'testtoken').query({ page: 1 });
    expect(res.status).to.equal(200);
    expect(res.body.length).to.be.at.most(20);
  });

  it('should not get files without authentication', async () => {
    const res = await request(app).get('/files');
    expect(res.status).to.equal(401);
  });
});

describe('PUT /files/:id/publish', () => {
  let fileId;

  before(async () => {
    await dbClient.filesCollection.deleteMany({});
    const user = await dbClient.getUserByEmail('test@example.com');
    const file = await dbClient.createFile({
      name: 'testfile',
      type: 'file',
      userId: user._id.toString(),
      localPath: '/tmp/testfile.txt',
    });
    fileId = file._id.toString();
  });

  it('should publish a file', async () => {
    const res = await request(app).put(`/files/${fileId}/publish`).set('X-Token', 'testtoken');
    expect(res.status).to.equal(200);
    expect(res.body.isPublic).to.be.true;
  });

  it('should not publish a file without authentication', async () => {
    const res = await request(app).put(`/files/${fileId}/publish`);
    expect(res.status).to.equal(401);
  });
});

describe('PUT /files/:id/unpublish', () => {
  let fileId;

  before(async () => {
    await dbClient.filesCollection.deleteMany({});
    const user = await dbClient.getUserByEmail('test@example.com');
    const file = await dbClient.createFile({
      name: 'testfile',
      type: 'file',
      userId: user._id.toString(),
      localPath: '/tmp/testfile.txt',
    });
    fileId = file._id.toString();
  });

  it('should unpublish a file', async () => {
    const res = await request(app).put(`/files/${fileId}/unpublish`).set('X-Token', 'testtoken');
    expect(res.status).to.equal(200);
    expect(res.body.isPublic).to.be.false;
  });

  it('should not unpublish a file without authentication', async () => {
    const res = await request(app).put(`/files/${fileId}/unpublish`);
    expect(res.status).to.equal(401);
  });
});

describe('GET /files/:id/data', () => {
  let fileId;

  before(async () => {
    await dbClient.filesCollection.deleteMany({});
    const user = await dbClient.getUserByEmail('test@example.com');
    const file = await dbClient.createFile({
      name: 'testfile',
      type: 'file',
      userId: user._id.toString(),
      localPath: '/tmp/testfile.txt',
      isPublic: true,
    });
    fileId = file._id.toString();
  });

  it('should get file data', async () => {
    const res = await request(app).get(`/files/${fileId}/data`);
    expect(res.status).to.equal(200);
  });

  it('should not get file data without authentication for a private file', async () => {
    const file = await dbClient.createFile({
      name: 'privatefile',
      type: 'file',
      userId: 'someuserid',
      localPath: '/tmp/privatefile.txt',
      isPublic: false,
    });
    const res = await request(app).get(`/files/${file._id.toString()}/data`);
    expect(res.status).to.equal(404);
  });
});
