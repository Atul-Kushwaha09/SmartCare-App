import React, { useState, useEffect } from 'react';

const PatientLabResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lab/results/my', {
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

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>My Lab Results</h2>
      
      {results.length === 0 ? (
        <p>You have no lab test results.</p>
      ) : (
        <div className="card-grid">
          {results.map(result => (
            <div key={result.id} className="card">
              <h3>{result.test_name}</h3>
              <p><strong>Report Date:</strong> {result.report_date}</p>
              <div style={{ marginTop: '15px' }}>
                <strong>Result Summary:</strong>
                <p style={{ whiteSpace: 'pre-line', background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
                  {result.result_summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientLabResults;
