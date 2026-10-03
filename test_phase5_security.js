const API_URL = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('Starting Phase 5 Security/IDOR Audit (12-point suite)...');
  let passed = 0;
  let failed = 0;

  try {
    // Register users
    const emailP1 = `p1_${Date.now()}@test.com`;
    const emailP2 = `p2_${Date.now()}@test.com`;
    const emailD1 = `d1_${Date.now()}@test.com`;
    const emailD2 = `d2_${Date.now()}@test.com`;

    // Patients
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailP1, password: 'password123', name: 'Patient 1', role: 'patient' })
    });
    const p1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailP1, password: 'password123' })
    }).then(res => res.json());

    await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailP2, password: 'password123', name: 'Patient 2', role: 'patient' })
    });
    const p2 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailP2, password: 'password123' })
    }).then(res => res.json());

    // Doctors
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailD1, password: 'password123', name: 'Doctor 1', role: 'doctor' })
    });
    const d1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailD1, password: 'password123' })
    }).then(res => res.json());

    await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailD2, password: 'password123', name: 'Doctor 2', role: 'doctor' })
    });
    const d2 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailD2, password: 'password123' })
    }).then(res => res.json());

    const tP1 = p1.token;
    const tP2 = p2.token;
    const tD1 = d1.token;
    const tD2 = d2.token;

    function assert(condition, message) {
      if (condition) {
        console.log(`✅ PASSED: ${message}`);
        passed++;
      } else {
        console.error(`❌ FAILED: ${message}`);
        failed++;
      }
    }

    // Patient 1 books appointment with Doctor 1
    const appt = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tP1}` },
      body: JSON.stringify({ doctor_id: d1.user.id, appointment_date: '2026-10-15', appointment_time: '09:00' })
    }).then(res => res.json());
    console.log('Appt creation response:', appt);
    const apptId = appt.id;

    // Test 1: Patient A cannot view Patient B's appointment
    const p2ApptView = await fetch(`${API_URL}/appointments/${apptId}`, {
      headers: { Authorization: `Bearer ${tP2}` }
    });
    assert(p2ApptView.status === 403 || p2ApptView.status === 404, 'Test 1: Patient A cannot view Patient B appointment');

    // Test 2: Patient A cannot cancel Patient B's appointment
    const p2ApptCancel = await fetch(`${API_URL}/appointments/${apptId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tP2}` }
    });
    assert(p2ApptCancel.status === 403 || p2ApptCancel.status === 404, 'Test 2: Patient A cannot cancel Patient B appointment');

    // Test 3: Unauthenticated users cannot access appointments
    const unauthAppt = await fetch(`${API_URL}/appointments/my`);
    assert(unauthAppt.status === 401 || unauthAppt.status === 403, 'Test 3: Unauthenticated user rejected');

    // Test 4: Doctor A cannot confirm Doctor B's appointment
    const d2Confirm = await fetch(`${API_URL}/appointments/${apptId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tD2}` },
      body: JSON.stringify({ status: 'confirmed' })
    });
    assert(d2Confirm.status === 403 || d2Confirm.status === 404, 'Test 4: Doctor A cannot confirm Doctor B appointment');

    // Doctor 1 confirms the appointment
    await fetch(`${API_URL}/appointments/${apptId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tD1}` },
      body: JSON.stringify({ status: 'confirmed' })
    });

    // Let's create a consultation for the appointment
    const consult = await fetch(`${API_URL}/consultations/start/${apptId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tD1}` }
    }).then(res => res.json());
    console.log('Consultation start response:', consult);
    const consultId = consult.consultation_id;

    // Test 5: Patient A cannot view Patient B's consultation
    // Wait, consultations/my might not accept ID, let's check /consultations/:id if it exists.
    // If not, we just rely on /consultations/my properly filtering.
    const p2Consults = await fetch(`${API_URL}/consultations/my`, {
      headers: { Authorization: `Bearer ${tP2}` }
    }).then(res => res.json());
    assert(p2Consults.consultations.length === 0, 'Test 5: Patient A cannot view Patient B consultation via /my');

    // Test 6: Doctor A cannot access Doctor B's queue
    // Assuming /queue/doctor is specific to the logged-in doctor
    const d2Queue = await fetch(`${API_URL}/queue/doctor`, {
      headers: { Authorization: `Bearer ${tD2}` }
    }).then(res => res.json());
    // Should be empty
    assert(d2Queue.queue && d2Queue.queue.length === 0, 'Test 6: Doctor A queue isolated from Doctor B');

    // Test 7: Patient cannot access Doctor APIs
    const p1QueueAccess = await fetch(`${API_URL}/queue/doctor`, {
      headers: { Authorization: `Bearer ${tP1}` }
    });
    assert(p1QueueAccess.status === 403, 'Test 7: Patient forbidden from Doctor APIs');

    // Doctor 1 creates a medical record
    const record = await fetch(`${API_URL}/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tD1}` },
      body: JSON.stringify({ patient_id: p1.user.id, appointment_id: apptId, record_type: 'General', title: 'Checkup', description: 'Flu' })
    }).then(res => res.json());
    console.log('Record creation:', record);

    // Test 8: Patient A cannot view Patient B's medical records
    const p2Records = await fetch(`${API_URL}/medical-records/my`, {
      headers: { Authorization: `Bearer ${tP2}` }
    }).then(res => res.json());
    assert(p2Records.records && p2Records.records.length === 0, 'Test 8: Patient A cannot view Patient B records via /my');

    // Test 9: Patients cannot write medical records
    const p1WriteRecord = await fetch(`${API_URL}/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tP1}` },
      body: JSON.stringify({ patient_id: p1.user.id, diagnosis: 'Self diagnosis', treatment_plan: 'None' })
    });
    assert(p1WriteRecord.status === 403, 'Test 9: Patient forbidden from writing records');

    // Test 10: Unauthenticated users cannot access medical records
    const unauthRecords = await fetch(`${API_URL}/medical-records/my`);
    assert(unauthRecords.status === 401 || unauthRecords.status === 403, 'Test 10: Unauthenticated user cannot access records');

    // Test 11: Doctor A cannot view Doctor B's consultation list
    // Depends on if doctors can only see their own.
    const d2Consults = await fetch(`${API_URL}/consultations/doctor`, {
      headers: { Authorization: `Bearer ${tD2}` }
    }).then(res => res.json());
    assert(d2Consults.consultations && d2Consults.consultations.length === 0, 'Test 11: Doctor A cannot view Doctor B consultation list');

    // Test 12: Doctor A cannot edit Doctor B's consultation
    // Try to update consultation
    const d2EditConsult = await fetch(`${API_URL}/consultations/${consultId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tD2}` },
      body: JSON.stringify({ notes: 'Hacked' })
    });
    assert(d2EditConsult.status === 403 || d2EditConsult.status === 404, 'Test 12: Doctor A cannot edit Doctor B consultation');

    console.log(`\nAudit Complete: ${passed} passed, ${failed} failed.`);

  } catch (err) {
    console.error('Test suite failed with error:', err);
  }
}

runSecurityTests();
