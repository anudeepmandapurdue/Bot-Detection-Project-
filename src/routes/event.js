const express = require("express");
const router = express.Router();

/**
 * In-memory storage:
 * Map<ip, Array<event>>
 */
const ipEvents = new Map();

const MAX_EVENTS_PER_IP = 200;

/**
 * Safely determine the real client IP.
 * - If behind proxies, X-Forwarded-For may contain the original client IP.
 * - Otherwise fall back to req.ip.
 */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];

  if (typeof xff === "string" && xff.length > 0) {
    // XFF can be a comma-separated list; first is original client
    return xff.split(",")[0].trim();
  }

  return req.ip;
}

/* ============================================================
   STEP 2 — EVENT INGESTION
   ============================================================ */

/**
 * POST /v1/event
 * Records a request event for later analysis.
 */
router.post("/", (req, res) => {
  const ip = getClientIp(req);

  // Prefer explicit payload fields if provided; otherwise use request metadata.
  const path =
    typeof req.body?.path === "string" ? req.body.path : req.originalUrl;

  const method =
    typeof req.body?.method === "string" ? req.body.method : req.method;

  const userAgent = req.get("user-agent") || "";
  const acceptLanguage = req.get("accept-language") || "";

  const evt = {
    ip,
    path,
    method,
    userAgent,
    acceptLanguage,
    timestamp: Date.now()
  };

  // Initialize storage for this IP if needed
  if (!ipEvents.has(ip)) {
    ipEvents.set(ip, []);
  }

  const events = ipEvents.get(ip);
  events.push(evt);

  // Enforce bounded memory (keep only last MAX_EVENTS_PER_IP)
  if (events.length > MAX_EVENTS_PER_IP) {
    events.splice(0, events.length - MAX_EVENTS_PER_IP);
  }

  res.status(200).json({
    ok: true,
    ip,
    stored_for_ip: events.length
  });
});

/* ============================================================
   STEP 3 — FEATURE COMPUTATION
   ============================================================ */

/**
 * Returns only events within the last `windowMs`.
 */
function filterEventsByWindow(events, windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;

  const recentEvents = [];

  for (const evt of events) {
    if (typeof evt.timestamp !== "number") continue;
    if (evt.timestamp >= cutoff) recentEvents.push(evt);
  }

  return recentEvents;
}

/**
 * Computes rate + behavior stats from events.
 */
function computeStats(events) {
  const events10s = filterEventsByWindow(events, 10_000);
  const events60s = filterEventsByWindow(events, 60_000);

  const uniquePathsSet = new Set();
  for (const evt of events60s) {
    if (typeof evt.path === "string") {
      uniquePathsSet.add(evt.path);
    }
  }

  return {
    count_10s: events10s.length,
    count_60s: events60s.length,
    rpm: events60s.length, // requests per minute
    unique_paths_60s: uniquePathsSet.size
  };
}

/**
 * GET /v1/event/stats
 * Returns computed behavior stats for an IP.
 *
 * Optional query param: ?ip=1.2.3.4 (debugging only)
 */
router.get("/stats", (req, res) => {
  const ipQuery = typeof req.query.ip === "string" ? req.query.ip.trim() : "";
  const ip = ipQuery.length > 0 ? ipQuery : getClientIp(req);

  const events = ipEvents.get(ip) || [];
  const stats = computeStats(events);

  res.status(200).json({
    ok: true,
    ip,
    total_events_stored: events.length,
    ...stats
  });
});

/* ============================================================
   STEP 4 — DECISION ENGINE (RULE-BASED FAST PATH)
   ============================================================ */

/**
 * Turns computed stats into an enforcement decision.
 * Returns: { decision, score, reasons }
 */
function decideFromStats(stats) {
  const reasons = [];
  let score = 0;

  // Rate-based suspicion
  if (stats.rpm >= 120) {
    reasons.push("very_high_rpm");
    score += 80;
  } else if (stats.rpm >= 60) {
    reasons.push("high_rpm");
    score += 40;
  }

  // Burstiness (many requests in 10 seconds)
  if (stats.count_10s >= 30) {
    reasons.push("burst_10s");
    score += 40;
  } else if (stats.count_10s >= 15) {
    reasons.push("elevated_burst_10s");
    score += 20;
  }

  // Many unique paths (crawler/scanner behavior)
  if (stats.unique_paths_60s >= 40) {
    reasons.push("very_many_unique_paths");
    score += 40;
  } else if (stats.unique_paths_60s >= 25) {
    reasons.push("many_unique_paths");
    score += 20;
  }

  // Final decision thresholds (tune later)
  let decision = "ALLOW";
  if (score >= 80) decision = "BLOCK";
  else if (score >= 30) decision = "CHALLENGE";

  return { decision, score, reasons };
}

/**
 * GET /v1/event/decision
 * Returns ALLOW / CHALLENGE / BLOCK for the current IP (or optional ?ip=...).
 */
router.get("/decision", (req, res) => {
  const ipQuery = typeof req.query.ip === "string" ? req.query.ip.trim() : "";
  const ip = ipQuery.length > 0 ? ipQuery : getClientIp(req);

  const events = ipEvents.get(ip) || [];
  const stats = computeStats(events);

  const { decision, score, reasons } = decideFromStats(stats);

  res.status(200).json({
    ok: true,
    ip,
    decision,
    score,
    reasons,
    stats
  });
});


router.post("/event", (req, res) => {
    const ip = ipQuery.length > 0 ? ipQuery : getClientIp(req);
    const path = typeof req.body?.path === "string" ? req.body.path : req.originalUrl
    const method = typeof req.body?.method === "string" ? req.body.method : req.method

    const userAgent = 
        typeof req.body?.userAgent === "string" ? req.body.userAgent : (req.get("user-agent") || "");

    
});
module.exports = router;
