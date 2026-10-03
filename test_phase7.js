const fs = require('fs');

const baseUrl = 'http://localhost:5000/api';

async function testPhase7() {
  console.log('--- Phase 7 Backend Test ---');

  // 1. Login Patient
  let res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'pass' })
  });
  let data = await res.json();
  const patientToken = data.token;
  console.log('1. Patient login:', data.success ? 'PASS' : 'FAIL');

  // 2. Login Doctor
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@test.com', password: 'pass' })
  });
  data = await res.json();
  const doctorToken = data.token;
  console.log('2. Doctor login:', data.success ? 'PASS' : 'FAIL');

  // 3. Login Admin
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@smartcare.local', password: 'admin123' })
  });
  data = await res.json();
  const adminToken = data.token;
  console.log('3. Admin login:', data.success ? 'PASS' : 'FAIL');

  // TEST 1: GET /api/medicines
  res = await fetch(`${baseUrl}/medicines`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
  data = await res.json();
  console.log('TEST 1: GET /api/medicines:', (data.success && data.medicines.length > 0) ? 'PASS' : 'FAIL');

  // TEST 2: GET /api/medicines?search=paracetamol
  res = await fetch(`${baseUrl}/medicines?search=paracetamol`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
  data = await res.json();
  console.log('TEST 2: GET /api/medicines?search=paracetamol:', (data.success && data.medicines.length > 0) ? 'PASS' : 'FAIL');
  const paracetamolId = data.medicines[0].id;

  // TEST 3: GET /api/pharmacies
  res = await fetch(`${baseUrl}/pharmacies`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
  data = await res.json();
  console.log('TEST 3: GET /api/pharmacies:', (data.success && data.pharmacies.length > 0) ? 'PASS' : 'FAIL');

  // TEST 4: GET /api/medicines/:id/availability
  res = await fetch(`${baseUrl}/medicines/${paracetamolId}/availability`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
  data = await res.json();
  console.log('TEST 4: GET /api/medicines/:id/availability:', (data.success && data.availability.length > 0) ? 'PASS' : 'FAIL');

  // TEST 5: Admin creates a medicine
  res = await fetch(`${baseUrl}/admin/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Test Med', generic_name: 'Test Generic', description: 'Test', category: 'Test' })
  });
  data = await res.json();
  console.log('TEST 5: Admin creates medicine:', data.success ? 'PASS' : 'FAIL');
  const newMedId = data.id;

  // TEST 6: Admin creates a pharmacy
  res = await fetch(`${baseUrl}/admin/pharmacies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: 'Test Pharmacy', address: '123 Test', city: 'Test', phone: '123' })
  });
  data = await res.json();
  console.log('TEST 6: Admin creates pharmacy:', data.success ? 'PASS' : 'FAIL');
  const newPhmId = data.id;

  // TEST 7: Admin creates inventory
  res = await fetch(`${baseUrl}/admin/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ pharmacy_id: newPhmId, medicine_id: newMedId, quantity: 15 })
  });
  data = await res.json();
  console.log('TEST 7: Admin creates inventory:', data.success ? 'PASS' : 'FAIL');
  const newInvId = data.id;

  // check if availability_status was set to available
  res = await fetch(`${baseUrl}/admin/inventory`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
  data = await res.json();
  const inv = data.inventory.find(i => i.id === newInvId);
  console.log('   -> Initial status available:', inv.availability_status === 'available' ? 'PASS' : 'FAIL');

  // TEST 8: Admin changes quantity to 0
  res = await fetch(`${baseUrl}/admin/inventory/${newInvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ quantity: 0 })
  });
  await res.json();
  res = await fetch(`${baseUrl}/admin/inventory`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
  data = await res.json();
  let updatedInv = data.inventory.find(i => i.id === newInvId);
  console.log('TEST 8: Quantity 0 -> out_of_stock:', updatedInv.availability_status === 'out_of_stock' ? 'PASS' : 'FAIL');

  // TEST 9: Admin changes quantity to 5
  res = await fetch(`${baseUrl}/admin/inventory/${newInvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ quantity: 5 })
  });
  await res.json();
  res = await fetch(`${baseUrl}/admin/inventory`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
  data = await res.json();
  updatedInv = data.inventory.find(i => i.id === newInvId);
  console.log('TEST 9: Quantity 5 -> low_stock:', updatedInv.availability_status === 'low_stock' ? 'PASS' : 'FAIL');

  // TEST 10: Admin changes quantity to 20
  res = await fetch(`${baseUrl}/admin/inventory/${newInvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ quantity: 20 })
  });
  await res.json();
  res = await fetch(`${baseUrl}/admin/inventory`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
  data = await res.json();
  updatedInv = data.inventory.find(i => i.id === newInvId);
  console.log('TEST 10: Quantity 20 -> available:', updatedInv.availability_status === 'available' ? 'PASS' : 'FAIL');

  // TEST 11: Patient attempts admin medicine creation
  res = await fetch(`${baseUrl}/admin/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
    body: JSON.stringify({ name: 'Hacked Med' })
  });
  console.log('TEST 11: Patient create med (403):', res.status === 403 ? 'PASS' : 'FAIL');

  // TEST 12: Patient attempts inventory modification
  res = await fetch(`${baseUrl}/admin/inventory/${newInvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
    body: JSON.stringify({ quantity: 100 })
  });
  console.log('TEST 12: Patient modify inventory (403):', res.status === 403 ? 'PASS' : 'FAIL');

  // TEST 13: Doctor attempts inventory modification
  res = await fetch(`${baseUrl}/admin/inventory/${newInvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({ quantity: 100 })
  });
  console.log('TEST 13: Doctor modify inventory (403):', res.status === 403 ? 'PASS' : 'FAIL');

  console.log('Backend Tests Complete');
}

testPhase7();
