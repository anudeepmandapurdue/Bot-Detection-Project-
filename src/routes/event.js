const express = require("express");
const router = express.Router();
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  return (typeof xff === "string" && xff.length > 0) ? xff.split(",")[0].trim() : req.ip;
}

router.post("/", (req, res) => {
  const ip = getClientIp(req);
  const tenantId = req.tenant.id;

  const evt = {
    ip,
    path: req.body?.path || req.originalUrl,
    method: req.body?.method || req.method,
    timestamp: Date.now()
  };

  recordEvent(tenantId, ip, evt);
  const events = getEvents(tenantId, ip);

  res.status(200).json({
    ok: true,
    ip,
    tenant: tenantId,
    stored_for_ip: events.length
  });
});

router.get("/decision", (req, res) => {
  const ip = req.query.ip || getClientIp(req);
  const events = getEvents(req.tenant.id, ip);

  const stats = computeStats(events);
  const decision = decideFromStats(stats);

  res.status(200).json({
    ok: true,
    ip,
    tenant: req.tenant.id,
    ...decision,
    stats
  });
});

module.exports = router;