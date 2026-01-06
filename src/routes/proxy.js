const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");

const router = express.Router();

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    return xff.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "unknown";
}

router.use((req, res, next) => {
  const tenant = req.tenant; // Provided by authenticateTenant
  const ip = getClientIp(req);

  const evt = {
    ip,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.get("user-agent") || "",
    timestamp: Date.now()
  };

  // Record and get events scoped specifically to this tenant
  recordEvent(tenant.id, ip, evt); 
  const events = getEvents(tenant.id, ip);
  
  const stats = computeStats(events);
  const decision = decideFromStats(stats);

  if (decision.decision === "ALLOW") {
    return next();
  }

  return res.status(decision.decision === "CHALLENGE" ? 401 : 403).json({
    ok: false,
    action: decision.decision,
    tenant: tenant.id,
    ip,
    stats
  });
});

// Dynamic Proxy Forwarding to the tenant's unique origin
router.use("/", (req, res, next) => {
  createProxyMiddleware({
    target: req.tenant.origin, 
    changeOrigin: true,
    xfwd: true
  })(req, res, next);
});

module.exports = router;