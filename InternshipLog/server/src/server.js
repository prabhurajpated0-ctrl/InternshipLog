const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize database connection before listening
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 [Server] InternshipLog backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
      console.log(`🔗 [Server] Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 [Server] API Base:     http://localhost:${PORT}/api/applications\n`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error(`[Server Error] Startup failed: ${err.message}`);
    process.exit(1);
  }
};

startServer();
