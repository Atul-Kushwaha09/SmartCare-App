import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'doctor') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="service-card" style={{ maxWidth: '800px', margin: '0 auto', borderColor: 'var(--secondary)' }}>
        <h1 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>SmartCare Doctor Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Welcome, Dr. {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Role: {user.role}</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ marginBottom: '1rem' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/doctor/appointments" className="btn btn-primary" style={{ backgroundColor: 'var(--secondary)' }}>Today's Appointments</Link>
            <Link to="/doctor/queue" className="btn btn-outline" style={{ borderColor: 'var(--secondary)' }}>Waiting Queue</Link>
            <Link to="/doctor/records" className="btn btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>Patient Records</Link>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>
            [ Lab Tests | Pharmacy ]
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
            Note: Features to be implemented in upcoming phases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
