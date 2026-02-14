const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongo;

const externalUri = process.env.CI_MONGO_URI || process.env.MONGO_URI || null;

module.exports = {
  async connect() {
    if (externalUri) {
      // Use external Mongo (e.g. GitHub Actions service) when provided
      await mongoose.connect(externalUri, { serverSelectionTimeoutMS: 5000 });
      return;
    }

    // Fallback to in-memory server for local dev/tests
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  },
  async closeDatabase() {
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {
      // ignore
    }
    try {
      await mongoose.connection.close();
    } catch (e) {
      // ignore
    }
    if (mongo) await mongo.stop();
  },
  async clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
};
