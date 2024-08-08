const Bull = require('bull');
const dbClient = require('./utils/db');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const { hashPassword } = require('../utils/hash');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.getFileById(fileId);
  if (!file || file.userId !== userId) throw new Error('File not found');

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  }
});

const userQueue = new Bull('userQueue');

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.getUserById(userId);
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});

exports.createUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    try {
      const hashedPassword = hashPassword(password);
      const user = await dbClient.createUser({ email, password: hashedPassword });
      userQueue.add({ userId: user._id.toString() }); // Add job to the queue
      return res.status(201).json({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
