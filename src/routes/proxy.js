const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");
const { updateGlobalReputation, getGlobalScore } = require("../data/reputationStore");

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
            method: req.method,
            timestamp: Date.now()
        });
        //Fetch local and global data
        const localEvents = await getEvents(tenant.id, ip);
        const globalScore = await getGlobalScore(ip);

        // 3. Logic (Synchronous)
        // Ensure local events is an array to prevent computeStats from crashing
        const stats = computeStats(localEvents);
        const decision = decideFromStats(stats);

        if (decision.decision === "BLOCK" || globalScore > 50) {
            if(decision.decision === "BLOCK"){
                await updateGlobalReputation(ip, 15);
            }
            return res.status(403).json({ 
                error: "Access Denied", 
                reason: decision.decision == "BLOCK" ? "Local Bot Behavior" : "Global malicious reputation",
                globalScore,
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