// controllers/FilesController.js
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const fs = require('fs');
const mime = require('mime-types');
const Bull = require('bull');
const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');
  
  const file = await dbClient.getFileById(fileId);
  if (!file || file.userId !== userId) throw new Error('File not found');
  
  const imageThumbnail = require('image-thumbnail');
  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  }
});

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentFile = parentId !== 0 ? await dbClient.db.collection('files').findOne({ _id: new dbClient.ObjectID(parentId) }) : null;
    if (parentId !== 0 && (!parentFile || parentFile.type !== 'folder')) {
      return res.status(400).json({ error: 'Parent not found or is not a folder' });
    }

    const fileData = {
      userId: new dbClient.ObjectID(userId),
      name,
      type,
      parentId: parentId === 0 ? 0 : new dbClient.ObjectID(parentId),
      isPublic,
    };

    if (type === 'folder') {
      fileData.path = null;
    } else {
      const fileName = uuidv4();
      const filePath = path.join(FOLDER_PATH, fileName);
      await fs.writeFile(filePath, Buffer.from(data, 'base64'));
      fileData.path = filePath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileData);
    res.status(201).json({
      id: result.insertedId,
      userId: fileData.userId,
      name: fileData.name,
      type: fileData.type,
      isPublic: fileData.isPublic,
      parentId: fileData.parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(req.params.id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const files = await dbClient.getFiles(userId, parentId, parseInt(page));

    return res.status(200).json(files);
    }

  static async putPublish(req, res) {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = await dbClient.getFileById(req.params.id);
      if (!file || file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      file.isPublic = true;
      await dbClient.updateFile(file);

      return res.status(200).json(file);
    }
    
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(req.params.id);
      if (!file || file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = false;
    await dbClient.updateFile(file);

    return res.status(200).json(file);
    }

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;

    const file = await dbClient.getFileById(id);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!file.isPublic) {
      const token = req.headers['x-token'];
      if (!token) {
      return res.status(404).json({ error: 'Not found' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    let filePath = file.localPath;
    if (size) {
      filePath += `_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    }

    static async postUpload(req, res) {
      // Existing code to handle file upload

      if (file.type === 'image') {
        fileQueue.add({ userId: file.userId, fileId: file._id });
      }
    
      return res.status(201).json(file);
    }
}

export default FilesController;
