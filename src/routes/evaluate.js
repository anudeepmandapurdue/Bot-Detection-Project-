const express = require("express");
const router = express.Router();

const { computeStats, decideFromStats } = require("../detection");

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip;
}

/**
 * POST /v1/evaluate
 * Single-call “usable API” endpoint:
 * - ingests request metadata
 * - stores per-IP history
 * - computes stats
 * - returns decision
 */
router.post("/", (req, res) => {
  const ip = getClientIp(req);

  const path =
    typeof req.body?.path === "string" ? req.body.path : req.originalUrl;

  const method =
    typeof req.body?.method === "string" ? req.body.method : req.method;

  const userAgent =
    typeof req.body?.userAgent === "string"
      ? req.body.userAgent
      : req.get("user-agent") || "";

  const acceptLanguage =
    typeof req.body?.acceptLanguage === "string"
      ? req.body.acceptLanguage
      : req.get("accept-language") || "";

  const evt = {
    ip,
    path,
    method,
    userAgent,
    acceptLanguage,
    timestamp: Date.now()
  };

  const ipEvents = req.app.locals.ipEvents;
  const MAX_EVENTS_PER_IP = req.app.locals.MAX_EVENTS_PER_IP;

  if (!ipEvents.has(ip)) ipEvents.set(ip, []);
  const events = ipEvents.get(ip);

  events.push(evt);

  if (events.length > MAX_EVENTS_PER_IP) {
    events.splice(0, events.length - MAX_EVENTS_PER_IP);
  }

  const stats = computeStats(events);
  const decision = decideFromStats(stats);

  res.status(200).json({
    ok: true,
    ip,
    ...decision,
    stats
  });
});

module.exports = router;
