import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAppointments = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/appointments/my', {
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

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        fetchAppointments(); // Refresh
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  const handleConfirm = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Checked in successfully! Your Queue Token is ${data.token.token_number}`);
        fetchAppointments(); // Refresh
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to check in');
    }
  };

  const handleJoinConsultation = async (appId) => {
    try {
      const { data } = await api.post('/consultations', { appointment_id: appId });
      if (data.success) {
        navigate(`/patient/consultation/${data.consultation.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join consultation');
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>My Appointments</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>You have no appointments. <Link to="/patient/doctors">Book one now</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map(app => (
            <div key={app.id} style={{ 
              padding: '1.5rem', 
              backgroundColor: 'white', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-sm)',
              borderLeft: `4px solid ${app.status === 'scheduled' ? 'var(--primary)' : app.status === 'confirmed' ? 'var(--secondary)' : '#94a3b8'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Dr. {app.doctor_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <strong>Date:</strong> {app.appointment_date} | <strong>Time:</strong> {app.appointment_time}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{app.status}</span>
                  </p>
                  {app.reason && <p style={{ marginTop: '0.5rem' }}><strong>Reason:</strong> {app.reason}</p>}
                  
                  {app.token_number && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>
                      Queue Token: {app.token_number}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  {app.status === 'scheduled' && (
                    <>
                      <button onClick={() => handleConfirm(app.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        Check In (Get Token)
                      </button>
                      <button onClick={() => handleCancel(app.id)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderColor: '#ef4444', color: '#ef4444' }}>
                        Cancel
                      </button>
                    </>
                  )}
                  {app.status === 'confirmed' && (
                    <button onClick={() => handleJoinConsultation(app.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb' }}>
                      Join Consultation
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

export default PatientAppointments;
