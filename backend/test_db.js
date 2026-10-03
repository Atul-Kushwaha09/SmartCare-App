const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'smartcare.db');
const db = new sqlite3.Database(dbPath);

async function run() {
  const runQuery = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const appointments = await runQuery('SELECT * FROM appointments ORDER BY id DESC LIMIT 5');
  console.log('Appointments:', appointments);

  const consultations = await runQuery('SELECT * FROM consultations ORDER BY id DESC LIMIT 5');
  console.log('Consultations:', consultations);

  db.close();
}

run();
