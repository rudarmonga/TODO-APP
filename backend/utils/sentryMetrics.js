const Sentry = require('@sentry/node');

class PerformanceMonitor {
  static startTransaction(name, operation) {
    return Sentry.startTransaction({
      name: name,
      op: operation,
    });
  }

  static addPerformanceBreadcrumb(category, message, data) {
    Sentry.addBreadcrumb({
      category: category,
      message: message,
      level: 'info',
      data: data,
    });
  }

  static trackDatabaseQuery(operation, collection, duration) {
    Sentry.addBreadcrumb({
      category: 'database',
      message: `Database ${operation} on ${collection}`,
      level: 'info',
      data: {
        operation: operation,
        collection: collection,
        duration: duration,
      },
    });

    if (duration > 100) {
      Sentry.captureMessage('Slow database query detected', {
        level: 'warning',
        tags: {
          type: 'slow_database_query',
          operation: operation,
          collection: collection,
        },
        extra: {
          duration: duration,
          threshold: 100,
        },
      });
    }
  }

  static trackMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    Sentry.addBreadcrumb({
      category: 'system',
      message: 'Memory usage check',
      level: 'info',
      data: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        memoryUsagePercent: Math.round(memoryUsagePercent) + '%',
      },
    });

    if (memoryUsagePercent > 80) {
      Sentry.captureMessage('High memory usage detected', {
        level: 'warning',
        tags: {
          type: 'high_memory_usage',
        },
        extra: {
          memoryUsagePercent: memoryUsagePercent,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
        },
      });
    }
  }

  static trackErrorRate(totalRequests, errorCount) {
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) : 0;
    
    if (errorRate > 0.05) {
      Sentry.captureMessage('High error rate detected', {
        level: 'error',
        tags: {
          type: 'high_error_rate',
        },
        extra: {
          errorRate: errorRate,
          totalRequests: totalRequests,
          errorCount: errorCount,
          threshold: 0.05,
        },
      });
    }
  }
}

module.exports = PerformanceMonitor;