# Lab 3: REST API, Query Parameters, Validation and Debugging

**Backend Development Fundamentals**  
**Academic Year:** II Year, Term II  
**Institution:** Aurora Deemed to be University  
**Department:** Computer Science and Engineering  

---

## 👨‍🎓 Student & Course Details

- **Student Name:** Bogam Hari Prasad
- **Registration Number:** 252U1R1036
- **Section:** CSE-2A
- **Course:** Backend Development Fundamentals
- **Academic Year:** II Year, Term II
- **Institution:** Aurora Deemed to be University
- **Faculty:** Mr Sai Siva Teja Chintakrindi
- **Repository:** [https://github.com/bogamhariprasad137/bogamhariprasad](https://github.com/bogamhariprasad137/bogamhariprasad)

---

## 🎯 Lab Objectives

1. Design and implement a robust RESTful API with resource-oriented URI conventions and proper HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
2. Implement advanced **query parameters** on `GET /books/`:
   - Search filtering (`search_q`) using parameterized SQLite `LIKE`.
   - Whitelist-based column sorting (`order_by`) and direction control (`order`: `ASC`/`DESC`).
   - Pagination (`limit` and `offset`) with comprehensive boundary checks.
   - Independent and combined price range filtering (`min_price` and `max_price`).
3. Enforce strict server-side payload validation for `POST /books/` and `PUT /books/:bookId/` returning HTTP `400 Bad Request` on failure.
4. Provide consistent, secure JSON responses without leaking internal database schemas, raw SQL errors, or system stack traces.
5. Diagnose and document solutions for common backend development errors: `EADDRINUSE`, Module Not Found, Incorrect Table Name, and Missing `await`.
6. Verify and document all endpoints using Thunder Client test cases and execution evidence.

---

## 🛠️ Technologies Used

- **Node.js** (v24.16.0) - Asynchronous JavaScript runtime
- **Express.js** (v5.3.0) - Web framework for routing and middleware
- **SQLite3** (v6.0.1) & **sqlite** (v5.1.1) - Lightweight disk-based SQL database and promise-based client wrapper
- **Nodemon** (v3.1.14) - Development utility for automatic server restarts
- **Thunder Client** - Visual Studio Code REST API client for endpoint testing

---

## 📁 Project Structure

```text
lab-03/
├── server.js              # Express application with routes, query handlers & validation
├── books.db               # SQLite database file containing the 'book' table and records
├── seed.sql               # Database creation and seed records script
├── package.json           # Project manifest, dependencies, and cross-platform build scripts
├── package-lock.json      # Dependency lockfile
├── README.md              # Full documentation, viva answers, and test evidence
├── .gitignore             # Excludes node_modules, .env, and logs
├── test.js                # Automated test verification suite
└── screenshots/           # Thunder Client test execution screenshots
    ├── .gitkeep
    ├── get-all-books.png
    ├── search-books.png
    ├── sort-books.png
    ├── pagination.png
    ├── price-filter.png
    ├── combined-filters.png
    ├── invalid-query.png
    ├── post-book.png
    ├── put-book.png
    ├── delete-book.png
    └── not-found.png
```

---

## 🚀 Installation & Execution

### 1. Navigate to the project directory
```bash
cd lab-03
```

### 2. Install dependencies
```bash
npm install
# Note: On Windows PowerShell if execution policies restrict npm scripts, use:
npm.cmd install
```

### 3. Start the server
- **Production Mode:**
  ```bash
  npm start
  ```
- **Development Mode (Auto-reload with nodemon):**
  ```bash
  npm run dev
  ```

Once started, the console displays:
```text
Database connected successfully.
Express server is running on http://localhost:3000/
```

---

## 📖 REST API Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/` | API Welcome message | `200 OK` |
| `GET` | `/books/` | Retrieve books with filters, sorting, and pagination | `200 OK`, `400 Bad Request`, `500 Server Error` |
| `GET` | `/books/:bookId/` | Retrieve a single book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/books/` | Create a new book record | `201 Created`, `400 Bad Request` |
| `PUT` | `/books/:bookId/` | Update an existing book's details | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/books/:bookId/` | Remove a book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## 🔍 Detailed Endpoint Documentation & Query Parameters

### 1. `GET /books/` — Filter, Sort, Search & Paginate

#### Query Parameters:

| Parameter | Type | Default | Description & Validation |
|---|---|---|---|
| `search_q` | string | `""` | Partial case-insensitive title search via `LIKE ?` |
| `order_by` | string | `id` | Sort column. Allowed: `id`, `title`, `author`, `price`, `pages` |
| `order` | string | `ASC` | Sort order. Allowed: `ASC`, `DESC` (case-insensitive) |
| `limit` | integer | `10` | Positive integer (> 0). Maximum books to return |
| `offset` | integer | `0` | Non-negative integer (>= 0). Number of books to skip |
| `min_price`| number | `undefined` | Non-negative number (>= 0). Minimum book price |
| `max_price`| number | `undefined` | Non-negative number (>= 0). Maximum book price |

#### Example Requests:

- **Get all books (default pagination 10):**
  ```http
  GET http://localhost:3000/books/
  ```

- **Partial title search:**
  ```http
  GET http://localhost:3000/books/?search_q=node
  ```

- **Sort descending by price:**
  ```http
  GET http://localhost:3000/books/?order_by=price&order=DESC
  ```

- **Pagination (page 2 with 3 items per page):**
  ```http
  GET http://localhost:3000/books/?limit=3&offset=3
  ```

- **Price range filter:**
  ```http
  GET http://localhost:3000/books/?min_price=300&max_price=500
  ```

- **Combined search, filter, sort & pagination:**
  ```http
  GET http://localhost:3000/books/?search_q=a&min_price=200&max_price=500&order_by=price&order=ASC&limit=5&offset=0
  ```

#### Example 200 OK Response:
```json
[
  {
    "id": 1,
    "title": "Updated Node.js Book",
    "author": "TOJI",
    "price": 500,
    "pages": 350
  },
  {
    "id": 2,
    "title": "1984",
    "author": "George Orwell",
    "price": 299,
    "pages": 328
  }
]
```

#### Example 400 Bad Request Responses:
- Invalid column:
  ```json
  {
    "message": "Invalid order_by column 'invalid_col'. Allowed columns: id, title, author, price, pages"
  }
  ```
- Invalid price range:
  ```json
  {
    "message": "Query parameter 'min_price' cannot be greater than 'max_price'."
  }
  ```

---

### 2. `GET /books/:bookId/` — Get Single Book

- **Request:**
  ```http
  GET http://localhost:3000/books/2/
  ```
- **Response (`200 OK`):**
  ```json
  {
    "id": 2,
    "title": "1984",
    "author": "George Orwell",
    "price": 299,
    "pages": 328
  }
  ```
- **Response (`404 Not Found` for nonexistent book):**
  ```json
  {
    "message": "Book not found"
  }
  ```
- **Response (`400 Bad Request` for invalid ID):**
  ```json
  {
    "message": "Invalid book ID. ID must be a positive integer."
  }
  ```

---

### 3. `POST /books/` — Create Book

#### Request Headers:
`Content-Type: application/json`

#### Validation Rules:
- `title`: Required non-empty string.
- `author`: Required non-empty string.
- `price`: Required non-negative number.
- `pages`: Optional positive integer (defaults to 100 if omitted).

#### Example Request:
```http
POST http://localhost:3000/books/
Content-Type: application/json

{
  "title": "Learning Node.js",
  "author": "Hari Prasad",
  "price": 450,
  "pages": 300
}
```

#### Response (`201 Created`):
```json
{
  "message": "Book created successfully",
  "bookId": 14
}
```

#### Error Response (`400 Bad Request`):
```json
{
  "message": "Field 'title' must be a non-empty string."
}
```

---

### 4. `PUT /books/:bookId/` — Update Book

#### Example Request:
```http
PUT http://localhost:3000/books/1/
Content-Type: application/json

{
  "title": "Updated Node.js Book",
  "author": "TOJI",
  "price": 500,
  "pages": 350
}
```

#### Response (`200 OK`):
```json
{
  "message": "Book updated successfully",
  "book": {
    "id": 1,
    "title": "Updated Node.js Book",
    "author": "TOJI",
    "price": 500,
    "pages": 350
  }
}
```

#### Error Response (`404 Not Found`):
```json
{
  "message": "Book not found"
}
```

---

### 5. `DELETE /books/:bookId/` — Delete Book

#### Example Request:
```http
DELETE http://localhost:3000/books/14/
```

#### Response (`200 OK`):
```json
{
  "message": "Book deleted successfully"
}
```

#### Error Response (`404 Not Found`):
```json
{
  "message": "Book not found"
}
```

---

## 🛡️ SQL Injection Safety & Security Architecture

In this lab, database security is strictly enforced by applying two primary defense mechanisms:

1. **Parameterized Queries (`?` placeholders):**
   - User inputs (`search_q`, `min_price`, `max_price`, `limit`, `offset`, and request body parameters) are never concatenated directly into SQL strings.
   - They are passed as external parameters to `db.all(query, params)`, `db.get(query, params)`, and `db.run(query, params)`.
   - SQLite automatically escapes and sanitizes these values, rendering SQL injection attacks ineffective.

2. **Strict Whitelisting for Dynamic Identifiers:**
   - SQL column names in `ORDER BY` and direction keywords (`ASC`/`DESC`) cannot be parameterized in standard SQL drivers.
   - To prevent injection via `order_by` or `order`, values are explicitly verified against an allowed whitelist:
     ```javascript
     const allowedOrderByColumns = ['id', 'title', 'author', 'price', 'pages'];
     if (!allowedOrderByColumns.includes(normalizedOrderBy)) { ... }
     ```
   - Any value outside the whitelist is rejected with HTTP `400 Bad Request`.

---

## 🐞 Debugging Exercise: 4 Common Backend Errors

### 1. `EADDRINUSE` (Port Already in Use)
- **Cause:** Another process (e.g., an orphaned Node.js background process, or another service) is already listening on port `3000`.
- **Diagnosis:**
  ```powershell
  # Find the process ID listening on port 3000
  netstat -ano | findstr :3000
  ```
- **Solution:**
  - Terminate the conflicting process:
    ```powershell
    Stop-Process -Id <PID> -Force
    ```
  - Or configure a different port using an environment variable:
    ```bash
    PORT=3001 node server.js
    ```

---

### 2. Wrong Import Path / Module Not Found (`Cannot find module`)
- **Cause:** Incorrect relative path when importing local modules or forgetting to run `npm install` after cloning a project with third-party dependencies.
- **Diagnosis:** Check the stack trace showing `Error: Cannot find module 'xyz'`.
- **Solution:**
  - Verify `package.json` contains the required package in `dependencies`.
  - Re-run dependency installation: `npm.cmd install`.
  - For local files, always use `path.join(__dirname, ...)` to ensure reliable cross-platform absolute path resolution.

---

### 3. Incorrect Table Name (`SQLITE_ERROR: no such table: books`)
- **Cause:** Using plural form `books` instead of the singular schema name `book` defined in `seed.sql` (`CREATE TABLE IF NOT EXISTS book`).
- **Diagnosis:** Check error message: `SQLITE_ERROR: no such table: books`.
- **Solution:**
  - Inspect the database schema using SQLite CLI:
    ```bash
    sqlite3 books.db ".schema"
    ```
  - Ensure all queries in `server.js` refer strictly to `FROM book` or `INTO book`.

---

### 4. Missing `await` / Database Operation Runs Before Connection Completes
- **Cause:** In asynchronous database workflows, forgetting `await` before `open(...)` or database queries causes the function to return a pending `Promise` instead of the database instance/data. Additionally, calling `app.listen()` before the database connection resolves leads to queries executing on `null`.
- **Diagnosis:** Calling `db.all()` throws `TypeError: Cannot read properties of null (reading 'all')` or returns `[object Promise]`.
- **Solution:**
  - Always `await` the database connection inside an `async initializeDBAndServer()` function before starting `app.listen()`.
  - Prefix all database operations (`db.all`, `db.get`, `db.run`) with `await` inside async Express route handlers.

---

## 📷 Test Execution Evidence & Screenshots

All 11 Thunder Client test requests and response screenshots are captured and embedded below from the [`screenshots/`](screenshots/) directory:

### 1. Get All Books (`GET /books/`)
Retrieves all book records from the database with default ordering.
![Get All Books](screenshots/get-all-books.png)

### 2. Search Books by Title (`GET /books/?search_q=...`)
Performs partial search using parameterized SQLite `LIKE`.
![Search Books](screenshots/search-books.png)

### 3. Sort Books (`GET /books/?order_by=...&order=...`)
Sorts books by whitelisted column and sort direction.
![Sort Books](screenshots/sort-books.png)

### 4. Pagination (`GET /books/?limit=...&offset=...`)
Demonstrates pagination using limit and offset.
![Pagination](screenshots/pagination.png)

### 5. Price Filter (`GET /books/?min_price=...&max_price=...`)
Filters books matching minimum and maximum price boundaries.
![Price Filter](screenshots/price-filter.png)

### 6. Combined Query Filters
Simultaneous search, price filtering, sorting, and pagination in a single query.
![Combined Filters](screenshots/combined-filters.png)

### 7. Invalid Query Parameter Validation (`HTTP 400 Bad Request`)
Rejection of invalid sorting column or out-of-range query parameter.
![Invalid Query Parameter](screenshots/invalid-query.png)

### 8. Create Book (`POST /books/` -> `HTTP 201 Created`)
Adds a new book record with payload validation.
![Create Book](screenshots/post-book.png)

### 9. Update Book (`PUT /books/:bookId/` -> `HTTP 200 OK`)
Updates an existing book record with modified fields.
![Update Book](screenshots/put-book.png)

### 10. Delete Book (`DELETE /books/:bookId/` -> `HTTP 200 OK`)
Removes a book record by its ID.
![Delete Book](screenshots/delete-book.png)

### 11. Resource Not Found (`HTTP 404 Not Found`)
Handles requests for nonexistent book IDs or invalid routes.
![Resource Not Found](screenshots/not-found.png)

---

## 📋 Thunder Client Testing Summary Table

| No. | Test Case | Endpoint / Query | Expected Status | Screenshot Reference |
|---|---|---|---|---|
| 1 | Get All Books | `GET /books/` | `200 OK` | [`screenshots/get-all-books.png`](screenshots/get-all-books.png) |
| 2 | Partial Title Search | `GET /books/?search_q=...` | `200 OK` | [`screenshots/search-books.png`](screenshots/search-books.png) |
| 3 | Sort Books | `GET /books/?order_by=price&order=DESC` | `200 OK` | [`screenshots/sort-books.png`](screenshots/sort-books.png) |
| 4 | Pagination (Limit & Offset) | `GET /books/?limit=3&offset=3` | `200 OK` | [`screenshots/pagination.png`](screenshots/pagination.png) |
| 5 | Filter by Price Range | `GET /books/?min_price=300&max_price=500` | `200 OK` | [`screenshots/price-filter.png`](screenshots/price-filter.png) |
| 6 | Combined Filters | `GET /books/?search_q=...&min_price=...` | `200 OK` | [`screenshots/combined-filters.png`](screenshots/combined-filters.png) |
| 7 | Invalid Query Parameter | `GET /books/?order_by=invalid_col` | `400 Bad Request` | [`screenshots/invalid-query.png`](screenshots/invalid-query.png) |
| 8 | Create Book | `POST /books/` | `201 Created` | [`screenshots/post-book.png`](screenshots/post-book.png) |
| 9 | Update Book | `PUT /books/1/` | `200 OK` | [`screenshots/put-book.png`](screenshots/put-book.png) |
| 10 | Delete Book | `DELETE /books/:bookId/` | `200 OK` | [`screenshots/delete-book.png`](screenshots/delete-book.png) |
| 11 | Resource Not Found | `GET /books/999/` | `404 Not Found` | [`screenshots/not-found.png`](screenshots/not-found.png) |

---

## 📦 Submission Verification

- [x] Lab 3 created in `lab-03/` without modifying `lab-01/` or `lab-02/`.
- [x] Reused Lab 2 Express + SQLite architecture with CommonJS.
- [x] Initial database records preserved in `lab-03/books.db`.
- [x] All 5 CRUD routes implemented and verified.
- [x] All query parameters (`search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price`) implemented with parameterized safety.
- [x] Robust server-side validation for `POST`, `PUT`, `DELETE`, and query parameters.
- [x] Debugging exercise documented.
- [x] All 11 Thunder Client test screenshots embedded with exact filenames.
