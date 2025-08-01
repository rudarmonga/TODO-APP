const Sentry = require('@sentry/node');

const ALERT_THRESHOLDS = {
  ERROR_RATE: 0.05,
  AUTH_FAILURES: 10,
  DUPLICATE_EMAILS: 20,
  SLOW_REQUESTS: 2000,
  HIGH_MEMORY: 0.8,
};

class SentryMetrics {
  constructor() {
    this.metrics = {
      authFailures: 0,
      duplicateEmails: 0,
      slowRequests: 0,
      totalRequests: 0,
    };

    setInterval(() => {
      this.resetMetrics();
    }, 60 * 60 * 1000);
  }

  incrementAuthFailure() {
    this.metrics.authFailures++;
    this.checkAuthFailureAlert();
  }

  incrementDuplicateEmail() {
    this.metrics.duplicateEmails++;
    this.checkDuplicateEmailAlert();
  }

  incrementSlowRequest(duration) {
    this.metrics.slowRequests++;
    Sentry.addBreadcrumb({
      category: 'performance',
      message: 'Slow request detected',
      level: 'warning',
      data: {
        duration: duration,
        threshold: ALERT_THRESHOLDS.SLOW_REQUESTS,
      },
    });
  }

  incrementTotalRequest() {
    this.metrics.totalRequests++;
  }

  checkAuthFailureAlert() {
    if (this.metrics.authFailures >= ALERT_THRESHOLDS.AUTH_FAILURES) {
      Sentry.captureMessage('High authentication failure rate detected', {
        level: 'warning',
        tags: {
          alert_type: 'auth_failure_rate',
          count: this.metrics.authFailures,
        },
        extra: {
          threshold: ALERT_THRESHOLDS.AUTH_FAILURES,
          timeWindow: '1 hour',
        },
      });
    }
  }

  checkDuplicateEmailAlert() {
    if (this.metrics.duplicateEmails >= ALERT_THRESHOLDS.DUPLICATE_EMAILS) {
      Sentry.captureMessage('High duplicate email registration attempts', {
        level: 'warning',
        tags: {
          alert_type: 'duplicate_email_rate',
          count: this.metrics.duplicateEmails,
        },
        extra: {
          threshold: ALERT_THRESHOLDS.DUPLICATE_EMAILS,
          timeWindow: '1 hour',
          suggestion: 'Consider improving registration UX or adding email verification',
        },
      });
    }
  }

  resetMetrics() {
    this.metrics = {
      authFailures: 0,
      duplicateEmails: 0,
      slowRequests: 0,
      totalRequests: 0,
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.totalRequests > 0 
        ? (this.metrics.authFailures / this.metrics.totalRequests) 
        : 0,
    };
  }
}

const sentryMetrics = new SentryMetrics();

module.exports = {
  sentryMetrics,
  ALERT_THRESHOLDS,
};