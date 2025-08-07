const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Personal Information
  firstName: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  avatar: {
    type: String,
    default: null,
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  website: {
    type: String,
    trim: true,
  },
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    todoReminders: {
      type: Boolean,
      default: true,
    },
  },
  
  // Statistics
  stats: {
    totalTodos: {
      type: Number,
      default: 0,
    },
    completedTodos: {
      type: Number,
      default: 0,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  
  // Social
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    instagram: String,
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private',
    },
    showStats: {
      type: Boolean,
      default: false,
    },
    allowMessages: {
      type: Boolean,
      default: false,
    },
  },
  
  // Account Settings
  account: {
    emailVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    accountCreated: {
      type: Date,
      default: Date.now,
    },
  },
}, {
  timestamps: true,
});

// Index for better query performance
userProfileSchema.index({ user: 1 });
userProfileSchema.index({ 'preferences.theme': 1 });
userProfileSchema.index({ 'stats.lastActive': 1 });

// Virtual for full name
userProfileSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName || 'Anonymous';
});

// Virtual for completion rate
userProfileSchema.virtual('completionRate').get(function() {
  if (this.stats.totalTodos === 0) return 0;
  return Math.round((this.stats.completedTodos / this.stats.totalTodos) * 100);
});

// Method to update stats
userProfileSchema.methods.updateStats = function(todoCount, completedCount) {
  this.stats.totalTodos = todoCount;
  this.stats.completedTodos = completedCount;
  this.stats.lastActive = new Date();
  return this.save();
};

// Method to update streak
userProfileSchema.methods.updateStreak = function(hasActivityToday) {
  if (hasActivityToday) {
    this.stats.streakDays += 1;
  } else {
    this.stats.streakDays = 0;
  }
  return this.save();
};

// Pre-save middleware to set display name if not provided
userProfileSchema.pre('save', function(next) {
  if (!this.displayName && (this.firstName || this.lastName)) {
    this.displayName = this.fullName;
  }
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema); 