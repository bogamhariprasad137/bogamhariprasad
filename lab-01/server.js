// ==============================================================================
// File: server.js
// Lab 1: Express Server with REST Endpoints and Error Handling
// Course: Backend Development Fundamentals
// Faculty: Mr Sai Siva Teja Chintakrindi | Institution: Aurora
// ==============================================================================

// Import express framework
const express = require('express');

// Initialize the Express application
const app = express();

// Configure the port to use process.env.PORT (for cloud deployment) or default to 3000 (local)
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------------------
// Task 4: API Endpoints
// ------------------------------------------------------------------------------

// Route 1: GET /
// Purpose: Return a welcome message for the Backend Development Lab 1
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Backend Development Lab 1');
});

// Route 2: GET /about
// Purpose: Return JSON containing student details
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Bogam Hari Prasad',
    section: 'CSE-2A',
    course: 'Backend Development Fundamentals'
  });
});

// Route 3: GET /time
// Purpose: Return the current date and time using new Date()
app.get('/time', (req, res) => {
  const currentDateTime = new Date();
  res.status(200).json({
    currentTime: currentDateTime.toString()
  });
});

// ------------------------------------------------------------------------------
// Task 5: Error Handling Middleware
// ------------------------------------------------------------------------------

// Catch-all middleware for handling undefined / unknown routes (404 Not Found)
// NOTE: This must be defined AFTER all valid route handlers so unmatched requests reach here.
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});

// ------------------------------------------------------------------------------
// Task 3: Start Application
// ------------------------------------------------------------------------------

// Start the server using app.listen()
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
