const db = require('../db');

async function recordEvent(tenantId, ip, fingerprint) {
  // Destructure for clarity
  const { path, method, userAgent, referer, acceptLanguage, os } = fingerprint;
  
  const query = `
    INSERT INTO events (
        tenant_id, ip, path, method, timestamp, 
        user_agent, referer, accept_language, operating_system
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;
  
  try {
    await db.query(query, [
      tenantId, //not needed 
      ip, 
      path, 
      method, 
      Date.now(),
      userAgent || 'unknown',
      referer || 'direct',
      acceptLanguage || 'unknown',
      os || 'unknown'
    ]);
  } catch (err) {
    console.error("Database Insert Error:", err.message);
  }
}

async function getEvents(tenantId, ip) {
  const query = `
    SELECT path, method, user_agent, referer, timestamp, accept_language, operating_system
    FROM events 
    WHERE tenant_id = $1 AND ip = $2 
    ORDER BY timestamp DESC 
    LIMIT 200
  `;
  const result = await db.query(query, [tenantId, ip]);
  return result.rows;
}

module.exports = { recordEvent, getEvents };