/**
 * SmartCare Research Architecture
 * B1 — Baseline Architecture
 * 
 * This module defines the properties and status of the baseline architecture
 * used in the evaluation of the cloud-based telemedicine platform.
 */

module.exports = {
  name: "B1 - Baseline Architecture",
  description: "Standard authentication and basic access control",
  features: {
    authentication: "Standard username/password (basic token)",
    accessControl: "Basic role-based access control (RBAC)",
    communication: "Standard HTTP/HTTPS without payload encryption",
    databaseAccess: "Standard direct database connection"
  },
  implemented: [
    "authentication",
    "accessControl"
  ]
};
