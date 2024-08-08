// utils/db.js
const { MongoClient, ObjectID } = require('mongodb')

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true,  useUnifiedTopology: true  });

    this.client.connect().then(() => {
      this.db = this.client.db(database);
      this.usersCollection = this.db.collection('users');
    }).catch((err) => console.error('MongoDB client not connected to the server:', err));
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  async getFileById(id) {
    const file = await this.filesCollection.findOne({ _id: id });
    return file;
  }

  async getFiles(userId, parentId, page) {
    const files = await this.filesCollection.aggregate([
      { $match: { userId, parentId: parseInt(parentId) } },
      { $skip: page * 20 },
      { $limit: 20 }
    ]).toArray();
    return files;
  }

  async updateFile(file) {
    const result = await this.filesCollection.updateOne({ _id: file._id }, { $set: file });
    return result;
  }

  async createUser({ email, password }) {
    const result = await this.usersCollection.insertOne({ email, password });
    return result.ops[0];
  }

  async getUserById(userId) {
    return this.usersCollection.findOne({ _id: new ObjectID(userId) });
  }
}

const dbClient = new DBClient();
export default dbClient;
