const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Sentry = require('@sentry/node');

const authMiddleware = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                Sentry.setContext('auth', {
                  action: 'middleware_verification',
                  error_type: 'user_not_found',
                  token_present: true,
                  userAgent: req.get('User-Agent'),
                  ip: req.ip,
                });
                
                throw new Error('User not found');
              }
              
              Sentry.setUser({
                id: req.user._id.toString(),
                email: req.user.email,
              });
              
              Sentry.addBreadcrumb({
                category: 'auth',
                message: 'User authenticated successfully',
                level: 'info',
                data: {
                  userId: req.user._id,
                  email: req.user.email,
                },
              });
              
              next();
        } catch (error) {
            Sentry.setContext('auth', {
                action: 'middleware_verification',
                error_type: error.name,
                token_present: true,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
              });
              
              Sentry.captureException(error, {
                tags: {
                  action: 'auth_middleware',
                  error_type: error.name,
                },
              });
              
            next(error);
        }
    } else {
        Sentry.setContext('auth', {
          action: 'middleware_verification',
          error_type: 'no_token',
          token_present: false,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
        
        Sentry.captureException(new Error('Authentication failed - no token provided'), {
          tags: {
            action: 'auth_middleware',
            error_type: 'no_token',
          },
        });
        
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = authMiddleware;