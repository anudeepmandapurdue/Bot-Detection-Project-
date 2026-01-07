const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");

const router = express.Router();

router.use(async (req, res, next) => {
    // SAFETY CHECK: Make sure authenticate.js actually found a tenant
    const tenant = req.tenant;
    if (!tenant || !tenant.id) {
        console.error("Proxy Error: No tenant found on request object");
        return res.status(401).json({ error: "Unauthorized: Tenant context missing" });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    try { 
        // 1. Log the event (awaiting DB)
        await recordEvent(tenant.id, ip, { 
            path: req.originalUrl, // Full path for better detection
            method: req.method 
        });

        // 2. Get history (awaiting DB)
        const events = await getEvents(tenant.id, ip);

        // 3. Logic (Synchronous)
        // Ensure events is an array to prevent computeStats from crashing
        const stats = computeStats(events || []);
        const decision = decideFromStats(stats);

        if (decision.decision === "BLOCK") {
            return res.status(403).json({ 
                error: "Access Denied", 
                reason: "Bot behavior detected", 
                stats 
            });
        }

        next();
    } catch (err) {
        // This is where your "Internal Server Error" was being caught
        console.error("Proxy Detection Error details:", err.message);
        next(); // Fallback: allow traffic if detection engine fails
    }
});

// Dynamic Proxy Forwarding
router.use("/", (req, res, next) => {
    if (!req.tenant || !req.tenant.origin) {
        return res.status(500).json({ error: "Proxy target origin missing" });
    }

    createProxyMiddleware({
        target: req.tenant.origin, 
        changeOrigin: true,
        // Optional: add error handling for the proxy itself
        onError: (err, req, res) => {
            console.error("Proxy Forwarding Error:", err);
            res.status(502).json({ error: "Bad Gateway: Origin unreachable" });
        }
    })(req, res, next);
});

module.exports = router;