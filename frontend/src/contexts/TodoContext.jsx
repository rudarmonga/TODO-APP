import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TodoContext = createContext();

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTodos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/todos`);
      setTodos(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch todos when user changes
  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
      setError(null);
    }
  }, [user]);

  const createTodo = async (title) => {
    try {
      setError(null);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/todos`, { title });
      setTodos(prev => [response.data.data, ...prev]);
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create todo');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create todo' 
      };
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      setError(null);
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/todos/${id}`, updates);
      setTodos(prev => prev.map(todo => 
        todo._id === id ? response.data.data : todo
      ));
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update todo');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update todo' 
      };
    }
  };

  const deleteTodo = async (id) => {
    try {
      setError(null);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/todos/${id}`);
      setTodos(prev => prev.filter(todo => todo._id !== id));
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete todo');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete todo' 
      };
    }
  };

  const value = {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};