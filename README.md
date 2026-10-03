# SmartCare

### Privacy-Preserving Cloud-Based Telemedicine Platform

SmartCare is a research-oriented telemedicine prototype designed to provide appointment management, digital queue management, online consultation, medical records, prescriptions, laboratory booking/results, medicine/pharmacy availability, role-based access, and privacy/security controls. Importantly, the platform includes an experimental framework to compare a baseline architecture against a privacy-preserving architecture.

---

## Research Context

**Research Topic:**
“Performance and Security Trade-off Analysis of Privacy-Preserving Cloud-Based Telemedicine Architectures”

This project evaluates the performance impact of additional privacy and security controls by comparing:

### B1 — Baseline Architecture
A standard, functional telemedicine implementation without advanced security overhead.

### B2 — Privacy-Preserving Architecture
An enhanced architecture implementing strict IDOR protections, audit logging, rate limiting, and security headers. 

Both B1 and B2 were experimentally measured under controlled conditions to quantify the latency and throughput overhead introduced by privacy-preserving mechanisms.

---

## Key Features

### Patient
- Registration/login
- Appointment booking
- Digital queue/token tracking
- Online consultation
- Medical record access
- Prescription access
- Lab booking/results
- Medicine availability search

### Doctor
- Doctor authentication
- Appointment management
- Queue management
- Consultation management
- Patient medical records
- Prescription creation

### Admin
- Administrative management
- Lab management
- Medicine/pharmacy/inventory management
- Security/audit-related functionality

### Security & Privacy
- JWT authentication
- bcrypt password hashing
- role-based authorization
- ownership/IDOR protection
- audit logging
- authentication rate limiting
- security headers
- strict CORS
- generic error handling
- data minimization
- pseudonymized logging
- environment-based secrets

---

## Screenshots / Demo

*Note: Please place the uploaded screenshots in a `docs/screenshots/` folder in your repository to match these paths.*

### Application

**Home Page**
![Home](docs/screenshots/home.png)

**Authentication**
![Login](docs/screenshots/login.png)
![Register](docs/screenshots/register.png)

**Dashboards**
![Patient Dashboard](docs/screenshots/patient-dashboard.png)
![Doctor Dashboard](docs/screenshots/doctor-dashboard.png)

*(Note: Consultation, Medical Records, Admin, and Research Analysis screens are implemented but omitted from this gallery).*

---

## System Architecture

```mermaid
flowchart TD
    User([User]) --> Frontend[React + Vite Frontend]
    Frontend --> REST[REST API]
    REST --> Backend[Node.js + Express Backend]
    
    subgraph Core Modules
        Appointments
        Queue
        Consultation
        MedicalRecords[Medical Records]
        Labs
        Pharmacy
        AuditLogs[Audit Logs]
        ExperimentFramework[Experiment Framework]
    end
    
    Backend --> Auth[Authentication / RBAC / Security Middleware]
    Auth --> Core Modules
    Core Modules --> DB[(SQLite Database)]
    
    subgraph Research Layer
        B1[B1 Baseline] <--> B2[B2 Privacy-Preserving]
        B2 --> Workloads[Experimental Workloads]
        Workloads --> Measurements[Measurements]
        Measurements --> Analysis[Analysis]
        Analysis --> Results[Research Results]
    end
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express, Socket.io |
| Database | SQLite 3 |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| API | RESTful |
| Testing | Custom Node.js benchmark scripts (`fetch`) |
| Experimentation | Custom automated runner (`process.hrtime.bigint()`) |
| Analysis | Node.js aggregator, Recharts visualizations |
| Version Control | Git / GitHub |

---

## Project Structure

```text
smartcare/
├── backend/
│   ├── architecture/       # Contains scripts to toggle B1/B2 configurations
│   ├── controllers/        # Express route controllers
│   ├── experiments/        # Phase 10 & 11 benchmarking and analysis scripts
│   ├── middleware/         # Auth, RBAC, and security middleware
│   ├── routes/             # API route definitions
│   ├── db.js               # SQLite database setup and schema
│   └── index.js            # Main backend entry point
├── docs/
│   └── screenshots/        # Project screenshots
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── context/        # Auth Context
│   │   ├── data/           # Copied JSON data for research dashboard
│   │   ├── pages/          # React page views (Dashboards, Auth, Analysis)
│   │   └── App.jsx         # Main routing file
│   └── package.json        # Frontend dependencies
├── benchmark.js            # Utility script
└── README.md
```

---

## Application Workflow

```text
Register / Login
      ↓
Role Identification (Patient / Doctor / Admin)
      ↓
Appropriate Dashboard Loaded
      ↓
Patient Books Appointment
      ↓
Doctor Confirms Appointment
      ↓
