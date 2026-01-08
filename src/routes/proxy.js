const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { computeStats, decideFromStats } = require("../detection");
const { recordEvent, getEvents } = require("../data/eventStore");
const { updateGlobalReputation, getGlobalScore } = require("../data/reputationStore");
const redis = require("../db/redis");

const router = express.Router();
router.use(async (req, res, next) => {
    const tenant = req.tenant;
    if (!tenant || !tenant.id) {
        return res.status(401).json({ error: "Unauthorized: Tenant context missing" });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. CAPTURE EVERYTHING ONCE
    const fingerprint = {
        path: req.originalUrl,
        method: req.method,
        userAgent: req.headers['user-agent'], 
        referer: req.headers['referer'],
        acceptLanguage: req.headers['accept-language'],
        os: req.headers['sec-ch-ua-platform']
    };

    console.log(`[DEBUG] Recording event for IP ${ip} - OS: ${fingerprint.os}`);

    try { 
        // 2. CHECK CACHE FIRST
        const cachedBlock = await redis.get(`block:${ip}`);
        if (cachedBlock){
            return res.status(403).json({
                error: "Access Denied",
                reason: "Cached security lockout",
                source: "Redis-Cache"
            });
        }

        // 3. RECORD THE RICH FINGERPRINT (Only call this once!)
        await recordEvent(tenant.id, ip, fingerprint);

        // 4. FETCH DATA FOR DETECTION
        const localEvents = await getEvents(tenant.id, ip);
        const globalScore = await getGlobalScore(ip);

        const stats = computeStats(localEvents);
        const decision = decideFromStats(stats);

        // 5. DECISION ENGINE
        if (decision.decision === "BLOCK" || globalScore > 50) {
            if(decision.decision === "BLOCK"){
                await updateGlobalReputation(ip, 15);
            }
            await redis.setEx(`block:${ip}`, 600, "true");
            return res.status(403).json({ 
                error: "Access Denied", 
                reason: decision.decision == "BLOCK" ? "Local Bot Behavior" : "Global malicious reputation",
                globalScore,
                stats 
            });
        }

        next();
    } catch (err) {
        console.error("Proxy Detection Error details:", err.message);
        next(); 
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