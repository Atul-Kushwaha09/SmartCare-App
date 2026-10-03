/**
 * SmartCare Research Architecture
 * B2 — Privacy-Preserving Architecture
 * 
 * This module defines the advanced privacy and security mechanisms
 * being experimentally evaluated against the B1 baseline.
 */

module.exports = {
  name: "B2 - Privacy-Preserving Architecture",
  description: "Enhanced security and privacy mechanisms",
  features: {
    authentication: "Multi-factor authentication (MFA) + JWT",
    accessControl: "Advanced Role-Based Access Control (RBAC)",
    encryption: "Data-at-rest and payload encryption",
    pseudonymization: "Data pseudonymization & minimization",
    auditing: "Comprehensive audit logging",
    communication: "Secure API/inter-service communication"
  },
  implemented: [
    "JWT authentication",
    "Advanced Role-Based Access Control (RBAC)",
    "secure password hashing"
  ],
  pending: [
    "Multi-factor authentication (MFA)",
    "Data-at-rest and payload encryption",
    "Data pseudonymization & minimization",
    "Comprehensive audit logging"
  ]
};
