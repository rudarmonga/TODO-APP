const Sentry = require('@sentry/node');
const PerformanceMonitor = require('../utils/sentryMetrics');
const { sentryMetrics } = require('../config/sentryAlerts');

const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime();

  sentryMetrics.incrementTotalRequest();

  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6);

    if (responseTime > 2000) {
      sentryMetrics.incrementSlowRequest(responseTime);
      
      Sentry.captureMessage('Slow request detected', {
        level: 'warning',
        tags: {
          type: 'slow_request',
          method: req.method,
          url: req.url,
        },
        extra: {
          responseTime: responseTime,
          threshold: 2000,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        },
      });
    }

    PerformanceMonitor.addPerformanceBreadcrumb('http', 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime,
      contentLength: res.get('Content-Length'),
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

const memoryMonitoringMiddleware = (req, res, next) => {
  if (Math.random() < 0.01) {
    PerformanceMonitor.trackMemoryUsage();
  }
  
  next();
};

module.exports = {
  performanceMiddleware,
  memoryMonitoringMiddleware,
};