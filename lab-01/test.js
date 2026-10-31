// ==============================================================================
// File: test.js
// Automated Test Suite for Lab 1 (Native HTTP Server & Express Server)
// Course: Backend Development Fundamentals
// Faculty: Mr Sai Siva Teja Chintakrindi | Institution: Aurora
// Student: Bogam Hari Prasad (252U1R1036, CSE-2A)
// ==============================================================================

const { spawn, execSync } = require('child_process');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Forcefully and cleanly terminates a process tree on any OS (Windows & POSIX)
function terminateProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGKILL');
    }
  } catch (e) {
    // Process already terminated
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  LAB 1: BACKEND DEVELOPMENT FUNDAMENTALS - TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;

  // ----------------------------------------------------------------------------
  // Part 1: Test Native HTTP Server (server-http.js)
  // ----------------------------------------------------------------------------
  console.log('>>> [1/2] Testing Native HTTP Server (server-http.js)...');
  const nativeProc = spawn('node', ['server-http.js'], { cwd: __dirname });
  nativeProc.stdout.on('data', (d) => process.stdout.write('    [stdout] ' + d.toString()));
  nativeProc.stderr.on('data', (d) => process.stderr.write('    [stderr] ' + d.toString()));
  await delay(1200);

  try {
    const res = await fetch('http://127.0.0.1:3000/');
    const text = await res.text();
    const passed = res.status === 200 && text === 'Hello';
    console.log(`    Endpoint: GET http://localhost:3000/`);
    console.log(`    Status: ${res.status} | Body: "${text}" | Result: ${passed ? 'PASS [200 OK]' : 'FAIL'}`);
    if (!passed) allPassed = false;
  } catch (err) {
    console.error('    Error contacting native server:', err.message);
    allPassed = false;
  } finally {
    terminateProcess(nativeProc);
    await delay(1000); // Allow OS to release port 3000
  }

  console.log('\n----------------------------------------------------------------\n');

  // ----------------------------------------------------------------------------
  // Part 2: Test Express Server (server.js)
  // ----------------------------------------------------------------------------
  console.log('>>> [2/2] Testing Express Server (server.js)...');
  const expressProc = spawn('node', ['server.js'], { cwd: __dirname });
  expressProc.stdout.on('data', (d) => process.stdout.write('    [stdout] ' + d.toString()));
  expressProc.stderr.on('data', (d) => process.stderr.write('    [stderr] ' + d.toString()));
  await delay(1200);

  const expressEndpoints = [
    {
      name: 'GET / (Welcome Route)',
      url: 'http://127.0.0.1:3000/',
      expectedStatus: 200,
      validate: (body, status) => status === 200 && body.includes('Welcome')
    },
    {
      name: 'GET /about (JSON Profile)',
      url: 'http://127.0.0.1:3000/about',
      expectedStatus: 200,
      validate: (body, status) =>
        status === 200 &&
        (body.name === 'Bogam Hari Prasad' || body.name.includes('Hari')) &&
        body.course.includes('Backend Development')
    },
    {
      name: 'GET /time (Current Date & Time)',
      url: 'http://127.0.0.1:3000/time',
      expectedStatus: 200,
      validate: (body, status) => status === 200 && typeof body.currentTime === 'string'
    },
    {
      name: 'GET /unknown (404 Error Handler)',
      url: 'http://127.0.0.1:3000/unknown',
      expectedStatus: 404,
      validate: (body, status) => status === 404 && body.error === 'Not Found'
    }
  ];

  try {
    for (const testCase of expressEndpoints) {
      const res = await fetch(testCase.url);
      const contentType = res.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        body = await res.text();
      }

      const passed = testCase.validate(body, res.status);
      console.log(`    Endpoint: ${testCase.name}`);
      console.log(`    URL: ${testCase.url}`);
      console.log(`    Status: ${res.status} (Expected: ${testCase.expectedStatus})`);
      console.log(`    Response: ${typeof body === 'object' ? JSON.stringify(body) : body}`);
      console.log(`    Result: ${passed ? 'PASS [OK]' : 'FAIL'}`);
      console.log('');
      if (!passed) allPassed = false;
    }
  } catch (err) {
    console.error('    Error contacting Express server:', err.message);
    allPassed = false;
  } finally {
    terminateProcess(expressProc);
    await delay(500);
  }

  console.log('================================================================');
  console.log(`  OVERALL TEST RESULT: ${allPassed ? 'ALL TESTS PASSED SUCCESSFULLY! [OK]' : 'SOME TESTS FAILED'}`);
  console.log('================================================================');

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
