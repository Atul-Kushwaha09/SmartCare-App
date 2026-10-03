const http = require('http');

async function testBackend() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('--- Starting tests ---');
  
  // 1. Setup admin
  await fetch(`${baseUrl}/auth/setup-admin`, { method: 'POST' });

  // 2. Register Patient
  let res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'John Doe', email: 'patient@test.com', password: 'pass', role: 'patient' })
  });
  console.log('Register Patient:', await res.json());

  // 3. Login Patient
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'pass' })
  });
  const patientData = await res.json();
  const patientToken = patientData.token;
  console.log('Login Patient (Success):', patientData.success);

  // 4. Register Doctor
  res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dr. Smith', email: 'doctor@test.com', password: 'pass', role: 'doctor' })
  });
  console.log('Register Doctor:', await res.json());

  // 5. Login Doctor
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@test.com', password: 'pass' })
  });
  const doctorData = await res.json();
  const doctorToken = doctorData.token;
  console.log('Login Doctor (Success):', doctorData.success);

  // 6. Login Admin
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@smartcare.local', password: 'admin123' })
  });
  const adminData = await res.json();
  const adminToken = adminData.token;
  console.log('Login Admin (Success):', adminData.success);

  // 7. Invalid password
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'wrong' })
  });
  console.log('Invalid Password (Expected False):', (await res.json()).success);

  // 8. /auth/me
  res = await fetch(`${baseUrl}/auth/me`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('GET /auth/me (Patient):', await res.json());

  // 9. Protected route without JWT
  res = await fetch(`${baseUrl}/test/patient-only`);
  console.log('Protected without JWT (Expected 401):', res.status);

  // 10. Patient accessing admin
  res = await fetch(`${baseUrl}/test/admin-only`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('Patient -> Admin route (Expected 403):', res.status);

  // 11. Doctor accessing admin
  res = await fetch(`${baseUrl}/test/admin-only`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  console.log('Doctor -> Admin route (Expected 403):', res.status);

  // 12. Admin access works
  res = await fetch(`${baseUrl}/test/admin-only`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Admin -> Admin route (Expected 200):', res.status);

  console.log('--- Tests finished ---');
}

testBackend();
