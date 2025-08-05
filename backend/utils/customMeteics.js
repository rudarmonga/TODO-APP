const Sentry = require('@sentry/node');

class CustomMetrics {
  constructor() {
    this.metrics = {
      userEngagement: {
        activeUsers: 0,
        newRegistrations: 0,
        loginAttempts: 0,
        successfulLogins: 0,
      },
      todoOperations: {
        todosCreated: 0,
        todosCompleted: 0,
        todosDeleted: 0,
        todosUpdated: 0,
      },
      performance: {
        averageResponseTime: 0,
        totalRequests: 0,
        slowRequests: 0,
      },
      business: {
        dailyActiveUsers: new Set(),
        weeklyActiveUsers: new Set(),
        monthlyActiveUsers: new Set(),
      },
    };
    
    this.startPeriodicReporting();
  }

  trackUserEngagement(action, userId = null) {
    switch (action) {
      case 'registration':
        this.metrics.userEngagement.newRegistrations++;
        this.addToActiveUsers(userId);
        break;
      case 'login_attempt':
        this.metrics.userEngagement.loginAttempts++;
        break;
      case 'successful_login':
        this.metrics.userEngagement.successfulLogins++;
        this.addToActiveUsers(userId);
        break;
      case 'active_user':
        this.addToActiveUsers(userId);
        break;
    }

    this.reportToSentry('user_engagement', action, { userId });
  }

  trackTodoOperation(action, todoId = null, userId = null) {
    switch (action) {
      case 'create':
        this.metrics.todoOperations.todosCreated++;
        break;
      case 'complete':
        this.metrics.todoOperations.todosCompleted++;
        break;
      case 'delete':
        this.metrics.todoOperations.todosDeleted++;
        break;
      case 'update':
        this.metrics.todoOperations.todosUpdated++;
        break;
    }

    this.reportToSentry('todo_operation', action, { todoId, userId });
  }

  trackPerformance(action, data = {}) {
    switch (action) {
      case 'request':
        this.metrics.performance.totalRequests++;
        if (data.responseTime) {
          this.updateAverageResponseTime(data.responseTime);
        }
        break;
      case 'slow_request':
        this.metrics.performance.slowRequests++;
        break;
    }

    this.reportToSentry('performance', action, data);
  }

  addToActiveUsers(userId) {
    if (userId) {
      const now = new Date();
      this.metrics.business.dailyActiveUsers.add(userId);
      this.metrics.business.weeklyActiveUsers.add(userId);
      this.metrics.business.monthlyActiveUsers.add(userId);
    }
  }

  updateAverageResponseTime(newResponseTime) {
    const current = this.metrics.performance.averageResponseTime;
    const count = this.metrics.performance.totalRequests;
    
    this.metrics.performance.averageResponseTime = 
      (current * (count - 1) + newResponseTime) / count;
  }

  reportToSentry(category, action, data) {
    Sentry.addBreadcrumb({
      category: category,
      message: `${category}: ${action}`,
      level: 'info',
      data: {
        action: action,
        ...data,
        timestamp: new Date().toISOString(),
      },
    });
  }

  getMetrics() {
    return {
      userEngagement: {
        ...this.metrics.userEngagement,
        dailyActiveUsers: this.metrics.business.dailyActiveUsers.size,
        weeklyActiveUsers: this.metrics.business.weeklyActiveUsers.size,
        monthlyActiveUsers: this.metrics.business.monthlyActiveUsers.size,
      },
      todoOperations: this.metrics.todoOperations,
      performance: this.metrics.performance,
    };
  }

  startPeriodicReporting() {
    setInterval(() => {
      this.reportHourlyMetrics();
    }, 60 * 60 * 1000);

    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  reportHourlyMetrics() {
    const metrics = this.getMetrics();
    
    Sentry.captureMessage('Hourly Metrics Report', {
      level: 'info',
      tags: {
        report_type: 'hourly_metrics',
      },
      extra: {
        metrics: metrics,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('📊 Hourly Metrics Report:', metrics);
  }

  cleanupOldData() {

    this.metrics.business.dailyActiveUsers.clear();
    
  }
}

module.exports = CustomMetrics;