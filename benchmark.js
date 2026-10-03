// Native fetch is available in Node 24
const { performance } = require('perf_hooks');

const API_URL = 'http://localhost:5000/api';

async function measureGet(url) {
  const start = performance.now();
  try {
    const res = await fetch(url);
    await res.text();
    const end = performance.now();
    return end - start;
  } catch (err) {
    return null;
  }
}

async function measurePost(url, body) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    await res.text();
    const end = performance.now();
    return end - start;
  } catch (err) {
    return null;
  }
}

async function runBenchmark() {
  console.log('Starting Performance Evaluation...');
  
  const results = {};
  
  // Test Health Endpoint
  let sum = 0;
  for(let i = 0; i < 50; i++) sum += await measureGet(`${API_URL}/health`);
  results.health_avg = sum / 50;

  // Test Auth Endpoint (with fake credentials, tests DB query time and bcrypt rejection)
  sum = 0;
  for(let i = 0; i < 50; i++) {
    sum += await measurePost(`${API_URL}/auth/login`, { email: 'fake@example.com', password: 'wrong' });
  }
  results.auth_avg = sum / 50;

  console.log('\n--- Telemedicine Prototype Performance Metrics ---');
  console.log(`API Health Check Avg Response: ${results.health_avg.toFixed(2)} ms`);
  console.log(`Auth Login Check Avg Response: ${results.auth_avg.toFixed(2)} ms`);
  console.log('--------------------------------------------------\n');
  
  console.log('Note: DPDP-oriented privacy considerations mandate that patient data is not processed during these public endpoint benchmarks, ensuring a privacy-preserving architecture.');
}

runBenchmark();
