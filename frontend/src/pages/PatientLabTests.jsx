import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PatientLabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [bookingTestId, setBookingTestId] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingError, setBookingError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lab/tests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTests(data.tests);
      } else {
        setError(data.message || 'Failed to load lab tests');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTest = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!bookingDate || !bookingTime) {
      setBookingError('Please select date and time');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/lab/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lab_test_id: bookingTestId,
          booking_date: bookingDate,
          booking_time: bookingTime
        })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        navigate('/patient/lab-bookings');
      } else {
        setBookingError(data.message || 'Failed to book test');
      }
    } catch (err) {
      setBookingError('Error connecting to server');
    }
  };

  if (loading) return <div className="loading">Loading tests...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Available Lab Tests</h2>
      
      {tests.length === 0 ? (
        <p>No lab tests currently available.</p>
      ) : (
        <div className="card-grid">
          {tests.map(test => (
            <div key={test.id} className="card">
              <h3>{test.name}</h3>
              <p><strong>Description:</strong> {test.description}</p>
              <p><strong>Price:</strong> ${test.price.toFixed(2)}</p>
              <p><strong>Duration:</strong> ~{test.duration_minutes} mins</p>
              
              {bookingTestId === test.id ? (
                <form onSubmit={handleBookTest} className="booking-form" style={{marginTop: '15px'}}>
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={bookingDate} 
                      onChange={(e) => setBookingDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input 
                      type="time" 
                      value={bookingTime} 
                      onChange={(e) => setBookingTime(e.target.value)} 
                      required 
                    />
                  </div>
                  {bookingError && <div className="error-message">{bookingError}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">Confirm</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setBookingTestId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button 
                  className="btn btn-primary" 
                  style={{marginTop: '15px'}}
                  onClick={() => {
                    setBookingTestId(test.id);
                    setBookingDate('');
                    setBookingTime('');
                    setBookingError('');
                  }}
                >
                  Book Test
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientLabTests;
