require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./db'); // Initialize DB

const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const doctorsRoutes = require('./routes/doctorsRoutes');
const appointmentsRoutes = require('./routes/appointmentsRoutes');
const queueRoutes = require('./routes/queueRoutes');

const consultationsRoutes = require('./routes/consultationsRoutes');
const medicalRecordsRoutes = require('./routes/medicalRecordsRoutes');
const labRoutes = require('./routes/labRoutes');
const medicineRoutes = require('./routes/medicineRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Privacy Configurations (B1 vs B2)
const isB2 = process.env.ARCHITECTURE_MODE === 'B2';

if (isB2) {
  // Helmet for security headers
  app.use(helmet());
  
  // Stricter CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
} else {
  // Basic CORS for B1
  app.use(cors({ origin: '*' }));
}

app.use(express.json());

// Rate Limiting (B2 only, applied to auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Removed duplicate health endpoint

// Routes
if (isB2) {
  app.use('/api/auth', authLimiter, authRoutes);
} else {
  app.use('/api/auth', authRoutes);
}
app.use('/api/test', testRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/lab', labRoutes);
app.use('/api', medicineRoutes);

// Basic health check endpoint for testing
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartCare API is running',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime()
  });
});

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: isB2 ? (process.env.FRONTEND_URL || 'http://localhost:5173') : '*',
    methods: isB2 ? ['GET', 'POST'] : undefined
  }
});

require('./socket')(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
