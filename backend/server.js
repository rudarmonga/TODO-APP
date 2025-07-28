require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const logger = require('./utils/logger');

const {
  loggingMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
} = require('./middleware/logginMiddleware');

const {
  generalLimiter,
  authLimiter,
  todoCreateLimiter,
} = require('./middleware/ratelimitMiddleware');

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, './logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ----- MIDDLEWARE -----
app.use(loggingMiddleware);
app.use(requestLoggingMiddleware);
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);

// ----- ROUTES -----

// Apply todoCreateLimiter only for POST requests to /api/todos
app.use('/api/todos', (req, res, next) => {
  if (req.method === 'POST') {
    return todoCreateLimiter(req, res, next);
  }
  next();
});

app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ----- 404 HANDLER -----
app.all('*', (req, res) => {
  logger.warn({
    message: 'Route not found',
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// ----- ERROR HANDLING -----
app.use(errorLoggingMiddleware);
app.use(errorHandler);

// ----- START SERVER -----
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

// ----- PROCESS ERROR HANDLING -----
process.on('unhandledRejection', (err) => {
  logger.error({
    message: 'UNHANDLED REJECTION! Shutting down...',
    error: err.message,
    stack: err.stack,
  });

  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({
    message: 'UNCAUGHT EXCEPTION! Shutting down...',
    error: err.message,
    stack: err.stack,
  });

  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});