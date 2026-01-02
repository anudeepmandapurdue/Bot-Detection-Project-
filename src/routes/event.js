const express = require('express');
const router = express.Router();

const ipEvents = new Map();

const MAX_EVENTS_PER_IP = 200;

function getClientIp(req){
    const xff = req.headers["x-forwarded-for"]; //used if there proxies
    if(typeof xff === "string" && xff.length > 0 ){
        return xff.split(",")[0].trim();
    }
    return req.ip;
}

router.post("/", (req, res) => {
    const ip = getClientIp(req);
    const path =
        typeof req.body?.path === "string"
        ? req.body.path 
        : req.originalUrl;
    const method = 
        typeof req.body?.method === "string"
        ? req.body.method
        : req.method;

    const userAgent = req.get("user-agent") || "";
    const acceptLanguage = req.get("accept-language") || "";

    const event = {
        ip, 
        path, 
        method,
        userAgent,
        acceptLanguage, 
        timestamp: Date.now()
    };

    if(!ipEvents.has(ip)){
        ipEvents.set(ip, []);
    };
    const arr = ipEvents.get(ip);
    arr.push(event);
    
    if (arr.length > MAX_EVENTS_PER_IP) {
        arr.splice(0, arr.length - MAX_EVENTS_PER_IP);
    };

    return res.status(200).json({
        ok: true,
        ip,
        stored_for_ip: arr.length
    });
});

module.exports = router;