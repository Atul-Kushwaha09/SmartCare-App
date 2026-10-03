import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientDoctors from './pages/PatientDoctors';
import BookAppointment from './pages/BookAppointment';
import PatientAppointments from './pages/PatientAppointments';
import PatientQueue from './pages/PatientQueue';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorQueue from './pages/DoctorQueue';
import PatientConsultationRoom from './pages/PatientConsultationRoom';
import DoctorConsultationRoom from './pages/DoctorConsultationRoom';
import PatientMedicalRecords from './pages/PatientMedicalRecords';
import DoctorMedicalRecords from './pages/DoctorMedicalRecords';
import PatientLabTests from './pages/PatientLabTests';
import PatientLabBookings from './pages/PatientLabBookings';
import PatientLabResults from './pages/PatientLabResults';
import AdminLabTests from './pages/AdminLabTests';
import AdminLabBookings from './pages/AdminLabBookings';
import AdminLabResults from './pages/AdminLabResults';
import PatientMedicines from './pages/PatientMedicines';
import PatientPharmacies from './pages/PatientPharmacies';
import AdminMedicines from './pages/AdminMedicines';
import AdminPharmacies from './pages/AdminPharmacies';
import AdminInventory from './pages/AdminInventory';
import ResearchAnalysis from './pages/ResearchAnalysis';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/doctors" element={<PatientDoctors />} />
        <Route path="/patient/book-appointment/:doctorId" element={<BookAppointment />} />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route path="/patient/queue" element={<PatientQueue />} />
        <Route path="/patient/consultation/:id" element={<PatientConsultationRoom />} />
        <Route path="/patient/records" element={<PatientMedicalRecords />} />
        <Route path="/patient/lab-tests" element={<PatientLabTests />} />
        <Route path="/patient/lab-bookings" element={<PatientLabBookings />} />
        <Route path="/patient/lab-results" element={<PatientLabResults />} />
        <Route path="/patient/medicines" element={<PatientMedicines />} />
        <Route path="/patient/pharmacies" element={<PatientPharmacies />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/queue" element={<DoctorQueue />} />
        <Route path="/doctor/consultation/:id" element={<DoctorConsultationRoom />} />
        <Route path="/doctor/records" element={<DoctorMedicalRecords />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/lab-tests" element={<AdminLabTests />} />
        <Route path="/admin/lab-bookings" element={<AdminLabBookings />} />
        <Route path="/admin/lab-results" element={<AdminLabResults />} />
        <Route path="/admin/medicines" element={<AdminMedicines />} />
        <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/research/analysis" element={<ResearchAnalysis />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
