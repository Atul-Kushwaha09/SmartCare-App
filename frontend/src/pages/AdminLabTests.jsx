import React, { useState, useEffect } from 'react';

const AdminLabTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true });
  
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lab/admin/tests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTests(data.tests);
      } else {
        setError(data.message || 'Failed to load tests');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.price || !formData.duration_minutes) {
      setFormError('Please fill required fields');
      return;
    }

    const url = formData.id 
      ? `http://localhost:5000/api/lab/admin/tests/${formData.id}` 
      : `http://localhost:5000/api/lab/admin/tests`;
    
    const method = formData.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsFormVisible(false);
        setFormData({ id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true });
        fetchTests();
      } else {
        setFormError(data.message || 'Failed to save test');
      }
    } catch (err) {
      setFormError('Error connecting to server');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this test?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/lab/admin/tests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        fetchTests();
      }
    } catch (err) {
      alert('Failed to deactivate test');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Manage Lab Tests</h2>
      
      <button className="btn btn-primary" onClick={() => {
        setFormData({ id: null, name: '', description: '', price: '', duration_minutes: '', is_active: true });
        setIsFormVisible(!isFormVisible);
      }}>
        {isFormVisible ? 'Cancel' : 'Add New Lab Test'}
      </button>

      {isFormVisible && (
        <form onSubmit={handleSave} className="card" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} required />
          </div>
          {formData.id && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
              <label style={{ margin: 0 }}>Is Active</label>
            </div>
          )}
          {formError && <div className="error-message">{formError}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}>Save</button>
        </form>
      )}

      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id}>
                <td>{test.id}</td>
                <td>{test.name}</td>
                <td>${test.price.toFixed(2)}</td>
                <td>{test.duration_minutes}m</td>
                <td>{test.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => {
                    setFormData(test);
                    setIsFormVisible(true);
                  }}>Edit</button>
                  {test.is_active && (
                    <button className="btn btn-danger" onClick={() => handleDelete(test.id)} style={{ marginLeft: '10px' }}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLabTests;
