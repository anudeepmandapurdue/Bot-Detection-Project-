const express = require("express");
const router = express.Router();
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  return (typeof xff === "string" && xff.length > 0) ? xff.split(",")[0].trim() : req.ip;
}

router.post("/", async (req, res) => {
  const ip = getClientIp(req);
  const tenantId = req.tenant.id; // Scoped by middleware

  const evt = {
    ip,
    path: req.body?.path || req.originalUrl,
    method: req.body?.method || req.method,
    userAgent: req.body?.userAgent || req.get("user-agent") || "",
    timestamp: Date.now()
  };

  await recordEvent(tenantId, ip, evt);
  const events = await getEvents(tenantId, ip);

  const stats = computeStats(events);
  const decision = decideFromStats(stats);

  res.status(200).json({
    ok: true,
    ip,
    tenant: tenantId,
    ...decision,
    stats
  });
});

module.exports = router;