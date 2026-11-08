// ==============================================================================
// File: server.js
// Lab 3: REST API, Query Parameters, Validation and Debugging
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

// Validates the book payload for POST (required: title, author, price; optional: pages)
const validateCreateBookPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, message: 'Request body must be a valid JSON object.' };
  }

  const { title, author, price, pages } = body;

  // Title validation: must be a non-empty string
  if (title === undefined || title === null) {
    return { valid: false, message: "Field 'title' is required." };
  }
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { valid: false, message: "Field 'title' must be a non-empty string." };
  }

  // Author validation: must be a non-empty string
  if (author === undefined || author === null) {
    return { valid: false, message: "Field 'author' is required." };
  }
  if (typeof author !== 'string' || author.trim().length === 0) {
    return { valid: false, message: "Field 'author' must be a non-empty string." };
  }

  // Price validation: must be numeric and not negative
  if (price === undefined || price === null) {
    return { valid: false, message: "Field 'price' is required." };
  }
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, message: "Field 'price' must be a valid number." };
  }
  if (price < 0) {
    return { valid: false, message: "Field 'price' cannot be negative." };
  }

  // Pages validation (if provided)
  if (pages !== undefined && pages !== null) {
    if (!Number.isInteger(pages) || pages <= 0) {
      return { valid: false, message: "Field 'pages' must be a positive integer." };
    }
  }

  return { valid: true };
};

// Validates the book payload for PUT (updating an existing book)
const validateUpdateBookPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, message: 'Request body must be a valid JSON object.' };
  }

  const { title, author, price, pages } = body;

  // At least one field should be provided for an update
  if (title === undefined && author === undefined && price === undefined && pages === undefined) {
    return { valid: false, message: 'At least one field (title, author, price, pages) must be provided to update.' };
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return { valid: false, message: "Field 'title' must be a non-empty string." };
    }
  }

  if (author !== undefined) {
    if (typeof author !== 'string' || author.trim().length === 0) {
      return { valid: false, message: "Field 'author' must be a non-empty string." };
    }
  }

  if (price !== undefined) {
    if (typeof price !== 'number' || isNaN(price)) {
      return { valid: false, message: "Field 'price' must be a valid number." };
    }
    if (price < 0) {
      return { valid: false, message: "Field 'price' cannot be negative." };
    }
  }

  if (pages !== undefined && pages !== null) {
    if (!Number.isInteger(pages) || pages <= 0) {
      return { valid: false, message: "Field 'pages' must be a positive integer." };
    }
  }

  return { valid: true };
};

// ==============================================================================
// API Endpoints
// ==============================================================================

// Root Route (Welcome message)
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Lab 3: REST API, Query Parameters, Validation and Debugging');
});

