const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async (overrideUri) => {
  const uri = overrideUri || process.env.MONGO_URI;
  const isPlaceholder =
    !uri ||
    uri.includes('<user>') ||
    uri.includes('<pass>') ||
    uri.includes('<username>') ||
    uri.includes('<password>');

  // 1. If real URI provided, attempt connecting to it first
  if (!isPlaceholder) {
    try {
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
      });

      console.log(`\n✅ [Database] MongoDB Connected to: ${conn.connection.host}\n`);
      return conn;
    } catch (error) {
      console.warn(`\n⚠️ [Database Warning] Could not connect to configured MONGO_URI (${error.message}).`);
      console.warn('👉 Falling back to in-memory MongoDB for local development...\n');
    }
  } else {
    console.warn('\n⚠️ [Database Notice] MONGO_URI contains unconfigured placeholders (<user>:<pass>).');
    console.warn('👉 Starting automated local in-memory MongoDB so the app works immediately!\n');
  }

  // 2. Automated in-memory MongoDB fallback
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    const memUri = memoryServer.getUri();
    const conn = await mongoose.connect(memUri, {
      autoIndex: true,
    });

    console.log(`✅ [Database] In-memory MongoDB started and connected successfully!`);
    console.log(`👉 To connect to cloud MongoDB Atlas instead, add your cluster string in server/.env\n`);
    return conn;
  } catch (memErr) {
    console.error(`\n❌ [Database Error] Failed to initialize database: ${memErr.message}\n`);
    return null;
  }
};

module.exports = connectDB;
