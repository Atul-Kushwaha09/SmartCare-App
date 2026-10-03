module.exports = {
  baseUrl: 'http://localhost:5000',
  credentials: {
    patient: {
      email: 'patient@test.com',
      password: 'password123'
    },
    doctor: {
      email: 'doctor@test.com',
      password: 'password123'
    }
  },
  experimentParams: {
    WARMUP_REQUESTS: parseInt(process.env.WARMUP_REQUESTS) || 10,
    REQUEST_COUNT: parseInt(process.env.REQUEST_COUNT) || 100,
    CONCURRENCY: parseInt(process.env.CONCURRENCY) || 10
  }
};
