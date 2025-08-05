const CustomMetrics = require('../utils/customMeteics');

const businessMetricsMiddleware = (req, res, next) => {
  const startTime = process.hrtime();
  
  req.customMetrics = new CustomMetrics();
  req.customMetrics.trackPerformance('request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6);

    req.customMetrics.trackPerformance('request', {
      responseTime: responseTime,
      statusCode: res.statusCode,
    });

    if (responseTime > 2000) {
      req.customMetrics.trackPerformance('slow_request', {
        responseTime: responseTime,
        url: req.url,
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

const userEngagementMiddleware = (req, res, next) => {
  if (req.user) {
    req.customMetrics.trackUserEngagement('active_user', req.user._id);
  }

  next();
};

module.exports = {
  businessMetricsMiddleware,
  userEngagementMiddleware,
};