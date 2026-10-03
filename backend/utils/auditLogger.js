const db = require('../db');

/**
 * Logs an audit event to the database.
 * Does not block or fail the main request if logging fails.
 */
exports.logAction = (userId, action, resourceId, details = {}) => {
  // Only log if ARCHITECTURE_MODE is B2
  if (process.env.ARCHITECTURE_MODE !== 'B2') return;

  try {
    let metadataStr = null;
    if (details) {
      // Exclude sensitive information from metadata just in case
      const safeMetadata = { ...details };
      delete safeMetadata.password;
      delete safeMetadata.token;
      
      metadataStr = JSON.stringify(safeMetadata);
    }

    db.run(
      `INSERT INTO audit_logs (user_id, action, resource_id, metadata) 
       VALUES (?, ?, ?, ?)`,
      [userId, action, resourceId, metadataStr],
      (err) => {
        if (err) {
          console.error("Audit logging failed:", err.message);
        }
      }
    );
  } catch (error) {
    console.error("Audit logging error:", error);
  }
};
