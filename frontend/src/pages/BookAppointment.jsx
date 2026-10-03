import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/doctors/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDoctor(data.doctor);
        } else {
          setError(data.message);
        }
      });
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctor_id: doctorId, appointment_date: date, appointment_time: time, reason })
      });
      const data = await res.json();
      
      if (data.success) {
        navigate('/patient/appointments');
      } else {
        setError(data.message); // e.g. "Selected appointment slot is no longer available."
      }
    } catch (err) {
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return <div className="container" style={{marginTop: '2rem'}}>Loading doctor info...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem', maxWidth: '600px' }}>
      <div className="service-card">
        <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Book Appointment</h2>
        
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <h3>{doctor.name}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{doctor.specialization || 'General'}</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label>Time</label>
            <input 
              type="time" 
              value={time} 
              onChange={e => setTime(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label>Reason (Optional)</label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', minHeight: '80px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
