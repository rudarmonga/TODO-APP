const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateUser, handleValidationErrors } = require('../middleware/validationMiddleware');

router.post('/register', validateUser, handleValidationErrors, register);
router.post('/login', validateUser, handleValidationErrors, login);

module.exports = router;