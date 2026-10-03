import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAppointments = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/appointments/doctor', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppointments(data.appointments);
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleJoinConsultation = async (appId) => {
    try {
      const { data } = await api.post('/consultations', { appointment_id: appId });
      if (data.success) {
        navigate(`/doctor/consultation/${data.consultation.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start consultation');
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Today's Appointments</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments scheduled for today.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map(app => (
            <div key={app.id} style={{ 
              padding: '1.5rem', 
              backgroundColor: 'white', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-sm)',
              borderLeft: `4px solid ${app.status === 'scheduled' ? 'var(--secondary)' : app.status === 'confirmed' ? '#10b981' : '#94a3b8'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Patient: {app.patient_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <strong>Time:</strong> {app.appointment_time}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{app.status}</span>
                  </p>
                  {app.reason && <p style={{ marginTop: '0.5rem' }}><strong>Reason:</strong> {app.reason}</p>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  {app.status === 'confirmed' && (
                    <button onClick={() => handleJoinConsultation(app.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                      Start Consultation
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
