import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import Login from './components/Login';
import Register from './components/Register';
import TodoList from './components/TodoList';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <TodoProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="container">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/todos" 
                  element={
                    <PrivateRoute>
                      <TodoList />
                    </PrivateRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/todos" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TodoProvider>
    </AuthProvider>
  );
}

export default App;