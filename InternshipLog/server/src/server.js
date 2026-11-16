const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 [Server] InternshipLog backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  console.log(`🔗 [Server] Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 [Server] API Base:     http://localhost:${PORT}/api/applications\n`);

  // Attempt database connection
  connectDB();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
