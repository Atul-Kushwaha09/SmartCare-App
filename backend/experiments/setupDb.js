const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', 'experiment.db');
const db = new sqlite3.Database(dbPath);

const password = 'password123';
const hash = bcrypt.hashSync(password, 10);

db.serialize(() => {
  // Update patient
  db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [hash, 'patient@test.com']);
  // Update doctor
  db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [hash, 'doctor@test.com']);
  
  console.log('Test users passwords updated in experiment database.');
});
