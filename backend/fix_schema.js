const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'smartcare.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
  
  const addColumn = (col, type) => {
    return new Promise(resolve => {
      db.run(`ALTER TABLE medical_records ADD COLUMN ${col} ${type}`, (err) => {
        if (err) console.log(`Column ${col} might already exist:`, err.message);
        else console.log(`Added ${col} column`);
        resolve();
      });
    });
  };

  (async () => {
    await addColumn('record_type', 'TEXT');
    await addColumn('title', 'TEXT');
    await addColumn('description', 'TEXT');
    db.close();
  })();
});
