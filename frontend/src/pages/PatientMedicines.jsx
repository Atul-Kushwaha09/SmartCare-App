import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function PatientMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [availability, setAvailability] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async (searchQuery = '') => {
    try {
      const url = searchQuery ? `http://localhost:5000/api/medicines?search=${searchQuery}` : 'http://localhost:5000/api/medicines';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines(search);
  };

  const checkAvailability = async (medicine) => {
    setSelectedMedicine(medicine);
    try {
      const response = await fetch(`http://localhost:5000/api/medicines/${medicine.id}/availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailability(data.availability);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    }
  };

  return (
    <div className="container">
      <h2>Medicine Search</h2>
      <p className="notice">Note: This is a research prototype. Information shown is DEMO/SAMPLE data. We do not provide medical advice, diagnosis, or dosage recommendations.</p>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search medicine..."
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit" className="btn">Search</button>
      </form>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Available Demo Medicines</h3>
          {medicines.map(med => (
            <div key={med.id} className="card" style={{ marginBottom: '10px' }}>
              <h4>{med.name}</h4>
              <p><strong>Generic:</strong> {med.generic_name}</p>
              <p><strong>Category:</strong> {med.category}</p>
              <p><strong>Description:</strong> {med.description}</p>
              <button className="btn" onClick={() => checkAvailability(med)}>Check Pharmacy Availability</button>
            </div>
          ))}
        </div>

        {selectedMedicine && (
          <div style={{ flex: 1 }}>
            <h3>Availability for {selectedMedicine.name}</h3>
            <p className="notice">DEMO/SAMPLE inventory information only.</p>
            {availability.length === 0 ? (
              <p>No demo pharmacies have this medicine in stock.</p>
            ) : (
              availability.map((phm, index) => (
                <div key={index} className="card" style={{ marginBottom: '10px' }}>
                  <h4>{phm.pharmacy}</h4>
                  <p><strong>Address:</strong> {phm.address}, {phm.city}</p>
                  <p><strong>Contact:</strong> {phm.phone}</p>
                  <p>
                    <strong>Availability:</strong>{' '}
                    <span style={{ 
                      color: phm.availability_status === 'available' ? 'green' : phm.availability_status === 'low_stock' ? 'orange' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {phm.availability_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Quantity:</strong> {phm.quantity}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientMedicines;