// ------------------------------------------------------------------------------
// Endpoint 1: GET /books/
// Purpose: Retrieve books with filters, sorting, search and pagination
// Supported Query Params:
//   - search_q: string (default: '')
//   - order_by: 'id' | 'title' | 'author' | 'price' | 'pages' (default: 'id')
//   - order: 'ASC' | 'DESC' (default: 'ASC')
//   - limit: positive integer (default: 10)
//   - offset: non-negative integer (default: 0)
//   - min_price: non-negative number (optional)
//   - max_price: non-negative number (optional)
// Expected Status: 200 OK | 400 Bad Request | 500 Internal Server Error
// ------------------------------------------------------------------------------
app.get('/books/', async (req, res) => {
  const {
    search_q = '',
    order_by = 'id',
    order = 'ASC',
    limit = 10,
    offset = 0,
    min_price,
    max_price
  } = req.query;

  // 1. Whitelist validation for sort column
  const allowedOrderByColumns = ['id', 'title', 'author', 'price', 'pages'];
  const normalizedOrderBy = String(order_by).trim().toLowerCase();
  if (!allowedOrderByColumns.includes(normalizedOrderBy)) {
    return res.status(400).json({
      message: `Invalid order_by column '${order_by}'. Allowed columns: ${allowedOrderByColumns.join(', ')}`
    });
  }

  // 2. Whitelist validation for sort direction
  const normalizedOrder = String(order).trim().toUpperCase();
  if (normalizedOrder !== 'ASC' && normalizedOrder !== 'DESC') {
    return res.status(400).json({
      message: `Invalid order direction '${order}'. Allowed values: ASC, DESC`
    });
  }

  // 3. Validation for limit (must be positive integer)
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return res.status(400).json({
      message: "Query parameter 'limit' must be a positive integer."
    });
  }

  // 4. Validation for offset (must be non-negative integer)
  const parsedOffset = Number(offset);
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
    return res.status(400).json({
      message: "Query parameter 'offset' must be a non-negative integer."
    });
  }

  // 5. Validation for min_price & max_price
  let parsedMinPrice = null;
  if (min_price !== undefined) {
    parsedMinPrice = Number(min_price);
    if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
      return res.status(400).json({
        message: "Query parameter 'min_price' must be a non-negative number."
      });
    }
  }

  let parsedMaxPrice = null;
  if (max_price !== undefined) {
    parsedMaxPrice = Number(max_price);
    if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
      return res.status(400).json({
        message: "Query parameter 'max_price' must be a non-negative number."
      });
    }
  }

  if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
    return res.status(400).json({
      message: "Query parameter 'min_price' cannot be greater than 'max_price'."
    });
  }

  try {
    // Build SQL query dynamically with safe parameter placeholders
    const conditions = [];
    const params = [];

    // Search query on title (case-insensitive LIKE)
    if (String(search_q).trim().length > 0) {
      conditions.push('title LIKE ?');
      params.push(`%${String(search_q).trim()}%`);
    }

    // Min price condition
    if (parsedMinPrice !== null) {
      conditions.push('price >= ?');
      params.push(parsedMinPrice);
    }

    // Max price condition
    if (parsedMaxPrice !== null) {
      conditions.push('price <= ?');
      params.push(parsedMaxPrice);
    }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ` WHERE ${conditions.join(' AND ')}`;
    }

    // Safe SQL construction: normalizedOrderBy and normalizedOrder are strictly whitelisted
    const getBooksQuery = `
      SELECT * FROM book
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `;

    params.push(parsedLimit, parsedOffset);

    const books = await db.all(getBooksQuery, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while retrieving books.' });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 2: GET /books/:bookId/
// Purpose: Retrieve a single book by ID
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found | 500 Internal Server Error
// ------------------------------------------------------------------------------
app.get('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID. ID must be a positive integer.' });
  }

  try {
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [parseInt(bookId, 10)]);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while retrieving the book.' });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 3: POST /books/
// Purpose: Create a new book
// Expected Status: 201 Created | 400 Bad Request | 500 Internal Server Error
// ------------------------------------------------------------------------------
app.post('/books/', async (req, res) => {
  // Validate request body
  const validation = validateCreateBookPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const { title, author, price, pages = 100 } = req.body;

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

    res.status(201).json({
      message: 'Book created successfully',
      bookId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while creating book.' });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 4: PUT /books/:bookId/
// Purpose: Update an existing book's details
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found | 500 Internal Server Error
// ------------------------------------------------------------------------------
app.put('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID. ID must be a positive integer.' });
  }

  // Validate request body
  const validation = validateUpdateBookPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const parsedId = parseInt(bookId, 10);
  const { title, author, price, pages } = req.body;

  try {
    // 1. Check if the book exists
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Use existing values as fallback for partial updates
    const updatedTitle = title !== undefined ? title.trim() : existingBook.title;
    const updatedAuthor = author !== undefined ? author.trim() : existingBook.author;
    const updatedPrice = price !== undefined ? price : existingBook.price;
    const updatedPages = pages !== undefined ? pages : existingBook.pages;

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      updatedTitle,
      updatedAuthor,
      updatedPrice,
      updatedPages,
      parsedId
    ]);

    const updatedBook = await db.get(checkBookQuery, [parsedId]);

    res.status(200).json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while updating book.' });
  }
});

// ------------------------------------------------------------------------------
// Endpoint 5: DELETE /books/:bookId/
// Purpose: Delete an existing book by ID
// Expected Status: 200 OK | 400 Bad Request | 404 Not Found | 500 Internal Server Error
// ------------------------------------------------------------------------------
app.delete('/books/:bookId/', async (req, res) => {
  const { bookId } = req.params;

  // Validate ID format
  if (!isValidId(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID. ID must be a positive integer.' });
  }

  const parsedId = parseInt(bookId, 10);

  try {
    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    const result = await db.run(deleteBookQuery, [parsedId]);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while deleting book.' });
  }
});

// ------------------------------------------------------------------------------
// 404 Catch-All Middleware for undefined routes
// ------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist.`
  });
});

// ==============================================================================
// Database and Server Initialization Function
// ==============================================================================
const initializeDBAndServer = async () => {
  try {
    // 1. Open SQLite database connection using 'sqlite' wrapper and 'sqlite3' driver
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connected successfully.');

    // 2. Start Express server only after database connection succeeds
    server = app.listen(PORT, () => {
      console.log(`Express server is running on http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

// Export app and db for testing or modular usage
module.exports = { app, initializeDBAndServer };

// Invoke initialization if run directly
if (require.main === module) {
  initializeDBAndServer();
}
