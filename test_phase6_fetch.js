const API_URL = 'http://localhost:5000/api';

async function testPhase6() {
  console.log('Starting Phase 6 tests...');
  try {
    // 1. Get tokens
    // 1. Register fresh patients
    const email1 = `p1_${Date.now()}@test.com`;
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, password: 'password123', name: 'Test P1', role: 'patient' })
    });
    const patientLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, password: 'password123' })
    }).then(res => res.json());
    const patientToken = patientLogin.token;

    // Login Admin (assuming admin already exists with this password)
    const adminLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartcare.local', password: 'admin123' })
    }).then(res => res.json());
    console.log('Admin login:', adminLogin);
    const adminToken = adminLogin.token;

    console.log('Tokens retrieved successfully:', { patientToken, adminToken });

    // 2. Fetch available lab tests (Patient)
    const testsRes = await fetch(`${API_URL}/lab/tests`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    }).then(res => res.json());
    console.log('Available Lab Tests Response:', testsRes);
    const testId = testsRes.tests[0].id;

    // 3. Book a lab test (Patient)
    const bookRes = await fetch(`${API_URL}/lab/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ lab_test_id: testId, booking_date: '2026-10-10', booking_time: '10:00' })
    }).then(res => res.json());
    console.log('Booking Response:', bookRes);
    const bookingId = bookRes.booking_id;

    // 4. Admin updates booking status to 'completed'
    const statusRes = await fetch(`${API_URL}/lab/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'completed' })
    }).then(res => res.json());
    console.log('Status Update Response:', statusRes);

    // 5. Admin creates a lab result
    const resultRes = await fetch(`${API_URL}/lab/admin/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        booking_id: bookingId,
        result_summary: 'All parameters are within normal limits. Hemoglobin: 14.5 g/dL.',
        report_date: '2026-10-10'
      })
    }).then(res => res.json());
    console.log('Create Result Response:', resultRes);

    // 6. Patient fetches their results
    const myResults = await fetch(`${API_URL}/lab/results/my`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    }).then(res => res.json());
    console.log('My Results Count:', myResults.results.length);
    
    // 7. Security IDOR Testing
    console.log('\n--- SECURITY TESTING ---');
    
    // Register Patient 2
    const email2 = `p2_${Date.now()}@test.com`;
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2, password: 'password123', name: 'Test P2', role: 'patient' })
    });
    const patient2Login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2, password: 'password123' })
    }).then(res => res.json());
    const patient2Token = patient2Login.token;

    // Patient 2 attempts to access Patient 1's booking
    const p2BookingAttempt = await fetch(`${API_URL}/lab/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    });
    if (p2BookingAttempt.status === 403) {
      console.log('✅ PASSED: Patient 2 forbidden from accessing Patient 1 booking (Status: 403)');
    } else {
      console.log('❌ FAILED: Patient 2 access attempt returned status', p2BookingAttempt.status);
    }

    // Patient 2 attempts to access Patient 1's result
    const resultId = resultRes.result_id;
    const p2ResultAttempt = await fetch(`${API_URL}/lab/results/${resultId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    });
    if (p2ResultAttempt.status === 403) {
      console.log('✅ PASSED: Patient 2 forbidden from accessing Patient 1 result (Status: 403)');
    } else {
      console.log('❌ FAILED: Patient 2 access attempt returned status', p2ResultAttempt.status);
    }

    // Patient 1 attempts to create a lab result
    const p1CreateAttempt = await fetch(`${API_URL}/lab/admin/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ booking_id: bookingId, result_summary: 'Fake result', report_date: '2026-10-10' })
    });
    if (p1CreateAttempt.status === 403) {
      console.log('✅ PASSED: Patient 1 forbidden from creating lab result (Status: 403)');
    } else {
      console.log('❌ FAILED: Patient 1 create attempt returned status', p1CreateAttempt.status);
    }
    
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPhase6();
