/**
 * Filters events based on a sliding time window.
 */
function filterEventsByWindow(events, windowMs) {
  if (!Array.isArray(events)) return [];
  
  const now = Date.now();
  const cutoff = now - windowMs;

  return events.filter(evt => {
    // Keep this fix: ensures the DB string timestamp becomes a JS number
    const ts = Number(evt.timestamp);
    return !isNaN(ts) && ts >= cutoff;
  });
}

/**
 * Derives behavioral metrics (RPM, Bursts, Path Diversity).
 */
function computeStats(events) {
  const events10s = filterEventsByWindow(events, 10_000);
  const events60s = filterEventsByWindow(events, 60_000);

  const uniquePaths = new Set();
  for (const evt of events60s) {
    if (typeof evt.path === "string") uniquePaths.add(evt.path);
  }

  return {
    count_10s: events10s.length,
    count_60s: events60s.length,
    rpm: events60s.length,
    unique_paths_60s: uniquePaths.size
  };
}

/**
 * Scoring logic to decide ALLOW / CHALLENGE / BLOCK.
 */
function decideFromStats(stats) {
  const reasons = [];
  let score = 0;

  // 1. RPM Logic
  if (stats.rpm >= 120) {
    reasons.push("very_high_rpm");
    score += 80;
  } else if (stats.rpm >= 60) {
    reasons.push("high_rpm");
    score += 40;
  }

  // 2. Burst Logic
  if (stats.count_10s >= 30) {
    reasons.push("burst_10s");
    score += 40;
  } else if (stats.count_10s >= 15) {
    reasons.push("elevated_burst_10s");
    score += 20;
  }

  // 3. Path Diversity Logic (Scraping detection)
  if (stats.unique_paths_60s >= 40) {
    reasons.push("very_many_unique_paths");
    score += 40;
  } else if (stats.unique_paths_60s >= 25) {
    reasons.push("many_unique_paths");
    score += 20;
  }

  // Final Decision Mapping
  let decision = "ALLOW";
  if (score >= 80) decision = "BLOCK";
  else if (score >= 30) decision = "CHALLENGE";

  return { decision, score, reasons };
}

module.exports = { computeStats, decideFromStats };