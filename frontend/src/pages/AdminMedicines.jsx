import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({ name: '', generic_name: '', description: '', category: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/medicines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/medicines', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        fetchMedicines();
        setFormData({ name: '', generic_name: '', description: '', category: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to create medicine:", error);
    }
  };

  const handleToggleActive = async (med) => {
    try {
      await fetch(`http://localhost:5000/api/admin/medicines/${med.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...med, is_active: med.is_active ? 0 : 1 })
      });
      fetchMedicines();
    } catch (error) {
      console.error("Failed to update medicine:", error);
    }
  };

  return (
    <div className="container">
      <h2>Manage Medicines (Admin)</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Add New Medicine</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Generic Name</label>
            <input type="text" value={formData.generic_name} onChange={(e) => setFormData({...formData, generic_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
          </div>
          <button type="submit" className="btn">Add Medicine</button>
        </form>
      </div>

      <h3>Medicine List</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Generic Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(med => (
            <tr key={med.id}>
              <td>{med.id}</td>
              <td>{med.name}</td>
              <td>{med.generic_name}</td>
              <td>{med.category}</td>
              <td>{med.is_active ? 'Active' : 'Inactive'}</td>
              <td>
                <button className="btn" style={{ background: med.is_active ? '#dc3545' : '#28a745' }} onClick={() => handleToggleActive(med)}>
                  {med.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminMedicines;
