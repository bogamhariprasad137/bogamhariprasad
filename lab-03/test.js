const http = require('http');
const { app, initializeDBAndServer } = require('./server');

// Helper to make local HTTP requests
const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  const PORT = 3000;
  await initializeDBAndServer();

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
      failed++;
    }
  };

  try {
    // 1. GET /
    let res = await request({ port: PORT, path: '/', method: 'GET' });
    assert('Root GET / returns 200', res.status === 200);

    // 2. GET /books/ (default all)
    res = await request({ port: PORT, path: '/books/', method: 'GET' });
    assert('GET /books/ returns 200 array', res.status === 200 && Array.isArray(res.data) && res.data.length > 0);

    // 3. Search query: search_q
    res = await request({ port: PORT, path: '/books/?search_q=1984', method: 'GET' });
    assert('GET /books/?search_q=1984 finds book', res.status === 200 && res.data.length === 1 && res.data[0].title === '1984');

    // 4. Sort: order_by=price&order=ASC
    res = await request({ port: PORT, path: '/books/?order_by=price&order=ASC', method: 'GET' });
    const isAsc = res.data.every((val, i, arr) => !i || arr[i - 1].price <= val.price);
    assert('GET /books/?order_by=price&order=ASC sorts ascending', res.status === 200 && isAsc);

    // 5. Sort: order_by=price&order=DESC
    res = await request({ port: PORT, path: '/books/?order_by=price&order=DESC', method: 'GET' });
    const isDesc = res.data.every((val, i, arr) => !i || arr[i - 1].price >= val.price);
    assert('GET /books/?order_by=price&order=DESC sorts descending', res.status === 200 && isDesc);

    // 6. Pagination: limit=2&offset=0 vs offset=2
    res = await request({ port: PORT, path: '/books/?limit=2&offset=0', method: 'GET' });
    const res2 = await request({ port: PORT, path: '/books/?limit=2&offset=2', method: 'GET' });
    assert('GET /books/ pagination limit & offset work', res.status === 200 && res.data.length === 2 && res2.data.length === 2 && res.data[0].id !== res2.data[0].id);

    // 7. Price filtering: min_price and max_price
    res = await request({ port: PORT, path: '/books/?min_price=300&max_price=450', method: 'GET' });
    const inRange = res.data.every(b => b.price >= 300 && b.price <= 450);
    assert('GET /books/?min_price=300&max_price=450 filters price range', res.status === 200 && inRange);

    // 8. Invalid query: invalid order_by
    res = await request({ port: PORT, path: '/books/?order_by=hack_column', method: 'GET' });
    assert('Invalid order_by returns 400', res.status === 400 && res.data.message.includes('Invalid order_by'));

    // 9. Invalid query: min_price > max_price
    res = await request({ port: PORT, path: '/books/?min_price=500&max_price=200', method: 'GET' });
    assert('min_price > max_price returns 400', res.status === 400);

    // 10. GET /books/:bookId (existing)
    res = await request({ port: PORT, path: '/books/2/', method: 'GET' });
    assert('GET /books/2/ returns 200', res.status === 200 && res.data.id === 2);

    // 11. GET /books/:bookId (non-existent)
    res = await request({ port: PORT, path: '/books/9999/', method: 'GET' });
    assert('GET /books/9999/ returns 404', res.status === 404 && res.data.message === 'Book not found');

    // 12. GET /books/:bookId (invalid ID)
    res = await request({ port: PORT, path: '/books/abc/', method: 'GET' });
    assert('GET /books/abc/ returns 400', res.status === 400);

    // 13. POST /books/ valid
    res = await request({
      port: PORT,
      path: '/books/',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { title: 'Test Lab3 Book', author: 'Test Author', price: 299, pages: 150 });
    assert('POST /books/ valid returns 201', res.status === 201 && res.data.bookId > 0 && res.data.message === 'Book created successfully');
    const createdId = res.data.bookId;

    // 14. POST /books/ missing title
    res = await request({
      port: PORT,
      path: '/books/',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { author: 'Test Author', price: 299 });
    assert('POST /books/ missing title returns 400', res.status === 400 && res.data.message.includes('title'));

    // 15. POST /books/ invalid price
    res = await request({
      port: PORT,
      path: '/books/',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { title: 'Invalid Price Book', author: 'Author', price: -10 });
    assert('POST /books/ negative price returns 400', res.status === 400);

    // 16. PUT /books/:bookId valid
    res = await request({
      port: PORT,
      path: `/books/${createdId}/`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { price: 350 });
    assert('PUT /books/:id valid returns 200', res.status === 200 && res.data.book.price === 350);

    // 17. PUT /books/:bookId nonexistent
    res = await request({
      port: PORT,
      path: '/books/9999/',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { price: 350 });
    assert('PUT /books/9999/ returns 404', res.status === 404);

    // 18. DELETE /books/:bookId valid
    res = await request({
      port: PORT,
      path: `/books/${createdId}/`,
      method: 'DELETE'
    });
    assert('DELETE /books/:id valid returns 200', res.status === 200 && res.data.message === 'Book deleted successfully');

    // 19. DELETE /books/:bookId nonexistent
    res = await request({
      port: PORT,
      path: `/books/${createdId}/`,
      method: 'DELETE'
    });
    assert('DELETE nonexistent returns 404', res.status === 404);

    console.log(`\n========================================`);
    console.log(`Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
