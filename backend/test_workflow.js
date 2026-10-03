const db = require('./db');

async function runTests() {
  console.log("Simulating workflow directly in DB and API...");
  
  const doctor_id = 7;
  const patient_id = 5;

  db.run(`INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)`, [patient_id, doctor_id, '2026-10-04', '10:00', 'pending'], function(err) {
    if (err) return console.error(err);
    const appointment_id = this.lastID;
    console.log("1. Created pending appointment with ID:", appointment_id);
    
    const appointmentsController = require('./controllers/appointmentsController');
    const req = { user: { id: doctor_id, role: 'doctor' }, params: { id: appointment_id }, body: { status: 'confirmed' } };
    const res = {
      status: (code) => ({ json: (data) => console.log('Confirm Appt Response:', code, data) }),
      json: (data) => {
        console.log('Confirm Appt Response:', 200, data);
        
        db.get(`SELECT * FROM consultations WHERE appointment_id = ?`, [appointment_id], (err, consultation) => {
          console.log("2. DB Consultation record:", consultation);
          
          const consultationsController = require('./controllers/consultationsController');
          const reqPatient = { user: { id: patient_id, role: 'patient' } };
          const resPatient = {
             status: (code) => ({ json: (data) => console.log('GET /my Response:', code, data) }),
             json: (data) => console.log('GET /my Response:', 200, JSON.stringify(data, null, 2))
          };
          consultationsController.getMyPatientConsultations(reqPatient, resPatient);
          
          const reqDoctor = { user: { id: doctor_id, role: 'doctor' } };
          const resDoctor = {
             status: (code) => ({ json: (data) => console.log('GET /doctor Response:', code, data) }),
             json: (data) => console.log('GET /doctor Response:', 200, JSON.stringify(data, null, 2))
          };
          consultationsController.getDoctorConsultations(reqDoctor, resDoctor);
        });
      }
    };
    
    appointmentsController.updateAppointmentStatus(req, res);
  });
}

runTests();
