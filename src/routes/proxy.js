const express = require("express");
const { createProxyMiddleware} = require("http-proxy-middleware"); //imports function that creates an HTTP proxy

const { computeStats, decideFromStats} = require("../detection");

const router = express.Router();

//creates mini router router is mounted /proxy in app.js
//sets where to forward traffic when allowed
const ORIGIN = process.env.ORIGIN_URL || "http://localhost:4000";

function getClientIp(req) {
  if (!req || !req.headers) return "unknown";
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  return req.ip || "unknown";
}

router.use((req, res, next) => {
    const ip = getClientIp(req);
    const evt = {
        ip, 
        path: req.originalUrl, 
        method: req.method, 
        userAgent: req.get("user-agent") || "", 
        acceptLanguage: req.get("accept-language") || "", 
        timestamp: Date.now()
    };

    const ipEvents = req.app.locals.ipEvents; 
    const MAX_EVENTS_PER_IP = req.app.locals.MAX_EVENTS_PER_IP;

    if(!ipEvents.has(ip)){
        ipEvents.set(ip, []);
    }
    const events = ipEvents.get(ip);
    events.push(evt); 

    if(events.length > MAX_EVENTS_PER_IP){
        events.splice(0, events.length - MAX_EVENTS_PER_IP);
    }
    const stats = computeStats(events);
    const decision = decideFromStats(stats);
    if(decision.decision === "ALLOW"){
        return next();
    }

    if(decision.decision === "CHALLENGE"){
        return res.status(401).json({
            ok: false,
            action: "CHALLENGE", 
            message: "Challenge required (demo).",
            ip, 
            ...decision, 
            stats
        });
    }

    return res.status(403).json({
        ok: false, 
        action: "BLOCK", 
        message: "Blocked by bot detection proxy", 
        ip,
        ...decision, 
        stats
    });
});

router.use(
    "/", 
    createProxyMiddleware({
        target: ORIGIN, 
        changeOrigin: true, 
        xfwd: true, 
        logLevel: "silent", 

    })
);

module.exports = router;