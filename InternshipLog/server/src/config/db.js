const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<user>') || uri.includes('<pass>')) {
    console.warn('\n⚠️ [Database Warning] MONGO_URI contains unconfigured placeholders.');
    console.warn('👉 Please update "InternshipLog/server/.env" with your actual MongoDB Atlas or local connection string.\n');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`\n✅ [Database] MongoDB Connected: ${conn.connection.host}\n`);
    return conn;
  } catch (error) {
    console.error(`\n❌ [Database Error] Connection failed: ${error.message}`);
    console.error('👉 If using MongoDB Atlas, verify that your IP address is whitelisted (0.0.0.0/0 in Network Access) and your username/password are correct.\n');
    return null;
  }
};

module.exports = connectDB;
