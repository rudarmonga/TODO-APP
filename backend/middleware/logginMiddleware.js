// middleware/loggingMiddleware.js
const morgan = require('morgan');
const logger = require('../utils/logger');

// Redacts sensitive fields from body
function safeBody(req) {
  const clone = { ...req.body };
  if (clone.password) clone.password = '***';
  if (clone.token) clone.token = '***';
  return JSON.stringify(clone);
}

// Define custom tokens
morgan.token('body', req => (['POST', 'PUT'].includes(req.method) ? safeBody(req) : ''));
morgan.token('response-time-ms', (req, res) => {
  const diff = process.hrtime(req._startAt);
  const ms = diff ? (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2) : '0.00';
  return ms;
});

const logFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" ' +
  ':status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :body';

// Logs all requests except health checks
const loggingMiddleware = morgan(logFormat, {
  stream: logger.stream,
  skip: req => ['/health', '/ping'].includes(req.url),
});

// Logs successful request summary
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = process.hrtime();

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    logger.info({
      message: 'Request completed',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Logs error details
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
  });
  next(err);
};

module.exports = {
  loggingMiddleware,
  errorLoggingMiddleware,
  requestLoggingMiddleware,
};
