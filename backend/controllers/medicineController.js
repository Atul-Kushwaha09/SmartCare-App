const db = require('../db');

// --- PATIENT APIs ---

exports.getMedicines = (req, res) => {
  const search = req.query.search;
  let query = "SELECT * FROM medicines WHERE is_active = 1";
  let params = [];
  
  if (search) {
    query += " AND (name LIKE ? OR generic_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, medicines: rows });
  });
};

exports.getPharmacies = (req, res) => {
  db.all("SELECT * FROM pharmacies WHERE is_active = 1", [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, pharmacies: rows });
  });
};

exports.getPharmacyById = (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM pharmacies WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!row) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    res.json({ success: true, pharmacy: row });
  });
};

exports.getMedicineAvailability = (req, res) => {
  const medicineId = req.params.id;
  const query = `
    SELECT p.id as pharmacy_id, p.name as pharmacy, p.address, p.city, p.phone, 
           i.availability_status, i.quantity, m.name as medicine
    FROM pharmacy_inventory i
    JOIN pharmacies p ON i.pharmacy_id = p.id
    JOIN medicines m ON i.medicine_id = m.id
    WHERE i.medicine_id = ? AND p.is_active = 1 AND m.is_active = 1
  `;
  
  db.all(query, [medicineId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, availability: rows });
  });
};

// --- ADMIN APIs ---

// Admin - Medicines
exports.adminGetMedicines = (req, res) => {
  db.all("SELECT * FROM medicines", [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, medicines: rows });
  });
};

exports.adminCreateMedicine = (req, res) => {
  const { name, generic_name, description, category } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Medicine name is required' });
  
  const query = "INSERT INTO medicines (name, generic_name, description, category) VALUES (?, ?, ?, ?)";
  db.run(query, [name, generic_name, description, category], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Medicine created', id: this.lastID });
  });
};

exports.adminUpdateMedicine = (req, res) => {
  const { name, generic_name, description, category, is_active } = req.body;
  const id = req.params.id;
  
  const query = "UPDATE medicines SET name = ?, generic_name = ?, description = ?, category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  db.run(query, [name, generic_name, description, category, is_active, id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Medicine updated' });
  });
};

exports.adminDeleteMedicine = (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM medicines WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Medicine deleted' });
  });
};

// Admin - Pharmacies
exports.adminGetPharmacies = (req, res) => {
  db.all("SELECT * FROM pharmacies", [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, pharmacies: rows });
  });
};

exports.adminCreatePharmacy = (req, res) => {
  const { name, address, city, phone, latitude, longitude } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Pharmacy name is required' });
  
  const query = "INSERT INTO pharmacies (name, address, city, phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(query, [name, address, city, phone, latitude, longitude], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Pharmacy created', id: this.lastID });
  });
};

exports.adminUpdatePharmacy = (req, res) => {
  const { name, address, city, phone, latitude, longitude, is_active } = req.body;
  const id = req.params.id;
  
  const query = "UPDATE pharmacies SET name = ?, address = ?, city = ?, phone = ?, latitude = ?, longitude = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  db.run(query, [name, address, city, phone, latitude, longitude, is_active, id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Pharmacy updated' });
  });
};

exports.adminDeletePharmacy = (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM pharmacies WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Pharmacy deleted' });
  });
};

// Admin - Inventory
exports.adminGetInventory = (req, res) => {
  const query = `
    SELECT i.*, p.name as pharmacy_name, m.name as medicine_name
    FROM pharmacy_inventory i
    JOIN pharmacies p ON i.pharmacy_id = p.id
    JOIN medicines m ON i.medicine_id = m.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, inventory: rows });
  });
};

exports.adminCreateInventory = (req, res) => {
  const { pharmacy_id, medicine_id, quantity } = req.body;
  if (!pharmacy_id || !medicine_id) return res.status(400).json({ success: false, message: 'Pharmacy ID and Medicine ID are required' });
  if (quantity < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
  
  // Check if medicine and pharmacy exist and are active
  db.get("SELECT is_active FROM medicines WHERE id = ?", [medicine_id], (err, med) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (!med.is_active) return res.status(400).json({ success: false, message: 'Cannot add inventory for inactive medicine' });
    
    db.get("SELECT is_active FROM pharmacies WHERE id = ?", [pharmacy_id], (err, phm) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!phm) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      if (!phm.is_active) return res.status(400).json({ success: false, message: 'Cannot add inventory for inactive pharmacy' });
      
      let status = 'out_of_stock';
      if (quantity > 10) status = 'available';
      else if (quantity > 0) status = 'low_stock';
      
      const query = "INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, quantity, availability_status) VALUES (?, ?, ?, ?)";
      db.run(query, [pharmacy_id, medicine_id, quantity, status], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Database error or duplicate inventory' });
        res.json({ success: true, message: 'Inventory created', id: this.lastID });
      });
    });
  });
};

exports.adminUpdateInventory = (req, res) => {
  const { quantity } = req.body;
  const id = req.params.id;
  
  if (quantity < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
  
  let status = 'out_of_stock';
  if (quantity > 10) status = 'available';
  else if (quantity > 0) status = 'low_stock';
  
  const query = "UPDATE pharmacy_inventory SET quantity = ?, availability_status = ?, updated_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP WHERE id = ?";
  db.run(query, [quantity, status, id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Inventory updated' });
  });
};

exports.adminDeleteInventory = (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM pharmacy_inventory WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, message: 'Inventory deleted' });
  });
};
