import { useState, useEffect } from 'react';

const DoctorQueue = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/queue/doctor', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTokens(data.queue);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
    // Refresh queue automatically
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/queue/call', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        fetchQueue();
      } else {
        alert(data.message); // e.g. "No waiting patients in the queue."
      }
    } catch (err) {
      alert('Failed to call next patient');
    }
  };

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/queue/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        fetchQueue();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to complete consultation');
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--secondary)' }}>Live Patient Queue</h2>
        <button onClick={handleCallNext} className="btn btn-primary" style={{ backgroundColor: 'var(--secondary)' }}>
          Call Next Patient
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tokens.length === 0 ? (
        <div className="service-card" style={{ textAlign: 'center' }}>
          <p>No patients in the queue.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tokens.map((token, index) => (
            <div key={token.id} style={{ 
              padding: '1.5rem', 
              backgroundColor: token.status === 'called' ? '#fffbeb' : 'white', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-md)',
              borderLeft: `6px solid ${token.status === 'called' ? '#f59e0b' : 'var(--secondary)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Token</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: token.status === 'called' ? '#d97706' : 'var(--text-primary)' }}>
                    {token.token_number}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Patient: {token.patient_name}</h3>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Status: <strong style={{ 
                      textTransform: 'uppercase',
                      color: token.status === 'called' ? '#d97706' : 'inherit'
                    }}>{token.status}</strong>
                  </div>
                  {index === 0 && token.status === 'waiting' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                      Next in line
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {token.status === 'called' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a href={`/doctor/consultation/${token.appointment_id}`} className="btn btn-primary" style={{ backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', textAlign: 'center', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                      Start Consultation
                    </a>
                    <button onClick={() => handleComplete(token.id)} className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>
                      Mark Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorQueue;
