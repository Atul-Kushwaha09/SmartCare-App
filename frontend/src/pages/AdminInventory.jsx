import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [formData, setFormData] = useState({ pharmacy_id: '', medicine_id: '', quantity: '' });
  const [editQuantities, setEditQuantities] = useState({});
  const { token } = useAuth();

  useEffect(() => {
    fetchInventory();
    fetchMedicines();
    fetchPharmacies();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  const fetchMedicines = async () => {
    const response = await fetch('http://localhost:5000/api/admin/medicines', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (data.success) setMedicines(data.medicines.filter(m => m.is_active));
  };

  const fetchPharmacies = async () => {
    const response = await fetch('http://localhost:5000/api/admin/pharmacies', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (data.success) setPharmacies(data.pharmacies.filter(p => p.is_active));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        fetchInventory();
        setFormData({ pharmacy_id: '', medicine_id: '', quantity: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to create inventory:", error);
    }
  };

  const handleUpdateQuantity = async (invId) => {
    const qty = editQuantities[invId];
    if (qty === undefined) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/inventory/${invId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ quantity: parseInt(qty, 10) })
      });
      const data = await response.json();
      if (data.success) {
        fetchInventory();
        const newEq = {...editQuantities};
        delete newEq[invId];
        setEditQuantities(newEq);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to update inventory:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory record?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchInventory();
    } catch (error) {
      console.error("Failed to delete inventory:", error);
    }
  };

  return (
    <div className="container">
      <h2>Manage Inventory (Admin)</h2>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Add Inventory Record</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Pharmacy</label>
            <select value={formData.pharmacy_id} onChange={(e) => setFormData({...formData, pharmacy_id: e.target.value})} required>
              <option value="">Select Pharmacy...</option>
              {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Medicine</label>
            <select value={formData.medicine_id} onChange={(e) => setFormData({...formData, medicine_id: e.target.value})} required>
              <option value="">Select Medicine...</option>
              {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
          </div>
          <button type="submit" className="btn">Add Inventory</button>
        </form>
      </div>

      <h3>Inventory Records</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Pharmacy</th>
            <th>Medicine</th>
            <th>Status</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(inv => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.pharmacy_name}</td>
              <td>{inv.medicine_name}</td>
              <td>
                <span style={{ 
                  color: inv.availability_status === 'available' ? 'green' : inv.availability_status === 'low_stock' ? 'orange' : 'red',
                  fontWeight: 'bold'
                }}>
                  {inv.availability_status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td>
                <input 
                  type="number" 
                  min="0"
                  value={editQuantities[inv.id] !== undefined ? editQuantities[inv.id] : inv.quantity}
                  onChange={(e) => setEditQuantities({...editQuantities, [inv.id]: e.target.value})}
                  style={{ width: '80px', padding: '4px' }}
                />
                {editQuantities[inv.id] !== undefined && (
                  <button className="btn" style={{ marginLeft: '10px', padding: '4px 8px' }} onClick={() => handleUpdateQuantity(inv.id)}>Save</button>
                )}
              </td>
              <td>
                <button className="btn" style={{ background: '#dc3545', padding: '4px 8px' }} onClick={() => handleDelete(inv.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminInventory;
