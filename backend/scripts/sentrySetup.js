const Sentry = require('@sentry/node');
const SentryDashboard = require('../config/sentryDashboard');
const SentryNotifications = require('../utils/sentryNotifications');

class SentrySetup {
  constructor() {
    this.dashboard = new SentryDashboard();
    this.notifications = new SentryNotifications();
  }

  async initializeSentry() {
    try {
      const dashboardConfig = this.dashboard.getDashboardConfig();
      
      console.log('Setting up Sentry dashboard...');
      console.log('Dashboard configuration:', JSON.stringify(dashboardConfig, null, 2));

      const alertRules = this.dashboard.setupAlertRules();
      console.log('Alert rules configured:', alertRules.length);

      await this.testNotifications();

      console.log('✅ Sentry setup completed successfully!');
      
    } catch (error) {
      console.error('❌ Sentry setup failed:', error);
      Sentry.captureException(error, {
        tags: {
          setup_failed: true,
        },
      });
    }
  }

  async testNotifications() {
    console.log('Testing notification channels...');

    const testData = {
      errorRate: 0.06,
      count: 15,
      threshold: 2000,
      memoryUsage: 0.85,
    };

    await this.notifications.sendNotification('errorRate', testData);
    await this.notifications.sendNotification('authFailures', testData);
    await this.notifications.sendNotification('slowRequests', testData);
    await this.notifications.sendNotification('memoryUsage', testData);
    await this.notifications.sendNotification('duplicateEmails', testData);

    console.log('✅ Notification tests completed');
  }

  getDashboardInstructions() {
    return {
      dashboardUrl: `https://sentry.io/organizations/${process.env.SENTRY_ORG}/dashboards/`,
      instructions: [
        '1. Go to your Sentry organization dashboard',
        '2. Create a new dashboard with the metrics from config/sentryDashboard.js',
        '3. Set up alert rules for the configured thresholds',
        '4. Configure notification channels (email, Slack, Teams)',
        '5. Test the alert system by triggering test alerts',
      ],
      metrics: this.dashboard.createDashboardMetrics(),
      alerts: this.dashboard.setupAlertRules(),
    };
  }
}

if (require.main === module) {
  const setup = new SentrySetup();
  setup.initializeSentry()
    .then(() => {
      console.log('\n📊 Dashboard Instructions:');
      const instructions = setup.getDashboardInstructions();
      console.log(instructions.instructions.join('\n'));
      console.log('\n🔗 Dashboard URL:', instructions.dashboardUrl);
    })
    .catch(console.error);
}

module.exports = SentrySetup;