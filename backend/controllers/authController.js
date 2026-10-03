const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logAction } = require('../utils/auditLogger');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for registration' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (user) return res.status(400).json({ success: false, message: 'Email already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, role],
        function (err) {
          if (err) return res.status(500).json({ success: false, message: 'Error registering user' });
          
          const userId = this.lastID;
          
          if (role === 'patient') {
            db.run(`INSERT INTO patients (user_id) VALUES (?)`, [userId]);
          } else if (role === 'doctor') {
            db.run(`INSERT INTO doctors (user_id) VALUES (?)`, [userId]);
          }

          res.status(201).json({ success: true, message: 'User registered successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!user) {
      logAction(null, 'LOGIN_FAILURE', null, { email, reason: 'user_not_found' });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logAction(user.id, 'LOGIN_FAILURE', null, { reason: 'invalid_password' });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Reasonable expiration for prototype
    );

    logAction(user.id, 'LOGIN_SUCCESS', null, { role: user.role });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};

exports.getMe = (req, res) => {
  db.get(`SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, user });
  });
};

// Create a dummy admin for testing purposes
exports.setupAdmin = async (req, res) => {
  const email = "admin@smartcare.local";
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (user) return res.json({ success: true, message: 'Admin already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    
    db.run(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ["System Admin", email, hashedPassword, "admin"],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Error creating admin' });
        res.json({ success: true, message: 'Admin created successfully. email: admin@smartcare.local, pass: admin123' });
      }
    );
  });
}
