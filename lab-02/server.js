// ==============================================================================
// File: server.js
// Lab 2: SQLite Database and CRUD Routes
// Course: Backend Development Fundamentals
// Student: Bogam Hari Prasad | Reg No: 252U1R1036 | Section: CSE-2A
// Faculty: Mr Sai Siva Teja Chintakrindi | Institution: Aurora Deemed to be University
// ==============================================================================

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// Initialize the Express application
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Absolute path to the SQLite database file
const dbPath = path.join(__dirname, 'books.db');

// Server port: uses environment variable or defaults to 3000
const PORT = process.env.PORT || 3000;

// Variables to store database connection and server instances
let db = null;
let server = null;

// ==============================================================================
// Helper Validation Functions
// ==============================================================================

// Validates that an ID is a valid positive integer
const isValidId = (id) => {
  const parsed = parseInt(id, 10);
  return !isNaN(parsed) && parsed > 0 && String(parsed) === String(id).trim();
};

// Validates the book payload (title, author, price, pages)
const validateBookPayload = (body) => {
  const { title, author, price, pages } = body;

  if (typeof title !== 'string' || title.trim().length === 0) {
    return { valid: false, message: "Field 'title' must be a non-empty string." };
  }

  if (typeof author !== 'string' || author.trim().length === 0) {
    return { valid: false, message: "Field 'author' must be a non-empty string." };
  }

  if (!Number.isInteger(price) || price <= 0) {
    return { valid: false, message: "Field 'price' must be a positive integer." };
  }

  if (!Number.isInteger(pages) || pages <= 0) {
    return { valid: false, message: "Field 'pages' must be a positive integer." };
  }

  return { valid: true };
};

// ==============================================================================
// API Endpoints
// ==============================================================================

// Root Route (Welcome message)
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Lab 2: SQLite Database and CRUD API');
});

// ------------------------------------------------------------------------------
// Endpoint 1: GET /books/
// Purpose: Retrieve all books from the database
// Expected Status: 200 OK
// ------------------------------------------------------------------------------
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `SELECT * FROM book;`;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 2: GET /books/:bookId/
// Purpose: Retrieve a single book by its ID
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found
// ------------------------------------------------------------------------------
app.get('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. ID must be a positive integer.' });
  }

  try {
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [parseInt(bookId, 10)]);

    if (!book) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found.` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 3: POST /books/
// Purpose: Add a new book to the database
// Expected Status: 201 Created | 400 Bad Request
// ------------------------------------------------------------------------------
app.post('/books/', async (req, res) => {
  // Validate request body fields
  const validation = validateBookPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const { title, author, price, pages } = req.body;

  try {
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages
    ]);

    // Retrieve the newly inserted book record using result.lastID
    const getNewBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const newBook = await db.get(getNewBookQuery, [result.lastID]);

    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 4: PUT /books/:bookId/
// Purpose: Update an existing book's details
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found
// ------------------------------------------------------------------------------
app.put('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. ID must be a positive integer.' });
  }

  // Validate request body fields
  const validation = validateBookPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const parsedId = parseInt(bookId, 10);
  const { title, author, price, pages } = req.body;

  try {
    // Check if the book exists first
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found.` });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      parsedId
    ]);

    // Retrieve and return the updated book record
    const updatedBook = await db.get(checkBookQuery, [parsedId]);
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 5: DELETE /books/:bookId/
// Purpose: Delete an existing book from the database
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found
// ------------------------------------------------------------------------------
app.delete('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. ID must be a positive integer.' });
  }

  const parsedId = parseInt(bookId, 10);

  try {
    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    const result = await db.run(deleteBookQuery, [parsedId]);

    // Check if any row was affected
    if (result.changes === 0) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found.` });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------
// 404 Catch-All Middleware for undefined routes
// ------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist.`
  });
});

// ==============================================================================
// Database and Server Initialization Function
// Placed at the very bottom of server.js after all routes and middleware
// ==============================================================================
const initializeDBAndServer = async () => {
  try {
    // 1. Open SQLite database connection using 'sqlite' wrapper and 'sqlite3' driver
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connected successfully.');

    // 2. Start Express server only after database connection succeeds and store instance
    server = app.listen(PORT, () => {
      console.log(`Express server is running on http://localhost:${PORT}/`);
    });
  } catch (error) {
    // Handle database initialization errors and terminate process with non-zero exit code
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

// Invoke the initialization function at the very bottom
initializeDBAndServer();
