// ---------------------
// DEV ENV ONLY: Bypass SSL errors (for self-signed certs)
// ---------------------
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ---------------------
// LOAD ENV & CORE MODULES
// ---------------------
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ---------------------
// IMPORTS
// ---------------------
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
const { performanceMiddleware, memoryMonitoringMiddleware } = require('./middleware/sentryPreformanceMiddleware');
const { sentryMetrics } = require('./config/sentryAlerts');
const SentryDashboard = require('./config/sentryDashboard');
const SentryNotifications = require('./utils/sentryNotifications');
const { businessMetricsMiddleware, userEngagementMiddleware } = require('./middleware/businessMetricsMiddleware');
const CustomMetrics = require('./utils/customMeteics');
const WebhookConfig = require('./config/webhookConfig');

// ---------------------
// SENTRY INITIALIZATION
// ---------------------
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: process.env.NODE_ENV === 'development',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
    new Tracing.Integrations.Mongo({ useMongoose: true }),
  ],
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    if (event.exception) {
      const exception = event.exception.values[0];
      if (exception.type === 'ValidationError' && exception.value.includes('password')) {
        return null;
      }
    }

    event.tags = {
      ...event.tags,
      service: 'todo-backend',
      region: process.env.REGION || 'local',
    };
    
    return event;
  },

  beforeSendTransaction(event) {
    if (event.op === 'http.server') {
      return event;
    }
    return event;
  },
});

// ---------------------------------------
// INITIALIZE DASHBOARD AND NOTIFICATIONS
// ---------------------------------------
const dashboard = new SentryDashboard();
const notifications = new SentryNotifications();

const customMetrics = new CustomMetrics();
const webhookConfig = new WebhookConfig();
console.log('📊 Sentry Dashboard Configuration:');
console.log(dashboard.getDashboardConfig());

// ---------------------
// HEALTH CHECK ENDPOINT
// ---------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sentry: {
      dashboard: dashboard.getDashboardConfig(),
      notifications: {
        email: !!process.env.SENTRY_EMAIL_NOTIFICATIONS,
        slack: !!process.env.SENTRY_SLACK_WEBHOOK_URL,
        teams: !!process.env.SENTRY_TEAMS_WEBHOOK_URL,
      },
    },
  });
});

// ---------------------
// LOG FOLDER SETUP
// ---------------------
const logsDir = path.join(__dirname, './logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ---------------------
// MIDDLEWARE SETUP
// ---------------------
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(loggingMiddleware);
app.use(requestLoggingMiddleware);
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);
app.use(performanceMiddleware);
app.use(memoryMonitoringMiddleware);
app.use((req, res, next) => {
  Sentry.addBreadcrumb({
    category: 'http',
    message: 'Request started',
    level: 'info',
    data: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
  });
  next();
});
app.use(businessMetricsMiddleware);
app.use(userEngagementMiddleware);

// ---------------------
// ROUTES
// ---------------------
app.use('/api/todos', (req, res, next) => {
  if (req.method === 'POST') {
    return todoCreateLimiter(req, res, next);
  }
  next();
});
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: customMetrics.getMetrics(),
    webhooks: webhookConfig.validateWebhooks(),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------
// 404 HANDLER
// ---------------------
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

// ---------------------
// ERROR HANDLING
// ---------------------
app.use(errorLoggingMiddleware);
app.use(errorHandler);
app.use(Sentry.Handlers.errorHandler());

// ---------------------
// SERVER START
// ---------------------
(async () => {
  try {
    await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
  });
  } catch (err) {
    logger.error({
      message: 'Failed to start server',
      error: err.message,
      stack: err.stack,
});
    process.exit(1);
  }
})();

// ---------------------
// PROCESS ERROR HANDLING
// ---------------------
process.on('unhandledRejection', (err) => {
  logger.error({
    message: 'UNHANDLED REJECTION! Shutting down...',
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({
    message: 'UNCAUGHT EXCEPTION! Shutting down...',
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
