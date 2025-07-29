const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const { catchAsync } = require('../middleware/errorMiddleware');
const Sentry = require('@sentry/node');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    Sentry.setContext('auth', {
      action: 'register',
      email: email,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    const existingUser = await User.findOne({ email });
  if (existingUser) {
    Sentry.captureException(new Error('User registration failed - email already exists'), {
      tags: {
        action: 'register',
        error_type: 'duplicate_email',
      },
      extra: {
        email: email,
        timestamp: new Date().toISOString(),
      },
    });
    
    return next(new AppError('User with this email already exists', 400));
  }
    const user = new User({ email, password });
    await user.save();
  
    const token = generateToken(user._id);
    
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'User registered successfully',
      level: 'info',
      data: {
        userId: user._id,
        email: user.email,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  });

  exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
  
    Sentry.setContext('auth', {
      action: 'login',
      email: email,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    if (!email || !password) {
      Sentry.captureException(new Error('Login failed - missing credentials'), {
        tags: {
          action: 'login',
          error_type: 'missing_credentials',
        },
      });
      
      return next(new AppError('Please provide email and password', 400));
    }
  
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      Sentry.captureException(new Error('Login failed - invalid credentials'), {
        tags: {
          action: 'login',
          error_type: 'invalid_credentials',
        },
        extra: {
          email: email,
          timestamp: new Date().toISOString(),
        },
      });
      
      return next(new AppError('Incorrect email or password', 401));
    }
  
    const token = generateToken(user._id);
    
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'User logged in successfully',
      level: 'info',
      data: {
        userId: user._id,
        email: user.email,
      },
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  });