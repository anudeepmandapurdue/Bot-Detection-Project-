const db = require('../db');

async function recordEvent(tenantId, ip, event) {
  const query = `
    INSERT INTO events (tenant_id, ip, path, method, timestamp) 
    VALUES ($1, $2, $3, $4, $5)
  `;
  await db.query(query, [
    tenantId, 
    ip, 
    event.path, 
    event.method, 
    Date.now()
  ]);
}

async function getEvents(tenantId, ip) {
  const query = `
    SELECT path, method, timestamp 
    FROM events 
    WHERE tenant_id = $1 AND ip = $2 
    ORDER BY timestamp DESC 
    LIMIT 200
  `;
  const result = await db.query(query, [tenantId, ip]);
  return result.rows;
}

module.exports = { recordEvent, getEvents };