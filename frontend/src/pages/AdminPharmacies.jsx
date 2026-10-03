import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '', city: '', phone: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/pharmacies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPharmacies(data.pharmacies);
      }
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/pharmacies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({...formData, latitude: 0.0, longitude: 0.0})
      });
      const data = await response.json();
      if (data.success) {
        fetchPharmacies();
        setFormData({ name: '', address: '', city: '', phone: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to create pharmacy:", error);
    }
  };

  const handleToggleActive = async (phm) => {
    try {
      await fetch(`http://localhost:5000/api/admin/pharmacies/${phm.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...phm, is_active: phm.is_active ? 0 : 1 })
      });
      fetchPharmacies();
    } catch (error) {
      console.error("Failed to update pharmacy:", error);
    }
  };

  return (
    <div className="container">
      <h2>Manage Pharmacies (Admin)</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Add New Pharmacy</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>City</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <button type="submit" className="btn">Add Pharmacy</button>
        </form>
      </div>

      <h3>Pharmacy List</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>City</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pharmacies.map(phm => (
            <tr key={phm.id}>
              <td>{phm.id}</td>
              <td>{phm.name}</td>
              <td>{phm.city}</td>
              <td>{phm.phone}</td>
              <td>{phm.is_active ? 'Active' : 'Inactive'}</td>
              <td>
                <button className="btn" style={{ background: phm.is_active ? '#dc3545' : '#28a745' }} onClick={() => handleToggleActive(phm)}>
                  {phm.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPharmacies;
