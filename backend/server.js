const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
// Load environment variables from .env file
dotenv.config();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes

// API Routes (to be expanded for Google Sheets integration)
app.use('/api', require('./routes/api'));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});
