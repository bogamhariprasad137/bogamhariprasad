// ==============================================================================
// File: server-http.js
// Lab 1: Native HTTP Server using Node.js built-in 'http' module
// Course: Backend Development Fundamentals
// Faculty: Mr Sai Siva Teja Chintakrindi | Institution: Aurora
// ==============================================================================

// Import the built-in HTTP module provided by Node.js (no npm package required)
const http = require('http');

// Define the port number on which the server will listen
const PORT = 3000;

// Create the HTTP server using http.createServer()
// The callback function is invoked every time an incoming request hits the server.
// 'req' (Request object) contains information about the incoming HTTP request.
// 'res' (Response object) is used to send data back to the client.
const server = http.createServer((req, res) => {
  // Set the HTTP status code to 200 (OK) and headers (plain text format)
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  // Send the response body and complete the request-response cycle
  res.end('Hello');
});

// Start the server and listen on port 3000
server.listen(PORT, () => {
  console.log(`Native HTTP server is running on http://localhost:${PORT}`);
});
