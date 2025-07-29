const Todo = require('../models/Todo');
const { AppError } = require('../utils/errorHandler');
const { catchAsync } = require('../middleware/errorMiddleware');
const Sentry = require('@sentry/node');

exports.getTodos = catchAsync(async (req, res, next) => {
    Sentry.setUser({
        id: req.user._id.toString(),
        email: req.user.email,
      });
      
      Sentry.setContext('todo', {
        action: 'get_all',
        userId: req.user._id,
        userAgent: req.get('User-Agent'),
      });
    
    const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    Sentry.addBreadcrumb({
        category: 'todo',
        message: 'Todos retrieved successfully',
        level: 'info',
        data: {
          count: todos.length,
          userId: req.user._id,
        },
      });

    res.json({
      success: true,
      count: todos.length,
      data: todos
    });
});

exports.createTodo = catchAsync(async (req, res, next) => {
    const { title } = req.body;
    
    Sentry.setUser({
        id: req.user._id.toString(),
        email: req.user.email,
      });
      
      Sentry.setContext('todo', {
        action: 'create',
        userId: req.user._id,
        title: title,
        userAgent: req.get('User-Agent'),
      });

    if (!title || title.trim().length === 0) {
        Sentry.captureException(new Error('Todo creation failed - empty title'), {
            tags: {
              action: 'create_todo',
              error_type: 'empty_title',
            },
          });
          
      return next(new AppError('Todo title is required', 400));
    }
  
    const newTodo = new Todo({ 
      title: title.trim(), 
      user: req.user._id 
    });
    const savedTodo = await newTodo.save();
    
    Sentry.addBreadcrumb({
        category: 'todo',
        message: 'Todo created successfully',
        level: 'info',
        data: {
          todoId: savedTodo._id,
          title: savedTodo.title,
          userId: req.user._id,
        },
      });
  
    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: savedTodo
    });
});

exports.updateTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    Sentry.setUser({
        id: req.user._id.toString(),
        email: req.user.email,
      });
      
      Sentry.setContext('todo', {
        action: 'update',
        userId: req.user._id,
        todoId: id,
        updateData: updateData,
        userAgent: req.get('User-Agent'),
      });
    
    if(updateData.title !== undefined && updateData.title.trim().length === 0) {
        Sentry.captureException(new Error('Todo update failed - empty title'), {
            tags: {
              action: 'update_todo',
              error_type: 'empty_title',
              todoId: id,
            },
        });
          
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
        Sentry.captureException(new Error('Todo update failed - not found or no permission'), {
            tags: {
              action: 'update_todo',
              error_type: 'not_found_or_no_permission',
              todoId: id,
            },
          });
          
        return next(new AppError('Todo not found or you do not have permission to update it', 404));
    }

    Sentry.addBreadcrumb({
        category: 'todo',
        message: 'Todo updated successfully',
        level: 'info',
        data: {
          todoId: todo._id,
          title: todo.title,
          userId: req.user._id,
        },
      });

    res.json({
        success: true,
        message: 'Todo updated successfully',
        data: todo,
    });
});

exports.deleteTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    Sentry.setUser({
        id: req.user._id.toString(),
        email: req.user.email,
      });
      
      Sentry.setContext('todo', {
        action: 'delete',
        userId: req.user._id,
        todoId: id,
        userAgent: req.get('User-Agent'),
      });

    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user._id });

    if (!todo) {
        Sentry.captureException(new Error('Todo deletion failed - not found or no permission'), {
            tags: {
              action: 'delete_todo',
              error_type: 'not_found_or_no_permission',
              todoId: id,
            },
          });
          
        return next(new AppError('Todo not found or you do not have permission to delete it', 404));
    }

    Sentry.addBreadcrumb({
        category: 'todo',
        message: 'Todo deleted successfully',
        level: 'info',
        data: {
          todoId: id,
          title: todo.title,
          userId: req.user._id,
        },
      });

    res.json({
        success: true,
        message: 'Todo deleted successfully',
    });
});

exports.getTodo = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    Sentry.setUser({
        id: req.user._id.toString(),
        email: req.user.email,
      });
      
      Sentry.setContext('todo', {
        action: 'get_single',
        userId: req.user._id,
        todoId: id,
        userAgent: req.get('User-Agent'),
      });
    
    const todo = await Todo.findOne({ _id: id, user: req.user._id });

    if (!todo) {
        Sentry.captureException(new Error('Todo retrieval failed - not found or no permission'), {
            tags: {
              action: 'get_todo',
              error_type: 'not_found_or_no_permission',
              todoId: id,
            },
          });
          
        return next(new AppError('Todo not found or you do not have permission to access it', 404));
    }

    Sentry.addBreadcrumb({
        category: 'todo',
        message: 'Todo retrieved successfully',
        level: 'info',
        data: {
          todoId: id,
          title: todo.title,
          userId: req.user._id,
        },
      });

    res.json({
        success: true,
        data: todo,
    });
});