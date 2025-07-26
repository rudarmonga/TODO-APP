const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const { catchAsync } = require('../middleware/errorMiddleware');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }
  
    const user = new User({ email, password });
    await user.save();
  
    const token = generateToken(user._id);
    
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
  
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
  
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
  
    const token = generateToken(user._id);
    
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