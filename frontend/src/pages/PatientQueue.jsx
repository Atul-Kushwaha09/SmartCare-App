import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PatientQueue = () => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/queue/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.active) {
          setQueueData(data);
        } else {
          setQueueData(null);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
    // Refresh queue every 15 seconds
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Digital Queue Tracker</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : !queueData ? (
        <div className="service-card" style={{ textAlign: 'center' }}>
          <p>You don't have any active queue tokens today.</p>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            To get a token, book an appointment and "Check In" from your Appointments page.
          </p>
          <Link to="/patient/appointments" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Go to My Appointments
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            padding: '2rem', 
            backgroundColor: 'white', 
            borderRadius: 'var(--radius-md)', 
            boxShadow: 'var(--shadow-md)',
            borderTop: `6px solid ${queueData.status === 'called' ? '#f59e0b' : queueData.status === 'completed' ? '#10b981' : 'var(--primary)'}`,
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>My Token</h3>
            <div style={{ 
              fontSize: '4rem', 
              fontWeight: '900', 
              color: queueData.status === 'called' ? '#d97706' : 'var(--primary)',
              margin: '1rem 0'
            }}>
              {queueData.myToken}
            </div>
            
            <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Status: <strong style={{ 
                textTransform: 'uppercase',
                color: queueData.status === 'called' ? '#d97706' : (queueData.status === 'completed' ? '#059669' : 'inherit')
              }}>{queueData.status}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '2rem 0', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Token</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{queueData.currentToken}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Patients Ahead</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{queueData.patientsAhead}</p>
              </div>
            </div>
            
            {queueData.status === 'called' && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#fef3c7', 
                color: '#92400e', 
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                animation: 'pulse 2s infinite',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                Please proceed to Doctor {queueData.doctorName}'s room immediately.
                <a href={`/patient/consultation/${queueData.appointmentId}`} className="btn btn-primary" style={{ backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', textAlign: 'center', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                  Join Consultation
                </a>
              </div>
            )}
            
            {queueData.status === 'waiting' && (
              <p style={{ color: 'var(--text-secondary)' }}>
                Doctor: {queueData.doctorName}
              </p>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PatientQueue;
