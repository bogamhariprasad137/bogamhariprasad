-- ==============================================================================
-- File: seed.sql
-- Lab 2: SQLite Database Table Creation and Initial Seed Records
-- Course: Backend Development Fundamentals
-- Student: Bogam Hari Prasad | Reg No: 252U1R1036 | Section: CSE-2A
-- Faculty: Mr Sai Siva Teja Chintakrindi | Institution: Aurora Deemed to be University
-- ==============================================================================

-- Step 1: Create the 'book' table if it does not already exist
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

-- Step 2: Insert 10 realistic sample book records with explicit IDs from 1 to 10
-- INSERT OR IGNORE ensures that rerunning this script does not duplicate records
INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
  (1, 'To Kill a Mockingbird', 'Harper Lee', 399, 281),
  (2, '1984', 'George Orwell', 299, 328),
  (3, 'The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
  (4, 'Pride and Prejudice', 'Jane Austen', 350, 279),
  (5, 'The Catcher in the Rye', 'J.D. Salinger', 420, 234),
  (6, 'Atomic Habits', 'James Clear', 450, 320),
  (7, 'The Alchemist', 'Paulo Coelho', 299, 208),
  (8, 'Clean Code', 'Robert C. Martin', 650, 464),
  (9, 'JavaScript: The Good Parts', 'Douglas Crockford', 499, 176),
  (10, 'Introduction to Algorithms', 'Thomas H. Cormen', 999, 1312);
  (11, 'Python Crash Course', 'Eric Matthes', 599, 544),
  (12, 'Automate the Boring Stuff with Python', 'Al Sweigart', 499, 592),
  (13, 'Learning Python', 'Mark Lutz', 899, 1648),
  (14, 'Fluent Python', 'Luciano Ramalho', 799, 1014),
  (15, 'Python Programming', 'John Zelle', 450, 552),
  (16, 'JavaScript: The Definitive Guide', 'David Flanagan', 750, 1096),
  (17, 'Eloquent JavaScript', 'Marijn Haverbeke', 399, 472),
  (18, 'Effective Java', 'Joshua Bloch', 650, 416),
  (19, 'C++ Primer', 'Stanley Lippman', 850, 976),
  (20, 'Database System Concepts', 'Abraham Silberschatz', 950, 1376);
  

