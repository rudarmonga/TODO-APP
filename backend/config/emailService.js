const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const config = this.getEmailConfig();
    
    if (config.host && config.port) {
      this.transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure, 
        auth: {
          user: config.user,
          pass: config.password,
        },
      });
      
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } else {
      console.log('⚠️ Email service not configured - using console fallback');
    }
  }

  getEmailConfig() {
    if (process.env.NODE_ENV === 'production') {
      return {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
      };
    } else {
      return {};
    }
  }

  async sendEmail(to, subject, body, htmlBody = null) {
    if (!this.isConfigured) {
      console.log('�� Email Notification:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', body);
      return { success: true, method: 'console' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: body,
        html: htmlBody || body,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendAlertEmail(alertType, data) {
    const emailContent = this.formatAlertEmail(alertType, data);
    
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [process.env.ALERT_EMAIL];
    
    for (const recipient of recipients) {
      await this.sendEmail(
        recipient.trim(),
        emailContent.subject,
        emailContent.text,
        emailContent.html
      );
    }
  }

  formatAlertEmail(alertType, data) {
    const templates = {
      errorRate: {
        subject: '🚨 CRITICAL: High Error Rate Detected',
        text: `Error rate has exceeded 5% (${(data.errorRate * 100).toFixed(2)}%)\n\nAction Required: Investigate immediately\nEnvironment: ${process.env.NODE_ENV}\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <h2 style="color: #ff0000;">🚨 CRITICAL: High Error Rate Detected</h2>
          <p><strong>Error Rate:</strong> ${(data.errorRate * 100).toFixed(2)}%</p>
          <p><strong>Action Required:</strong> Investigate immediately</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      },
      
      authFailures: {
        subject: '🔐 WARNING: High Authentication Failures',
        text: `${data.count} authentication failures in the last hour\n\nAction Required: Check for potential security issues\nEnvironment: ${process.env.NODE_ENV}\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <h2 style="color: #ffa500;">🔐 WARNING: High Authentication Failures</h2>
          <p><strong>Failures:</strong> ${data.count} in the last hour</p>
          <p><strong>Action Required:</strong> Check for potential security issues</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      },
      
      slowRequests: {
        subject: '🐌 WARNING: Slow Request Performance',
        text: `Requests taking longer than ${data.threshold}ms detected\n\nAction Required: Investigate performance bottlenecks\nEnvironment: ${process.env.NODE_ENV}\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <h2 style="color: #ffa500;">🐌 WARNING: Slow Request Performance</h2>
          <p><strong>Threshold:</strong> ${data.threshold}ms</p>
          <p><strong>Action Required:</strong> Investigate performance bottlenecks</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      },
    };

    return templates[alertType] || {
      subject: '⚠️ Alert',
      text: 'Unknown alert type',
      html: '<h2>⚠️ Alert</h2><p>Unknown alert type</p>',
    };
  }
}

module.exports = EmailService;