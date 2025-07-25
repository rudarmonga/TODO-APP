require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


const todoRoutes = require('./routes/todoRoutes');
app.use('/api/todos', todoRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});