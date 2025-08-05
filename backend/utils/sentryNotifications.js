const Sentry = require('@sentry/node');

class SentryNotifications {
  constructor() {
    this.notificationChannels = {
      email: process.env.SENTRY_EMAIL_NOTIFICATIONS === 'true',
      slack: process.env.SENTRY_SLACK_WEBHOOK_URL,
      teams: process.env.SENTRY_TEAMS_WEBHOOK_URL,
    };
  }

  async sendNotification(alertType, data) {
    const notification = this.createNotification(alertType, data);

    try {
      Sentry.captureMessage(`Alert: ${notification.title}`, {
        level: 'warning',
        tags: {
          alert_type: alertType,
          notification_sent: true,
        },
        extra: {
          notification,
          data,
        },
      });

      if (this.notificationChannels.email) {
        await this.sendEmailNotification(notification);
      }

      if (this.notificationChannels.slack) {
        await this.sendSlackNotification(notification);
      }

      if (this.notificationChannels.teams) {
        await this.sendTeamsNotification(notification);
      }

    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          alert_type: alertType,
          notification_failed: true,
        },
      });
    }
  }

  createNotification(alertType, data) {
    const notifications = {
      errorRate: {
        title: '🚨 High Error Rate Detected',
        message: `Error rate has exceeded 5% (${(data.errorRate * 100).toFixed(2)}%)`,
        severity: 'critical',
        action: 'Investigate immediately',
      },
      authFailures: {
        title: '🔐 High Authentication Failures',
        message: `${data.count} authentication failures in the last hour`,
        severity: 'warning',
        action: 'Check for potential security issues',
      },
      slowRequests: {
        title: '🐌 Slow Request Performance',
        message: `Requests taking longer than ${data.threshold}ms detected`,
        severity: 'warning',
        action: 'Investigate performance bottlenecks',
      },
      memoryUsage: {
        title: '💾 High Memory Usage',
        message: `Memory usage at ${(data.memoryUsage * 100).toFixed(2)}%`,
        severity: 'warning',
        action: 'Check for memory leaks or scale up resources',
      },
      duplicateEmails: {
        title: '📧 High Duplicate Email Attempts',
        message: `${data.count} duplicate email registration attempts`,
        severity: 'info',
        action: 'Consider UX improvements or email verification',
      },
    };

    return notifications[alertType] || {
      title: '⚠️ Alert',
      message: 'Unknown alert type',
      severity: 'info',
      action: 'Review alert configuration',
    };
  }

  async sendEmailNotification(notification) {
    console.log('Email notification:', notification);
  }

  async sendSlackNotification(notification) {
    if (!this.notificationChannels.slack) return;

    const slackMessage = {
      text: notification.title,
      attachments: [{
        color: this.getSeverityColor(notification.severity),
        fields: [
          { title: 'Message', value: notification.message, short: false },
          { title: 'Action Required', value: notification.action, short: false },
          { title: 'Environment', value: process.env.NODE_ENV || 'development', short: true },
          { title: 'Timestamp', value: new Date().toISOString(), short: true },
        ],
      }],
    };

    try {
      const response = await fetch(this.notificationChannels.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.status}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          notification_channel: 'slack',
          notification_failed: true,
        },
      });
    }
  }

  async sendTeamsNotification(notification) {
    if (!this.notificationChannels.teams) return;

    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: this.getSeverityColor(notification.severity),
      summary: notification.title,
      sections: [{
        activityTitle: notification.title,
        activitySubtitle: notification.message,
        facts: [
          { name: 'Action Required', value: notification.action },
          { name: 'Environment', value: process.env.NODE_ENV || 'development' },
          { name: 'Timestamp', value: new Date().toISOString() },
        ],
      }],
    };

    try {
      const response = await fetch(this.notificationChannels.teams, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      });

      if (!response.ok) {
        throw new Error(`Teams notification failed: ${response.status}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          notification_channel: 'teams',
          notification_failed: true,
        },
      });
    }
  }

  getSeverityColor(severity) {
    const colors = {
      critical: '#ff0000',
      warning: '#ffa500',
      info: '#0000ff',
    };
    return colors[severity] || '#808080';
  }
}

module.exports = SentryNotifications;