Digital Queue Token Generated
      ↓
Consultation Session (Real-Time Socket)
      ↓
Doctor Generates Medical Records / Prescriptions / Lab Referrals
      ↓
Patient Views Medical Records / Labs / Pharmacy Availability
```

---

## Research Methodology

The experimental framework was built to collect quantitative data measuring the performance overhead (latency and throughput) imposed by adding privacy-preserving mechanisms (B2) on top of the baseline (B1).

- **Environment**: Local Windows execution (Frontend + Backend + DB on the same machine).
- **Backend Runtime**: Node.js
- **Database**: SQLite
- **Dataset**: Exclusively synthetic/demo data (no real medical records). Identical DB state before each run.
- **Workloads**: 9 distinct API workloads covering authentication, reads, writes, and complex joins.
- **Volume**: 100 actual requests per workload per run, with a 10-request warm-up (discarded).
- **Concurrency**: 10 parallel connections.
- **Repetitions**: 3 independent complete runs for each architecture (B1 and B2).
- **Total Measured**: 300 measured requests per workload per architecture.
- **Metrics Collected**: Mean Latency, Throughput (Requests per Second).

*Note: These measurements are prototype/local experimental results, not production cloud benchmarks.*

---

## Experimental Workloads

| # | Workload | Description |
|---|---|---|
| 1 | Patient Login | Authentication (bcrypt) and JWT generation |
| 2 | Doctor Login | Authentication and JWT generation |
| 3 | Retrieve Patient Appointments | Basic authorized GET |
| 4 | Create Appointment | Authorized POST with database insertion |
| 5 | Retrieve Doctor Queue | Authorized GET with relational joins |
| 6 | Retrieve Consultation Information | Authorized GET |
| 7 | Retrieve Patient Medical Records | Sensitive Authorized GET (Triggering B2 Audit Logging) |
| 8 | Retrieve Patient Lab Bookings | Basic authorized GET |
| 9 | Search Medicine Availability | Basic authorized GET |

---

## B1 vs B2 Architecture

| Area | B1 Baseline | B2 Privacy-Preserving |
|---|---|---|
| Authentication | Basic JWT | JWT + IP Rate Limiting (`express-rate-limit`) |
| Authorization | Coarse-grained RBAC | Strict RBAC + IDOR Protection |
| Audit Logging | None | Granular, Synchronous Audit Logs |
| Security Headers | Default Express | Helmet.js (HSTS, CSP, X-Frame-Options) |
| CORS | Generous | Strict Origin Validation |
| Error Handling | Verbose Stack Traces | Masked Generic Errors |

---

## Performance Results

The following table summarizes the aggregated mean metrics across the 3 independent runs.

*Formulas:*
`Latency Overhead (%) = ((B2 - B1) / B1) × 100`
`Throughput Change (%) = ((B2 - B1) / B1) × 100`

| Workload | B1 Mean (ms) | B2 Mean (ms) | Latency Overhead | B1 Throughput (RPS) | B2 Throughput (RPS) | Throughput Change |
|---|---:|---:|---:|---:|---:|---:|
| Patient Login | 581.34 | 665.27 | +14.44% | 14.45 | 13.25 | -8.30% |
| Doctor Login | 606.65 | 640.00 | +5.50% | 14.13 | 13.66 | -3.33% |
| Retrieve Patient Appointments | 6.73 | 4.18 | -37.89% | 1005.84 | 1354.01 | +34.61% |
| Create Appointment | 16.11 | 13.84 | -14.09% | 581.27 | 648.59 | +11.58% |
| Retrieve Doctor Queue | 4.34 | 6.96 | +60.37% | 1311.67 | 966.26 | -26.33% |
| Retrieve Consultation Information| 11.16 | 10.48 | -6.09% | 751.68 | 747.14 | -0.60% |
| **Retrieve Medical Records** | **9.82** | **29.92** | **+204.68%** | **835.52** | **296.66** | **-64.49%** |
| Retrieve Patient Lab Bookings | 4.25 | 3.50 | -17.65% | 1401.14 | 1676.29 | +19.64% |
| Search Medicine Availability | 3.24 | 2.73 | -15.74% | 1830.27 | 2103.41 | +14.92% |

---

## Important Findings

- **High Overhead on Sensitive Reads**: The `Retrieve Patient Medical Records` endpoint incurred a massive **+204.68% latency overhead**. This was directly tied to the synchronous Audit Logging mechanism required by the privacy-preserving architecture.
- **Moderate Authentication Overhead**: The rate-limiting token bucket and strict validations added approximately **5% to 14%** latency to login routines.
- **Measurement Jitter**: Several low-latency endpoints (< 15ms) demonstrated negative overhead (where B2 appeared faster). Because these endpoints execute so quickly, they are highly sensitive to OS scheduling, garbage collection, and Node.js event-loop fluctuations. These negative values are statistical noise and **do not** prove B2 is inherently faster for those operations.

---

## Security & Privacy Design

The B2 architecture introduces a privacy-preserving security architecture built with DPDP-oriented privacy considerations in mind:

- **Audit Logging**: Persists `user_id`, `action`, `resource_type`, and `timestamp` securely for accountability.
- **Rate Limiting**: Mitigates credential stuffing and brute-force attacks via token bucket algorithms.
- **IDOR Protection**: Middleware that strictly validates that the requesting user `id` matches the resource owner's `id` inside the database, preventing unauthorized horizontal access.
- **Data Minimization**: Error handlers mask database exceptions and stack traces to prevent reconnaissance.

---

## Limitations

- **Single-Node Execution**: The load generator and API server ran on the same machine, leading to CPU contention that may skew absolute throughput limits.
- **SQLite Database**: A production cloud-native deployment (e.g., PostgreSQL) would introduce network latency, altering the percentage overhead.
- **Synchronous Audit Logging**: B2 logged audits synchronously. In production, this heavy I/O would be offloaded asynchronously (e.g., Kafka) to mitigate the massive performance penalty.
- **Authentication Rate Limiting**: The auth limiter was heavily relaxed during benchmarking to prevent the tool from blocking itself.
- **Low-Latency Variability**: 3 independent runs were insufficient to completely smooth out OS-level jitter on <10ms endpoints.
- **Synthetic Data**: Exclusively demo data was used; no real patient/medical information is present.

---

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- Git

### Clone
```bash
git clone https://github.com/Atul-Kushwaha09/SmartCare-App.git
cd smartcare
```

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Environment Variables
A `.env` file is required in the `backend/` directory. Example:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
DB_NAME=smartcare.db
```
*(Note: Never commit real production secrets to version control).*

