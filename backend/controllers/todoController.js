const Todo = require('../models/Todo');
const { AppError } = require('../utils/errorHandler');
const { catchAsync } = require('../middleware/errorMiddleware');

exports.getTodos = catchAsync(async (req, res, next) => {
    const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: todos.length,
      data: todos
    });
});

exports.createTodo = catchAsync(async (req, res, next) => {
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return next(new AppError('Todo title is required', 400));
    }
  
    const newTodo = new Todo({ 
      title: title.trim(), 
      user: req.user._id 
    });
    const savedTodo = await newTodo.save();
    
    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: savedTodo
    });
});

exports.updateTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    if(updateData.title !== undefined && updateData.title.trim().length === 0) {
        return next(new AppError('Todo title cannot be empty', 400));
    }

    const todo = await Todo.findOneAndUpdate(
        { _id: id, user: req.user._id },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!todo) {
        return next(new AppError('Todo not found or you do not have permission to update it', 404));
    }

    res.json({
        success: true,
        message: 'Todo updated successfully',
        data: todo,
    });
});

exports.deleteTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user._id });

    if (!todo) {
        return next(new AppError('Todo not found or you do not have permission to delete it', 404));
    }

    res.json({
        success: true,
        message: 'Todo deleted successfully',
    });
});

exports.getTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const todo = await Todo.findOne({ _id: id, user: req.user._id });

    if (!todo) {
        return next(new AppError('Todo not found or you do not have permission to access it', 404));
    }

    res.json({
        success: true,
        data: todo,
    });
});