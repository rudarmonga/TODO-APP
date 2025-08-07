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

const validateProfile = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('First name must be less than 50 characters')
        .escape(),
    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Last name must be less than 50 characters')
        .escape(),
    body('displayName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Display name must be less than 100 characters')
        .escape(),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters')
        .escape(),
    body('phone')
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage('Invalid phone number format'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters')
        .escape(),
    body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid website URL'),
    body('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Theme must be light, dark, or auto'),
    body('preferences.language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Language code must be between 2 and 5 characters'),
    body('socialLinks.github')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid GitHub URL'),
    body('socialLinks.linkedin')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid LinkedIn URL'),
    body('socialLinks.twitter')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid Twitter URL'),
    body('socialLinks.instagram')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid Instagram URL'),
    body('privacy.profileVisibility')
        .optional()
        .isIn(['public', 'private', 'friends'])
        .withMessage('Profile visibility must be public, private, or friends'),
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
    validateProfile,
    handleValidationErrors,
};