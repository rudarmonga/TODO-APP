const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const Todo = require('../models/Todo');
const { catchAsync } = require('../middleware/errorMiddleware');
const Sentry = require('@sentry/node');

// Get user profile
const getProfile = catchAsync(async (req, res) => {
  let profile = await UserProfile.findOne({ user: req.user._id }).populate('user', 'email');
  
  if (!profile) {
    // Create default profile if it doesn't exist
    profile = await UserProfile.create({
      user: req.user._id,
      displayName: req.user.email.split('@')[0], // Use email prefix as display name
    });
  }

  // Update last active
  profile.stats.lastActive = new Date();
  await profile.save();

  Sentry.setUser({
    id: req.user._id.toString(),
    email: req.user.email,
  });

  Sentry.addBreadcrumb({
    category: 'profile',
    message: 'User profile retrieved',
    level: 'info',
  });

  res.status(200).json({
    success: true,
    data: profile,
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const {
    firstName,
    lastName,
    displayName,
    bio,
    phone,
    location,
    website,
    preferences,
    socialLinks,
    privacy,
  } = req.body;

  let profile = await UserProfile.findOne({ user: req.user._id });
  
  if (!profile) {
    profile = new UserProfile({ user: req.user._id });
  }

  // Update fields if provided
  if (firstName !== undefined) profile.firstName = firstName;
  if (lastName !== undefined) profile.lastName = lastName;
  if (displayName !== undefined) profile.displayName = displayName;
  if (bio !== undefined) profile.bio = bio;
  if (phone !== undefined) profile.phone = phone;
  if (location !== undefined) profile.location = location;
  if (website !== undefined) profile.website = website;
  if (preferences !== undefined) profile.preferences = { ...profile.preferences, ...preferences };
  if (socialLinks !== undefined) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
  if (privacy !== undefined) profile.privacy = { ...profile.privacy, ...privacy };

  await profile.save();

  Sentry.addBreadcrumb({
    category: 'profile',
    message: 'User profile updated',
    level: 'info',
  });

  res.status(200).json({
    success: true,
    data: profile,
    message: 'Profile updated successfully',
  });
});

// Get user statistics
const getStats = catchAsync(async (req, res) => {
  const [todoStats, profile] = await Promise.all([
    Todo.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
          pendingTodos: { $sum: { $cond: ['$completed', 0, 1] } },
        },
      },
    ]),
    UserProfile.findOne({ user: req.user._id }),
  ]);

  const stats = todoStats[0] || { totalTodos: 0, completedTodos: 0, pendingTodos: 0 };
  
  // Update profile stats
  if (profile) {
    profile.stats.totalTodos = stats.totalTodos;
    profile.stats.completedTodos = stats.completedTodos;
    profile.stats.lastActive = new Date();
    await profile.save();
  }

  // Calculate additional stats
  const completionRate = stats.totalTodos > 0 ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0;
  const streakDays = profile?.stats.streakDays || 0;

  Sentry.addBreadcrumb({
    category: 'stats',
    message: 'User statistics retrieved',
    level: 'info',
  });

  res.status(200).json({
    success: true,
    data: {
      ...stats,
      completionRate,
      streakDays,
      lastActive: profile?.stats.lastActive || new Date(),
    },
  });
});

// Update avatar
const updateAvatar = catchAsync(async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    return res.status(400).json({
      success: false,
      message: 'Avatar URL is required',
    });
  }

  let profile = await UserProfile.findOne({ user: req.user._id });
  
  if (!profile) {
    profile = new UserProfile({ user: req.user._id });
  }

  profile.avatar = avatarUrl;
  await profile.save();

  Sentry.addBreadcrumb({
    category: 'profile',
    message: 'User avatar updated',
    level: 'info',
  });

  res.status(200).json({
    success: true,
    data: { avatar: avatarUrl },
    message: 'Avatar updated successfully',
  });
});

// Update preferences
const updatePreferences = catchAsync(async (req, res) => {
  const { preferences } = req.body;

  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Preferences object is required',
    });
  }

  let profile = await UserProfile.findOne({ user: req.user._id });
  
  if (!profile) {
    profile = new UserProfile({ user: req.user._id });
  }

  profile.preferences = { ...profile.preferences, ...preferences };
  await profile.save();

  Sentry.addBreadcrumb({
    category: 'preferences',
    message: 'User preferences updated',
    level: 'info',
  });

  res.status(200).json({
    success: true,
    data: profile.preferences,
    message: 'Preferences updated successfully',
  });
});

// Delete profile
const deleteProfile = catchAsync(async (req, res) => {
  const profile = await UserProfile.findOneAndDelete({ user: req.user._id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
  }

  Sentry.addBreadcrumb({
    category: 'profile',
    message: 'User profile deleted',
    level: 'warning',
  });

  res.status(200).json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

// Get public profile (for other users)
const getPublicProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const profile = await UserProfile.findOne({ user: userId })
    .populate('user', 'email')
    .select('-privacy -account -stats');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
  }

  // Check privacy settings
  if (profile.privacy.profileVisibility === 'private') {
    return res.status(403).json({
      success: false,
      message: 'Profile is private',
    });
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getStats,
  updateAvatar,
  updatePreferences,
  deleteProfile,
  getPublicProfile,
}; 