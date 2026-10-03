import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function PatientPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pharmacies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPharmacies(data.pharmacies);
      }
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
    }
  };

  return (
    <div className="container">
      <h2>Demo Pharmacies</h2>
      <p className="notice">Note: This is a research prototype. These are demo pharmacies with sample data.</p>
      
      <div className="card-grid">
        {pharmacies.map(phm => (
          <div key={phm.id} className="card">
            <h3>{phm.name}</h3>
            <p><strong>Address:</strong> {phm.address}</p>
            <p><strong>City:</strong> {phm.city}</p>
            <p><strong>Phone:</strong> {phm.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientPharmacies;