---

## API Overview

*This is a subset of the critical implemented endpoints.*

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and retrieve JWT |
| POST | `/api/auth/setup-admin` | Seed initial admin account |
| POST | `/api/appointments` | Book a new appointment |
| GET | `/api/appointments/my` | Retrieve authenticated user's appointments |
| GET | `/api/queue/doctor` | Retrieve doctor's queue tokens |
| GET | `/api/consultations/my`| Retrieve active/past consultations |
| GET | `/api/medical-records/patient`| Retrieve sensitive medical records |
| GET | `/api/lab-tests` | View available laboratory tests |
| GET | `/api/medicines` | View available medicines |

---

## Testing

The project incorporates multiple testing layers:
- **Functional Tests**: Comprehensive Node.js scripts validating authentication, RBAC, IDOR, appointment creation, queue progression, lab bookings, and pharmacy inventory (e.g., `test_phase5_security.js`, `test_phase6.js`, `test_phase7.js`).
- **Benchmark Tests**: A dedicated `benchmark.js` script to validate throughput and latency under concurrent load.
- **Experiment Execution**: Phase 10 execution generated real metrics exported to raw JSON files.
- **Analysis**: Phase 11 `analyzeResults.js` aggregated runs into the final dataset feeding the Research Dashboard.

---

## Research Reproducibility

To reproduce or verify the research findings:
1. **Raw B1 Data**: Located in `backend/experiments/raw/B1/`
2. **Raw B2 Data**: Located in `backend/experiments/raw/B2/`
3. **Processed Results**: Generated in `backend/experiments/processed/`
4. **Analysis Dashboard**: Run the frontend and navigate to `/research/analysis` (Admin login required).
5. **Experiment Configuration**: See `backend/experiments/aggregate.js` and `analyzeResults.js` for calculation methodologies.

---

## Future Work

- Evaluation using PostgreSQL or a cloud-native database.
- Multi-node deployment and testing on dedicated benchmark machines.
- Implementation of asynchronous audit logging to improve sensitive-read throughput.
- Increased workload volume (10,000+ requests) and more repetitions (e.g., N=10) to eliminate low-latency jitter.
- Additional privacy-preserving mechanisms (e.g., encryption-in-transit profiling).

---

## Academic Disclaimer

This project is a research prototype developed exclusively for experimental evaluation. The benchmark results are specific to the tested software, hardware, database, workload, and experimental configuration. They should not be interpreted as production-scale performance guarantees, and the software does not claim or certify legal compliance (e.g., HIPAA, DPDP).

---

## Author / Project Information

*(Please update this section with your details)*

- **Author / Team**: [Your Name / Team Name]
- **Contact**: [Your Email or LinkedIn]
- **Institution**: [Your University or Organization]
