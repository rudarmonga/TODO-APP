class WebhookConfig {
    constructor() {
      this.webhooks = {
        slack: this.getSlackWebhook(),
        teams: this.getTeamsWebhook(),
        discord: this.getDiscordWebhook(),
        custom: this.getCustomWebhooks(),
      };
    }
  
    getSlackWebhook() {
      const webhookUrl = process.env.SENTRY_SLACK_WEBHOOK_URL;
      const channel = process.env.SLACK_CHANNEL || '#alerts';
      const username = process.env.SLACK_USERNAME || 'Todo App Alerts';
      
      return {
        url: webhookUrl,
        channel: channel,
        username: username,
        enabled: !!webhookUrl,
      };
    }
  
    getTeamsWebhook() {
      const webhookUrl = process.env.SENTRY_TEAMS_WEBHOOK_URL;
      const title = process.env.TEAMS_TITLE || 'Todo App Alerts';
      
      return {
        url: webhookUrl,
        title: title,
        enabled: !!webhookUrl,
      };
    }
  
    getDiscordWebhook() {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      const username = process.env.DISCORD_USERNAME || 'Todo App Alerts';
      
      return {
        url: webhookUrl,
        username: username,
        enabled: !!webhookUrl,
      };
    }
  
    getCustomWebhooks() {
      const customWebhooks = [];
      
      for (let i = 1; i <= 5; i++) {
        const webhookUrl = process.env[`CUSTOM_WEBHOOK_URL_${i}`];
        const webhookName = process.env[`CUSTOM_WEBHOOK_NAME_${i}`];
        
        if (webhookUrl && webhookName) {
          customWebhooks.push({
            url: webhookUrl,
            name: webhookName,
            enabled: true,
          });
        }
      }
      
      return customWebhooks;
    }

    validateWebhooks() {
      const validation = {
        slack: this.webhooks.slack.enabled,
        teams: this.webhooks.teams.enabled,
        discord: this.webhooks.discord.enabled,
        custom: this.webhooks.custom.length > 0,
        email: !!process.env.EMAIL_HOST,
      };
  
      const enabledCount = Object.values(validation).filter(Boolean).length;
      
      console.log('📡 Webhook Configuration:');
      console.log('- Slack:', validation.slack ? '✅' : '❌');
      console.log('- Teams:', validation.teams ? '✅' : '❌');
      console.log('- Discord:', validation.discord ? '✅' : '❌');
      console.log('- Custom Webhooks:', validation.custom ? '✅' : '❌');
      console.log('- Email:', validation.email ? '✅' : '❌');
      console.log(`Total enabled: ${enabledCount}/5`);
  
      return validation;
    }

    getEnabledWebhooks() {
      const enabled = {};
      
      if (this.webhooks.slack.enabled) {
        enabled.slack = this.webhooks.slack;
      }
      
      if (this.webhooks.teams.enabled) {
        enabled.teams = this.webhooks.teams;
      }
      
      if (this.webhooks.discord.enabled) {
        enabled.discord = this.webhooks.discord;
      }
      
      if (this.webhooks.custom.length > 0) {
        enabled.custom = this.webhooks.custom;
      }
  
      return enabled;
    }
  }
  
  module.exports = WebhookConfig;