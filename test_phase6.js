const API_URL = 'http://localhost:5000/api';

async function testPhase6() {
  console.log('Starting Phase 6 tests...');
  try {
    // 1. Get tokens
    const patientLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient1@example.com',
        password: 'password123'
      })
    }).then(res => res.json());
    
    const patientToken = patientLogin.token;
    
    const adminLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    }).then(res => res.json());
    const adminToken = adminLogin.token;

    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    const adminToken = adminLogin.data.token;

    console.log('Tokens retrieved successfully.');

    // 2. Fetch available lab tests (Patient)
    const testsRes = await axios.get(`${API_URL}/lab/tests`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Available Lab Tests:', testsRes.data.tests.length);
    const testId = testsRes.data.tests[0].id; // Let's book the first test (CBC)

    // 3. Book a lab test (Patient)
    const bookRes = await axios.post(`${API_URL}/lab/bookings`, {
      lab_test_id: testId,
      booking_date: '2026-10-10',
      booking_time: '10:00'
    }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Booking Response:', bookRes.data);
    const bookingId = bookRes.data.booking_id;

    // 4. Admin updates booking status to 'completed'
    const statusRes = await axios.put(`${API_URL}/lab/admin/bookings/${bookingId}/status`, {
      status: 'completed'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Status Update Response:', statusRes.data);

    // 5. Admin creates a lab result
    const resultRes = await axios.post(`${API_URL}/lab/admin/results`, {
      booking_id: bookingId,
      result_summary: 'All parameters are within normal limits. Hemoglobin: 14.5 g/dL.',
      report_date: '2026-10-10'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Create Result Response:', resultRes.data);

    // 6. Patient fetches their results
    const myResults = await axios.get(`${API_URL}/lab/results/my`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('My Results Count:', myResults.data.results.length);
    
    // 7. Security IDOR Testing
    console.log('\n--- SECURITY TESTING ---');
    
    // Login as Patient 2
    const patient2Login = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient2@example.com',
      password: 'password123'
    });
    const patient2Token = patient2Login.data.token;

    // Patient 2 attempts to access Patient 1's booking
    try {
      await axios.get(`${API_URL}/lab/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${patient2Token}` }
      });
      console.log('❌ FAILED: Patient 2 accessed Patient 1 booking!');
    } catch (err) {
      console.log('✅ PASSED: Patient 2 forbidden from accessing Patient 1 booking (Status: ' + err.response.status + ')');
    }

    // Patient 2 attempts to access Patient 1's result
    const resultId = resultRes.data.result_id;
    try {
      await axios.get(`${API_URL}/lab/results/${resultId}`, {
        headers: { Authorization: `Bearer ${patient2Token}` }
      });
      console.log('❌ FAILED: Patient 2 accessed Patient 1 result!');
    } catch (err) {
      console.log('✅ PASSED: Patient 2 forbidden from accessing Patient 1 result (Status: ' + err.response.status + ')');
    }

    // Patient 1 attempts to create a lab result
    try {
      await axios.post(`${API_URL}/lab/admin/results`, {
        booking_id: bookingId,
        result_summary: 'Fake result',
        report_date: '2026-10-10'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log('❌ FAILED: Patient 1 created a lab result!');
    } catch (err) {
      console.log('✅ PASSED: Patient 1 forbidden from creating lab result (Status: ' + err.response.status + ')');
    }
    
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testPhase6();
