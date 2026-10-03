import { Calendar, Users, Video, FileText, FlaskConical, Pill, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Doctor Appointments',
    description: 'Book and manage appointments securely with our specialists.',
    icon: Calendar
  },
  {
    title: 'Digital Queue',
    description: 'Real-time token management for seamless clinic visits.',
    icon: Users
  },
  {
    title: 'Online Consultation',
    description: 'Virtual consultations featuring end-to-end privacy measures.',
    icon: Video
  },
  {
    title: 'Medical Records',
    description: 'Access your digital health records safely and conveniently.',
    icon: FileText
  },
  {
    title: 'Lab Tests',
    description: 'Book diagnostic tests and view reports online securely.',
    icon: FlaskConical
  },
  {
    title: 'Medicine Availability',
    description: 'Check pharmacy inventory and reserve medicines instantly.',
    icon: Pill
  }
];

const LandingPage = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1>Secure Healthcare.<br />Smarter Access.</h1>
          <p>
            Experience a new standard of telemedicine. We prioritize your privacy while delivering lightning-fast access to healthcare services, appointments, and consultations.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <a href="#services" className="btn btn-outline">Explore Services</a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <h2>Our Core Services</h2>
            <p>Comprehensive healthcare management at your fingertips, protected by advanced privacy-preserving architecture.</p>
          </div>
          
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">
                  <service.icon size={24} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Banner Section */}
      <section className="container" style={{ paddingBottom: '5rem' }}>
        <div className="research-banner">
          <div className="research-content">
            <h3><ShieldAlert size={28} /> Research Experiment Context</h3>
            <p style={{ marginBottom: '1rem' }}>
              SmartCare is being developed as an experimental platform for studying the security-performance trade-off in cloud-based telemedicine architectures.
            </p>
            <p>
              This platform evaluates Baseline vs. Privacy-Preserving Architecture under identical workloads, incorporating DPDP-oriented privacy considerations. (Note: Results to be experimentally evaluated.)
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} SmartCare Telemedicine Research Project.</p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
