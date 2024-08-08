// utils/redis.js
import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Handle Redis client connection errors
    this.client.on('error', (err) => {
      console.error('Redis client not connected to the server:', err);
    });

    // Promisify Redis methods for async/await usage
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Check if Redis client is connected
  isAlive() {
    return this.client.connected; // Note: This may not always be reliable
  }

  // Retrieve value for a given key
  async get(key) {
    try {
      return await this.getAsync(key);
    } catch (err) {
      console.error(`Error getting key ${key}:`, err);
      throw err; // Re-throw to ensure caller handles the error
    }
  }

  // Set value for a given key with expiration
  async set(key, value, duration) {
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Error setting key ${key}:`, err);
      throw err; // Re-throw to ensure caller handles the error
    }
  }

  // Delete a key from Redis
  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(`Error deleting key ${key}:`, err);
      throw err; // Re-throw to ensure caller handles the error
    }
  }
}

// Create an instance and export
const redisClient = new RedisClient();
export default redisClient;
