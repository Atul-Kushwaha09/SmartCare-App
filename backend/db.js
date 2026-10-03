const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbName = process.env.DB_NAME || 'smartcare.db';
const dbPath = path.resolve(__dirname, dbName);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Audit Logs table
      db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Patients table
      db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Doctors table
      db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialization TEXT,
        qualification TEXT,
        experience INTEGER,
        availability TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Appointments table
      db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        reason TEXT,
        status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Queue Tokens table
      db.run(`CREATE TABLE IF NOT EXISTS queue_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        queue_date TEXT NOT NULL,
        token_number TEXT NOT NULL,
        status TEXT CHECK(status IN ('waiting', 'called', 'completed', 'cancelled')) NOT NULL DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
      // Consultations table
      db.run(`CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('waiting', 'active', 'completed', 'cancelled')) NOT NULL DEFAULT 'waiting',
        started_at DATETIME,
        ended_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Consultation Messages table
      db.run(`CREATE TABLE IF NOT EXISTS consultation_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Medical Records table
      db.run(`CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_id INTEGER,
        record_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
      )`);

      // Prescriptions table
      db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medical_record_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        medicine_name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        duration TEXT,
        instructions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // Lab Reports table
      db.run(`CREATE TABLE IF NOT EXISTS lab_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medical_record_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        test_name TEXT NOT NULL,
        result_summary TEXT,
        report_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
      // Lab Tests table
      db.run(`CREATE TABLE IF NOT EXISTS lab_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        duration_minutes INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (!err) {
          // Insert sample demo tests if none exist
          db.get("SELECT COUNT(*) as count FROM lab_tests", (err, row) => {
            if (row && row.count === 0) {
              const tests = [
                ['CBC', 'Complete Blood Count (Demo)', 50.0, 15],
                ['Blood Glucose', 'Fasting Blood Sugar (Demo)', 20.0, 10],
                ['Lipid Profile', 'Cholesterol levels (Demo)', 60.0, 20],
                ['Thyroid Profile', 'T3, T4, TSH (Demo)', 70.0, 15],
                ['Liver Function Test', 'LFT (Demo)', 80.0, 20]
              ];
              const stmt = db.prepare("INSERT INTO lab_tests (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)");
              tests.forEach(t => stmt.run(t));
              stmt.finalize();
            }
          });
        }
      });

      // Lab Bookings table
      db.run(`CREATE TABLE IF NOT EXISTS lab_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        lab_test_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        status TEXT CHECK(status IN ('booked', 'confirmed', 'completed', 'cancelled')) NOT NULL DEFAULT 'booked',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
      )`);

      // Lab Results table
      db.run(`CREATE TABLE IF NOT EXISTS lab_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL UNIQUE,
        patient_id INTEGER NOT NULL,
        lab_test_id INTEGER NOT NULL,
        result_summary TEXT NOT NULL,
        report_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES lab_bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
      )`);

      // Medicines table
      db.run(`CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        generic_name TEXT,
        description TEXT,
        category TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (!err) {
          db.get("SELECT COUNT(*) as count FROM medicines", (err, row) => {
            if (row && row.count === 0) {
              const medicines = [
                ['Paracetamol', 'Paracetamol', 'Demo description for paracetamol', 'Pain Relief'],
                ['Amoxicillin', 'Amoxicillin', 'Demo description for amoxicillin', 'Antibiotic'],
                ['Cetirizine', 'Cetirizine', 'Demo description for cetirizine', 'Antihistamine'],
                ['Omeprazole', 'Omeprazole', 'Demo description for omeprazole', 'Antacid'],
                ['Azithromycin', 'Azithromycin', 'Demo description for azithromycin', 'Antibiotic']
              ];
              const stmt = db.prepare("INSERT INTO medicines (name, generic_name, description, category) VALUES (?, ?, ?, ?)");
              medicines.forEach(m => stmt.run(m));
              stmt.finalize();
            }
          });
        }
      });

      // Pharmacies table
      db.run(`CREATE TABLE IF NOT EXISTS pharmacies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        phone TEXT,
        latitude REAL,
        longitude REAL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (!err) {
          db.get("SELECT COUNT(*) as count FROM pharmacies", (err, row) => {
            if (row && row.count === 0) {
              const pharmacies = [
                ['SmartCare Demo Pharmacy 1', '123 Demo St', 'Demo City', '123-456-7890', 0.0, 0.0],
                ['SmartCare Demo Pharmacy 2', '456 Sample Ave', 'Demo City', '987-654-3210', 0.0, 0.0],
                ['SmartCare Demo Pharmacy 3', '789 Test Blvd', 'Demo City', '555-555-5555', 0.0, 0.0]
              ];
              const stmt = db.prepare("INSERT INTO pharmacies (name, address, city, phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)");
              pharmacies.forEach(p => stmt.run(p));
              stmt.finalize();
            }
          });
        }
      });

      // Pharmacy Inventory table
      db.run(`CREATE TABLE IF NOT EXISTS pharmacy_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pharmacy_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        availability_status TEXT CHECK(availability_status IN ('available', 'low_stock', 'out_of_stock')) NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
        UNIQUE(pharmacy_id, medicine_id)
      )`, (err) => {
        if (!err) {
          db.get("SELECT COUNT(*) as count FROM pharmacy_inventory", (err, row) => {
            if (row && row.count === 0) {
              // Wait for medicines and pharmacies to be inserted, then insert inventory
              setTimeout(() => {
                const inventory = [
                  // Pharmacy 1 (id: 1)
                  [1, 1, 50, 'available'], // Paracetamol
                  [1, 3, 5, 'low_stock'],  // Cetirizine
                  // Pharmacy 2 (id: 2)
                  [2, 1, 100, 'available'], // Paracetamol
                  [2, 4, 30, 'available'], // Omeprazole
                  // Pharmacy 3 (id: 3)
                  [3, 5, 0, 'out_of_stock'] // Azithromycin
                ];
                const stmt = db.prepare("INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, availability_status) VALUES (?, ?, ?, ?)");
                inventory.forEach(i => stmt.run(i));
                stmt.finalize();
              }, 1000); // 1s timeout to ensure parent records exist (sqlite operations are mostly sequential but run in background)
            }
          });
        }
      });
    });
  }
});

module.exports = db;
