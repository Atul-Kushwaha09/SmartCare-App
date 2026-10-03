import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDoctors(data.doctors);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(filter.toLowerCase()) || 
    (doc.specialization && doc.specialization.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Available Doctors</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Filter by name or specialization..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
        />
      </div>

      {loading ? (
        <p>Loading doctors...</p>
      ) : filteredDoctors.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <div className="services-grid">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="service-card">
              <h3 style={{ color: 'var(--text-primary)' }}>{doc.name}</h3>
              <p style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{doc.specialization || 'General'}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Qual: {doc.qualification || 'N/A'}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Exp: {doc.experience ? `${doc.experience} years` : 'N/A'}</p>
              
              <div style={{ marginTop: '1.5rem' }}>
                <Link to={`/patient/book-appointment/${doc.id}`} className="btn btn-primary" style={{ width: '100%' }}>Book Appointment</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientDoctors;
