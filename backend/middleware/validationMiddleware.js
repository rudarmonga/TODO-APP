const { body, validationResult } = require('express-validator');

const validateUser = [
    body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const validateTodo = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters')
        .escape(),
    body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
];


const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
            }))
        });
    }
    next();
};

module.exports = {
    validateUser,
    validateTodo,
    handleValidationErrors,
};