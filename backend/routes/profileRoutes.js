const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getStats,
  updateAvatar,
  updatePreferences,
  deleteProfile,
  getPublicProfile,
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateProfile, handleValidationErrors } = require('../middleware/validationMiddleware');

// Apply authentication to all profile routes
router.use(authMiddleware);

// Get current user's profile
router.get('/me', getProfile);

// Update current user's profile
router.put('/me', validateProfile, handleValidationErrors, updateProfile);

// Get user statistics
router.get('/stats', getStats);

// Update avatar
router.put('/avatar', updateAvatar);

// Update preferences
router.put('/preferences', updatePreferences);

// Delete profile
router.delete('/me', deleteProfile);

// Get public profile (for other users)
router.get('/:userId', getPublicProfile);

module.exports = router; 