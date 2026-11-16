const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const applicationRoutes = require('./routes/applications');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Database connectivity check for API routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected. Please configure MONGO_URI in server/.env with your MongoDB Atlas or local connection string.',
    });
  }
  next();
});

// Routes
app.use('/api/applications', applicationRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
