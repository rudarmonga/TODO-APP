import { useState } from 'react';
import { useTodos } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';
import './TodoList.css';

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const { todos, loading, error, createTodo, updateTodo, deleteTodo } = useTodos();
  const { user } = useAuth();

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const result = await createTodo(newTodo.trim());
    if (result.success) {
      setNewTodo('');
    }
  };

  const handleToggleComplete = async (todo) => {
    await updateTodo(todo._id, { title: todo.title, complete: !todo.complete });
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      await deleteTodo(id);
    }
  };

  if (loading) {
    return <div className="loading">Loading todos...</div>;
  }

  return (
    <div className="todo-container">
      <h1>My Todos</h1>
      {user && <p className="user-info">Welcome, {user.email}!</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleCreateTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>
      
      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="no-todos">No todos yet. Add one above!</p>
        ) : (
          todos.map(todo => (
            <div key={todo._id} className={`todo-item ${todo.complete ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.complete}
                onChange={() => handleToggleComplete(todo)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.title}</span>
              <button
                onClick={() => handleDeleteTodo(todo._id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;