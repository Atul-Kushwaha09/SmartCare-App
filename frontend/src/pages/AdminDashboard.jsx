import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, Server } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
      <div className="service-card" style={{ maxWidth: '900px', margin: '0 auto', borderColor: '#333' }}>
        <h1 style={{ color: '#333', marginBottom: '1rem' }}>SmartCare Admin Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Welcome, {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Role: {user.role}</p>
          </div>
        </div>

        <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <h4>Navigation</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link to="/admin/lab-tests" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>Manage Lab Tests</Link>
            <Link to="/admin/lab-bookings" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>Manage Lab Bookings</Link>
            <Link to="/admin/lab-results" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>Enter Lab Results</Link>
            <Link to="/admin/medicines" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>Manage Medicines</Link>
            <Link to="/admin/pharmacies" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>Manage Pharmacies</Link>
            <Link to="/admin/inventory" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>Manage Inventory</Link>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            [ Manage Users | System Logs | Global Settings ]
          </p>
        </div>

        {/* Research Architecture Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Server size={24} /> Research Architecture
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* B1 Card */}
            <div style={{ border: '1px solid var(--border)', padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
              <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>B1 — Baseline Architecture</h3>
              <p style={{ color: 'var(--text-secondary)' }}>"Standard authentication and basic access control"</p>
            </div>
            
            {/* B2 Card */}
            <div style={{ border: '1px solid var(--accent)', padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f0f9ff' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} /> B2 — Privacy-Preserving Architecture
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>"Enhanced security and privacy mechanisms"</p>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'bold' }}>
            Status: Experimental evaluation: Not yet performed
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
