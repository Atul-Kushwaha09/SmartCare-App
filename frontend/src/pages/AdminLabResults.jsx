import React, { useState, useEffect } from 'react';

const AdminLabResults = () => {
  const [results, setResults] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({ booking_id: '', result_summary: '', report_date: new Date().toISOString().split('T')[0] });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchResults();
    fetchBookings();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lab/admin/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResults(data.results);
      } else {
        setError(data.message || 'Failed to load results');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lab/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // We only want completed bookings that don't already have results
        // Wait, the API creates results. Let's just store completed ones.
        setBookings(data.bookings.filter(b => b.status === 'completed'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.booking_id || !formData.result_summary || !formData.report_date) {
      setFormError('Please fill required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/lab/admin/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsFormVisible(false);
        setFormData({ booking_id: '', result_summary: '', report_date: new Date().toISOString().split('T')[0] });
        fetchResults();
      } else {
        setFormError(data.message || 'Failed to save result');
      }
    } catch (err) {
      setFormError('Error connecting to server');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Manage Lab Results</h2>
      
      <button className="btn btn-primary" onClick={() => setIsFormVisible(!isFormVisible)}>
        {isFormVisible ? 'Cancel' : 'Enter Lab Result'}
      </button>

      {isFormVisible && (
        <form onSubmit={handleSave} className="card" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Completed Booking</label>
            <select 
              value={formData.booking_id} 
              onChange={(e) => setFormData({...formData, booking_id: e.target.value})} 
              required
            >
              <option value="">Select a booking...</option>
              {bookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  ID: {booking.id} - {booking.patient_name} ({booking.test_name})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Report Date</label>
            <input 
              type="date" 
              value={formData.report_date} 
              onChange={(e) => setFormData({...formData, report_date: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Result Summary</label>
            <textarea 
              value={formData.result_summary} 
              onChange={(e) => setFormData({...formData, result_summary: e.target.value})} 
              rows="5"
              required 
            />
          </div>
          {formError && <div className="error-message">{formError}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}>Save Result</button>
        </form>
      )}

      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Test</th>
              <th>Booking ID</th>
              <th>Report Date</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {results.map(result => (
              <tr key={result.id}>
                <td>{result.id}</td>
                <td>{result.patient_name}</td>
                <td>{result.test_name}</td>
                <td>{result.booking_id}</td>
                <td>{result.report_date}</td>
                <td>
                  <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {result.result_summary}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLabResults;
