const http = require('http');

async function runQueueTest() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- E2E Queue Test ---');

  // 1. Login Patient
  const patientRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'pass' })
  });
  const patientData = await patientRes.json();
  const patientToken = patientData.token;

  // 2. Login Doctor
  const doctorRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@test.com', password: 'pass' })
  });
  const doctorData = await doctorRes.json();
  const doctorToken = doctorData.token;

  // Get doctor id for booking
  const doctorsRes = await fetch(`${baseUrl}/doctors`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  const doctorsData = await doctorsRes.json();
  const myDoctor = doctorsData.doctors[0];
  console.log('Using doctor ID:', myDoctor.id);

  // 3. Patient books appointment
  const today = new Date().toISOString().split('T')[0];
  const time = `14:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
  let bookRes = await fetch(`${baseUrl}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
    body: JSON.stringify({ doctor_id: myDoctor.id, appointment_date: today, appointment_time: time, reason: 'Test queue' })
  });
  let bookData = await bookRes.json();
  console.log('Patient Book Appointment:', bookData);
  let appointmentId = bookData.id;

  if (bookRes.status === 409) {
    // Generate new random time
    const time2 = `15:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    bookRes = await fetch(`${baseUrl}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
      body: JSON.stringify({ doctor_id: myDoctor.id, appointment_date: today, appointment_time: time2, reason: 'Test queue' })
    });
    bookData = await bookRes.json();
    console.log('Patient Book Appointment (Retry):', bookData);
    appointmentId = bookData.id;
  }

  // Test double booking
  const doubleBookRes = await fetch(`${baseUrl}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
    body: JSON.stringify({ doctor_id: myDoctor.id, appointment_date: today, appointment_time: time, reason: 'Test double booking' })
  });
  console.log(`Double Booking Test (Expected 409): Status = ${doubleBookRes.status}`);

  // 4. Doctor confirms appointment
  const confirmRes = await fetch(`${baseUrl}/appointments/${appointmentId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({ status: 'confirmed' })
  });
  const confirmData = await confirmRes.json();
  console.log('Doctor Confirm Appointment:', confirmData);

  // 5. Patient checks queue
  const ptQueueRes = await fetch(`${baseUrl}/queue/my`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  const ptQueueData = await ptQueueRes.json();
  console.log('Patient Queue:', ptQueueData);

  // 6. Doctor checks queue
  const drQueueRes = await fetch(`${baseUrl}/queue/doctor`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  const drQueueData = await drQueueRes.json();
  console.log('Doctor Queue:', JSON.stringify(drQueueData, null, 2));

  // 7. Doctor calls next patient
  const callRes = await fetch(`${baseUrl}/queue/call`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  const callData = await callRes.json();
  console.log('Doctor Calls Next:', callData);

  // 8. Doctor checks queue again
  const drQueueRes2 = await fetch(`${baseUrl}/queue/doctor`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  const drQueueData2 = await drQueueRes2.json();
  console.log('Doctor Queue (After Call):', JSON.stringify(drQueueData2, null, 2));

  // 9. Doctor completes patient
  const calledToken = drQueueData2.queue.find(t => t.status === 'called');
  if (calledToken) {
    const compRes = await fetch(`${baseUrl}/queue/${calledToken.id}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    const compData = await compRes.json();
    console.log('Doctor Completes Token:', compData);
  }

  // 10. Final queue check
  const finalDrQueueRes = await fetch(`${baseUrl}/queue/doctor`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  console.log('Final Doctor Queue:', await finalDrQueueRes.json());
}

runQueueTest();
