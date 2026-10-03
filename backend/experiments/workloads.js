const config = require('./config');

const workloads = [
  {
    name: 'Patient Login',
    endpoint: '/api/auth/login',
    method: 'POST',
    requiresAuth: false,
    role: 'patient',
    getBody: () => ({
      email: config.credentials.patient.email,
      password: config.credentials.patient.password
    })
  },
  {
    name: 'Doctor Login',
    endpoint: '/api/auth/login',
    method: 'POST',
    requiresAuth: false,
    role: 'doctor',
    getBody: () => ({
      email: config.credentials.doctor.email,
      password: config.credentials.doctor.password
    })
  },
  {
    name: 'Retrieve Patient Appointments',
    endpoint: '/api/appointments/my-appointments',
    method: 'GET',
    requiresAuth: true,
    role: 'patient'
  },
  {
    name: 'Create Appointment',
    endpoint: '/api/appointments',
    method: 'POST',
    requiresAuth: true,
    role: 'patient',
    getBody: () => ({
      doctor_id: 3, // Doctor
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      reason: 'Experimental Test'
    })
  },
  {
    name: 'Retrieve Doctor Queue',
    endpoint: '/api/queue/doctor-queue',
    method: 'GET',
    requiresAuth: true,
    role: 'doctor'
  },
  {
    name: 'Retrieve Consultation Information',
    endpoint: '/api/consultations/my',
    method: 'GET',
    requiresAuth: true,
    role: 'patient'
  },
  {
    name: 'Retrieve Patient Medical Records',
    endpoint: '/api/medical-records/my',
    method: 'GET',
    requiresAuth: true,
    role: 'patient'
  },
  {
    name: 'Retrieve Patient Lab Bookings',
    endpoint: '/api/lab/my-bookings',
    method: 'GET',
    requiresAuth: true,
    role: 'patient'
  },
  {
    name: 'Search Medicine Availability',
    endpoint: '/api/medicines/search?q=Paracetamol',
    method: 'GET',
    requiresAuth: true,
    role: 'patient'
  }
];

module.exports = workloads;
