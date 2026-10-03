import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'patient') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div className="service-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>SmartCare Patient Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Welcome, {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Role: {user.role}</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ marginBottom: '1rem' }}>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/patient/doctors" className="btn btn-primary">Book Appointment</Link>
            <Link to="/patient/appointments" className="btn btn-outline">My Appointments</Link>
            <Link to="/patient/queue" className="btn btn-outline">Digital Queue</Link>
            <Link to="/patient/records" className="btn btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>Medical Records</Link>
          </div>
          
          <h4 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Lab Services</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/patient/lab-tests" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>Book Lab Test</Link>
            <Link to="/patient/lab-bookings" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>My Lab Bookings</Link>
            <Link to="/patient/lab-results" className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }}>My Lab Results</Link>
          </div>

          <h4 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Pharmacy Services</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/patient/medicines" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>Search Medicines</Link>
            <Link to="/patient/pharmacies" className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>View Pharmacies</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
