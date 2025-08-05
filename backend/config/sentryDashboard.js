const Sentry = require('@sentry/node');

class SentryDashboard {
  constructor() {
    this.alertRules = {
      errorRate: {
        threshold: 0.05,
        timeWindow: '1h',
        description: 'Error rate exceeds 5%',
      },
      authFailures: {
        threshold: 10,
        timeWindow: '1h',
        description: 'More than 10 authentication failures per hour',
      },
      slowRequests: {
        threshold: 2000,
        timeWindow: '5m',
        description: 'Requests taking longer than 2 seconds',
      },
      memoryUsage: {
        threshold: 0.8,
        timeWindow: '5m',
        description: 'Memory usage exceeds 80%',
      },
      duplicateEmails: {
        threshold: 20,
        timeWindow: '1h',
        description: 'More than 20 duplicate email attempts per hour',
      },
    };
  }

  createDashboardMetrics() {
    return {
      errorRate: {
        query: 'error_rate()',
        timeRange: '24h',
        interval: '1h',
      },
      
      requestVolume: {
        query: 'request_volume()',
        timeRange: '24h',
        interval: '1h',
      },
      
      responseTime: {
        query: 'p95(response_time)',
        timeRange: '24h',
        interval: '1h',
      },
      
      memoryUsage: {
        query: 'memory_usage()',
        timeRange: '24h',
        interval: '5m',
      },

      authFailures: {
        query: 'sum(auth_failures)',
        timeRange: '24h',
        interval: '1h',
      },
      
      duplicateEmails: {
        query: 'sum(duplicate_emails)',
        timeRange: '24h',
        interval: '1h',
      },
    };
  }

  setupAlertRules() {
    const rules = [];

    rules.push({
      name: 'High Error Rate Alert',
      query: 'error_rate() > 0.05',
      timeWindow: '1h',
      threshold: 1,
      action: 'notify_team',
    });

    rules.push({
      name: 'High Auth Failure Rate',
      query: 'sum(auth_failures) > 10',
      timeWindow: '1h',
      threshold: 1,
      action: 'notify_security',
    });

    rules.push({
      name: 'Slow Request Alert',
      query: 'p95(response_time) > 2000',
      timeWindow: '5m',
      threshold: 1,
      action: 'notify_dev',
    });

    rules.push({
      name: 'High Memory Usage',
      query: 'memory_usage() > 0.8',
      timeWindow: '5m',
      threshold: 1,
      action: 'notify_ops',
    });

    return rules;
  }

  getDashboardConfig() {
    return {
      title: 'Todo App Backend Dashboard',
      description: 'Real-time monitoring for Todo App backend services',
      metrics: this.createDashboardMetrics(),
      alerts: this.setupAlertRules(),
      refreshInterval: '30s',
    };
  }
}

module.exports = SentryDashboard;