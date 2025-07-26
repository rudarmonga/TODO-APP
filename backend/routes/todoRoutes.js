const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateTodo, handleValidationErrors } = require('../middleware/validationMiddleware');

router.use(authMiddleware);

router.get('/', todoController.getTodos);
router.post('/', validateTodo, handleValidationErrors, todoController.createTodo);
router.put('/:id', validateTodo, handleValidationErrors, todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);
router.get('/:id', todoController.getTodo);

module.exports = router;