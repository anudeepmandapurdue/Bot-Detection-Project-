const tenantEvents = new Map();
const MAX_EVENTS_PER_IP = 200;

function getIpMapForTenant(tenantId) {
  if (!tenantEvents.has(tenantId)) {
    tenantEvents.set(tenantId, new Map());
  }
  return tenantEvents.get(tenantId);
}

function recordEvent(tenantId, ip, event) {
  const ipMap = getIpMapForTenant(tenantId);

  if (!ipMap.has(ip)) {
    ipMap.set(ip, []);
  }

  const events = ipMap.get(ip);
  
  const eventWithTime = {
    ...event,
    timestamp: event.timestamp || Date.now()
  };

  events.push(eventWithTime);

  if (events.length > MAX_EVENTS_PER_IP) {
    events.splice(0, events.length - MAX_EVENTS_PER_IP);
  }

  return events;
}

function getEvents(tenantId, ip) {
  const ipMap = tenantEvents.get(tenantId);
  if (!ipMap) return [];
  
  return ipMap.get(ip) || [];
}

module.exports = {
  recordEvent,
  getEvents
};